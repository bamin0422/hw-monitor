import { ipcMain, safeStorage, shell } from 'electron'
import * as http from 'http'
import * as url from 'url'
import * as crypto from 'crypto'
import Store from 'electron-store'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

const store = new Store({ name: 'hw-monitor-settings' })

interface AuthUser {
  id: string
  email: string
  name: string
  picture: string
  provider?: 'google' | 'github'
}

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

// ── Google OAuth (legacy, kept for backward compatibility) ──

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

async function fetchGoogleUserInfo(accessToken: string): Promise<AuthUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) throw new Error('Failed to fetch user info')
  const data = (await response.json()) as { id: string; email: string; name: string; picture: string }
  return { ...data, provider: 'google' }
}

// ── Supabase OAuth ──

async function supabaseOAuth(
  supabaseUrl: string,
  supabaseKey: string,
  provider: 'github' | 'google',
  redirectUri: string,
  codeChallenge: string
): Promise<string> {
  // Build the Supabase OAuth authorization URL
  const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`)
  authUrl.searchParams.set('provider', provider)
  authUrl.searchParams.set('redirect_to', redirectUri)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 's256')
  // Force account selection on re-login (prevents auto-login to previous account)
  if (provider === 'google') {
    authUrl.searchParams.set('prompt', 'select_account')
  } else if (provider === 'github') {
    authUrl.searchParams.set('prompt', 'consent')
  }
  return authUrl.toString()
}

async function supabaseExchangeCode(
  supabaseUrl: string,
  supabaseKey: string,
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token: string; user: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string } } }> {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier
    })
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Supabase token exchange failed: ${err}`)
  }
  return response.json() as Promise<{
    access_token: string
    refresh_token: string
    user: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string } }
  }>
}

// ── User storage ──

function storeUser(user: AuthUser): void {
  const json = JSON.stringify(user)
  if (safeStorage.isEncryptionAvailable()) {
    store.set('auth_user_encrypted', safeStorage.encryptString(json))
  } else {
    store.set('auth_user', json)
  }
}

function loadStoredUser(): AuthUser | null {
  try {
    // Try new key first
    if (safeStorage.isEncryptionAvailable()) {
      const enc = store.get('auth_user_encrypted') as Buffer | undefined
      if (enc) return JSON.parse(safeStorage.decryptString(Buffer.from(enc))) as AuthUser
      // Fallback: try legacy google key
      const legacyEnc = store.get('google_user_encrypted') as Buffer | undefined
      if (legacyEnc) return JSON.parse(safeStorage.decryptString(Buffer.from(legacyEnc))) as AuthUser
    } else {
      const raw = store.get('auth_user') as string | undefined
      if (raw) return JSON.parse(raw) as AuthUser
      const legacyRaw = store.get('google_user') as string | undefined
      if (legacyRaw) return JSON.parse(legacyRaw) as AuthUser
    }
  } catch {
    // ignore
  }
  return null
}

function clearStoredUser(): void {
  // Auth tokens
  store.delete('auth_user_encrypted')
  store.delete('auth_user')
  store.delete('google_user_encrypted')
  store.delete('google_user')
  store.delete('supabase_access_token')
  store.delete('supabase_refresh_token')
  // User-specific data (connections, API keys, preferences)
  store.delete('savedConnections')
  store.delete('anthropicApiKey')
  store.delete('anthropicApiKey_encrypted')
  store.delete('openaiApiKey')
  store.delete('openaiApiKey_encrypted')
  store.delete('googleAiKey')
  store.delete('googleAiKey_encrypted')
  store.delete('groqApiKey')
  store.delete('groqApiKey_encrypted')
  store.delete('openrouterApiKey')
  store.delete('openrouterApiKey_encrypted')
  store.delete('model')
  store.delete('temperature')
  store.delete('maxTokens')
  store.delete('ollamaUrl')
}

function storeTokens(accessToken: string, refreshToken: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    store.set('supabase_access_token', safeStorage.encryptString(accessToken))
    store.set('supabase_refresh_token', safeStorage.encryptString(refreshToken))
  } else {
    store.set('supabase_access_token', accessToken)
    store.set('supabase_refresh_token', refreshToken)
  }
}

