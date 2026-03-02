import { ipcMain, safeStorage, shell } from 'electron'
import * as http from 'http'
import * as url from 'url'
import * as crypto from 'crypto'
import Store from 'electron-store'

const store = new Store({ name: 'hw-monitor-settings' })

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
}

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  codeVerifier: string
): Promise<{ access_token: string }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    })
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return response.json() as Promise<{ access_token: string }>
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) throw new Error('Failed to fetch user info')
  return response.json() as Promise<GoogleUserInfo>
}

function storeUser(user: GoogleUserInfo): void {
  const json = JSON.stringify(user)
  if (safeStorage.isEncryptionAvailable()) {
    store.set('google_user_encrypted', safeStorage.encryptString(json))
  } else {
    store.set('google_user', json)
  }
}

function loadStoredUser(): GoogleUserInfo | null {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const enc = store.get('google_user_encrypted') as Buffer | undefined
      if (enc) return JSON.parse(safeStorage.decryptString(Buffer.from(enc))) as GoogleUserInfo
    } else {
      const raw = store.get('google_user') as string | undefined
      if (raw) return JSON.parse(raw) as GoogleUserInfo
    }
  } catch {
    // ignore
  }
  return null
}

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:get-user', () => loadStoredUser())

  ipcMain.handle('auth:logout', () => {
    store.delete('google_user_encrypted')
    store.delete('google_user')
    return { success: true }
  })

  ipcMain.handle('auth:google-login', (_, clientId: string, clientSecret: string) => {
    return new Promise<{ success: boolean; user?: GoogleUserInfo; error?: string }>((resolve) => {
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = generateCodeChallenge(codeVerifier)
      let port = 0

      const server = http.createServer(async (req, res) => {
        const parsed = url.parse(req.url ?? '', true)
        if (parsed.pathname !== '/') return

        const code = parsed.query.code as string | undefined
        const error = parsed.query.error as string | undefined

        const htmlClose = (msg: string) => `
          <html><body style="font-family:sans-serif;text-align:center;padding:48px;background:#0a0a0a;color:#e2e8f0">
            <h2>${msg}</h2><p style="color:#64748b">이 창을 닫고 HW Monitor로 돌아가세요.</p>
          </body></html>`

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })

        if (error || !code) {
          res.end(htmlClose('인증에 실패했습니다.'))
          server.close()
          resolve({ success: false, error: error ?? 'No authorization code received' })
          return
        }

        try {
          const redirectUri = `http://127.0.0.1:${port}/`
          const tokens = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri, codeVerifier)
          const user = await fetchUserInfo(tokens.access_token)
          storeUser(user)
          res.end(htmlClose(`✅ ${user.name}님, 로그인되었습니다!`))
          server.close()
          resolve({ success: true, user })
        } catch (err) {
          res.end(htmlClose('토큰 교환 중 오류가 발생했습니다.'))
          server.close()
          resolve({ success: false, error: String(err) })
        }
      })

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number }
        port = addr.port
        const redirectUri = `http://127.0.0.1:${port}/`

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        authUrl.searchParams.set('client_id', clientId)
        authUrl.searchParams.set('redirect_uri', redirectUri)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('scope', 'openid profile email')
        authUrl.searchParams.set('code_challenge', codeChallenge)
        authUrl.searchParams.set('code_challenge_method', 'S256')
        authUrl.searchParams.set('access_type', 'offline')
        authUrl.searchParams.set('prompt', 'consent')

        shell.openExternal(authUrl.toString())
      })

      // 5분 타임아웃
      setTimeout(() => {
        if (server.listening) {
          server.close()
          resolve({ success: false, error: 'Authentication timed out (5 minutes)' })
        }
      }, 5 * 60 * 1000)
    })
  })
}