function getStoredRefreshToken(): string | null {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const enc = store.get('supabase_refresh_token') as Buffer | undefined
      if (enc) return safeStorage.decryptString(Buffer.from(enc))
    } else {
      return (store.get('supabase_refresh_token') as string) || null
    }
  } catch {
    // ignore
  }
  return null
}

function getStoredAccessToken(): string | null {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const enc = store.get('supabase_access_token') as Buffer | undefined
      if (enc) return safeStorage.decryptString(Buffer.from(enc))
    } else {
      return (store.get('supabase_access_token') as string) || null
    }
  } catch {
    // ignore
  }
  return null
}

async function refreshAccessToken(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return { success: false, error: 'No refresh token' }

  const supabaseUrl = SUPABASE_URL || (store.get('supabaseUrl') as string) || ''
  const supabaseKey = SUPABASE_ANON_KEY || (store.get('supabaseKey') as string) || ''
  if (!supabaseUrl || !supabaseKey) return { success: false, error: 'Supabase not configured' }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (!response.ok) {
      // Don't clear stored user — allow offline auto-login with cached data
      return { success: false, error: 'Session expired. Please login again.' }
    }

    const data = await response.json() as {
      access_token: string
      refresh_token: string
      user: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string } }
    }

    storeTokens(data.access_token, data.refresh_token)

    const meta = data.user.user_metadata || {}
    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || '',
      name: meta.full_name || meta.name || data.user.email || 'User',
      picture: meta.avatar_url || meta.picture || ''
    }
    storeUser(user)

    return { success: true, user }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── Shared callback server helper ──

function createCallbackServer(
  onCode: (code: string, port: number) => Promise<{ user: AuthUser }>,
  onError: (error: string) => void
): Promise<void> {
  return new Promise<void>((resolve) => {
    let port = 0

    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url ?? '', true)
      if (parsed.pathname !== '/' && parsed.pathname !== '/auth/callback') return

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
        onError(error ?? 'No authorization code received')
        resolve()
        return
      }

      try {
        const result = await onCode(code, port)
        storeUser(result.user)
        res.end(htmlClose(`${result.user.name}님, 로그인되었습니다!`))
        server.close()
        resolve()
      } catch (err) {
        res.end(htmlClose('토큰 교환 중 오류가 발생했습니다.'))
        server.close()
        onError(String(err))
        resolve()
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number }
      port = addr.port
    })

    // 5 minute timeout
    setTimeout(() => {
      if (server.listening) {
        server.close()
        onError('Authentication timed out (5 minutes)')
        resolve()
      }
    }, 5 * 60 * 1000)
  })
}

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:get-user', () => loadStoredUser())

  ipcMain.handle('auth:logout', async () => {
    // Revoke session on Supabase server
    const accessToken = getStoredAccessToken()
    const supabaseUrl = SUPABASE_URL || (store.get('supabaseUrl') as string) || ''
    const supabaseKey = SUPABASE_ANON_KEY || (store.get('supabaseKey') as string) || ''
    if (accessToken && supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`
          }
        })
      } catch {
        // Best-effort logout
      }
    }
    clearStoredUser()
    return { success: true }
  })

  ipcMain.handle('auth:refresh-token', async () => {
    return refreshAccessToken()
  })

  // Legacy Google OAuth
  ipcMain.handle('auth:google-login', (_, clientId: string, clientSecret: string) => {
    return new Promise<{ success: boolean; user?: AuthUser; error?: string }>((resolve) => {
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
          const user = await fetchGoogleUserInfo(tokens.access_token)
          storeUser(user)
          res.end(htmlClose(`${user.name}님, 로그인되었습니다!`))
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

      setTimeout(() => {
        if (server.listening) {
          server.close()
          resolve({ success: false, error: 'Authentication timed out (5 minutes)' })
        }
      }, 5 * 60 * 1000)
    })
  })

  // Simple login (uses developer-configured Supabase credentials)
  ipcMain.handle(
    'auth:login',
    (_, provider: 'github' | 'google') => {
      // Read Supabase config: config.ts constants → electron-store fallback
      const supabaseUrl = SUPABASE_URL || (store.get('supabaseUrl') as string) || ''
      const supabaseKey = SUPABASE_ANON_KEY || (store.get('supabaseKey') as string) || ''

      if (!supabaseUrl || !supabaseKey) {
        return Promise.resolve({
          success: false,
          error: 'Supabase is not configured. Please contact the administrator.'
        })
      }

      return new Promise<{ success: boolean; user?: AuthUser; error?: string }>((resolve) => {
        const codeVerifier = generateCodeVerifier()
        const codeChallenge = generateCodeChallenge(codeVerifier)
        let port = 0

        const server = http.createServer(async (req, res) => {
          const parsed = url.parse(req.url ?? '', true)
          if (parsed.pathname !== '/auth/callback' && parsed.pathname !== '/') return

          const code = parsed.query.code as string | undefined
          const error = parsed.query.error as string | undefined

          const htmlClose = (msg: string) => `
            <html><body style="font-family:sans-serif;text-align:center;padding:48px;background:#0a0a0a;color:#e2e8f0">
              <h2>${msg}</h2><p style="color:#64748b">You can close this window and return to HW Monitor.</p>
            </body></html>`

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })

          if (error || !code) {
            res.end(htmlClose('Authentication failed.'))
            server.close()
            resolve({ success: false, error: error ?? 'No authorization code received' })
            return
          }

          try {
            const tokenData = await supabaseExchangeCode(supabaseUrl, supabaseKey, code, codeVerifier)
            const meta = tokenData.user.user_metadata || {}
            const user: AuthUser = {
              id: tokenData.user.id,
              email: tokenData.user.email || '',
              name: meta.full_name || meta.name || tokenData.user.email || 'User',
              picture: meta.avatar_url || meta.picture || '',
              provider
            }

            storeTokens(tokenData.access_token, tokenData.refresh_token)
            storeUser(user)
            res.end(htmlClose(`Welcome, ${user.name}!`))
            server.close()
            resolve({ success: true, user })
          } catch (err) {
            res.end(htmlClose('Token exchange error.'))
            server.close()
            resolve({ success: false, error: String(err) })
          }
        })

        server.listen(0, '127.0.0.1', () => {
          const addr = server.address() as { port: number }
          port = addr.port
          const redirectUri = `http://127.0.0.1:${port}/auth/callback`

          const authUrl = supabaseOAuth(supabaseUrl, supabaseKey, provider, redirectUri, codeChallenge)
          authUrl.then((authUrlStr) => {
            shell.openExternal(authUrlStr)
          })
        })

        setTimeout(() => {
          if (server.listening) {
            server.close()
            resolve({ success: false, error: 'Authentication timed out (5 minutes)' })
          }
        }, 5 * 60 * 1000)
      })
    }
  )

  // Supabase OAuth (GitHub + Google) — legacy: requires explicit URL/key
  ipcMain.handle(
    'auth:supabase-login',
    (_, supabaseUrl: string, supabaseKey: string, provider: 'github' | 'google') => {
      return new Promise<{ success: boolean; user?: AuthUser; error?: string }>((resolve) => {
        const codeVerifier = generateCodeVerifier()
        const codeChallenge = generateCodeChallenge(codeVerifier)
        let port = 0

        const server = http.createServer(async (req, res) => {
          const parsed = url.parse(req.url ?? '', true)
          if (parsed.pathname !== '/auth/callback' && parsed.pathname !== '/') return

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
            const tokenData = await supabaseExchangeCode(supabaseUrl, supabaseKey, code, codeVerifier)
            const meta = tokenData.user.user_metadata || {}
            const user: AuthUser = {
              id: tokenData.user.id,
              email: tokenData.user.email || '',
              name: meta.full_name || meta.name || tokenData.user.email || 'User',
              picture: meta.avatar_url || meta.picture || '',
              provider
            }

            storeTokens(tokenData.access_token, tokenData.refresh_token)
            storeUser(user)
            res.end(htmlClose(`${user.name}님, 로그인되었습니다!`))
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
          const redirectUri = `http://127.0.0.1:${port}/auth/callback`

          const authUrl = supabaseOAuth(supabaseUrl, supabaseKey, provider, redirectUri, codeChallenge)
          authUrl.then((authUrlStr) => {
            shell.openExternal(authUrlStr)
          })
        })

        setTimeout(() => {
          if (server.listening) {
            server.close()
            resolve({ success: false, error: 'Authentication timed out (5 minutes)' })
          }
        }, 5 * 60 * 1000)
      })
    }
  )
}
