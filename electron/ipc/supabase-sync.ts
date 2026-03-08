import { ipcMain, safeStorage } from 'electron'
import Store from 'electron-store'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

const store = new Store({ name: 'hw-monitor-settings' })

interface UserSettings {
  api_keys?: {
    anthropicApiKey?: string
    openaiApiKey?: string
    googleAiKey?: string
    groqApiKey?: string
    openrouterApiKey?: string
  }
  connection_configs?: {
    id: string
    type: string
    label: string
    customLabel?: string
    config: Record<string, unknown>
    encoding: string
  }[]
  preferences?: {
    model?: string
    temperature?: number
    maxTokens?: number
    ollamaUrl?: string
    locale?: string
  }
}

function getAccessToken(): string | null {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const enc = store.get('supabase_access_token') as Buffer | undefined
      if (enc) return safeStorage.decryptString(Buffer.from(enc))
    }
  } catch {
    // ignore
  }
  return null
}

function getUserId(): string | null {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const enc = store.get('auth_user_encrypted') as Buffer | undefined
      if (enc) {
        const user = JSON.parse(safeStorage.decryptString(Buffer.from(enc)))
        return user.id || null
      }
    } else {
      const raw = store.get('auth_user') as string | undefined
      if (raw) {
        const user = JSON.parse(raw)
        return user.id || null
      }
    }
  } catch {
    // ignore
  }
  return null
}

async function supabaseRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<{ data: unknown; error: string | null }> {
  const url = SUPABASE_URL || (store.get('supabaseUrl') as string) || ''
  const anonKey = SUPABASE_ANON_KEY || (store.get('supabaseKey') as string) || ''
  const accessToken = getAccessToken()

  if (!url || !anonKey) {
    return { data: null, error: 'Supabase not configured' }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
    Prefer: method === 'POST' ? 'return=representation,resolution=merge-duplicates' : 'return=representation'
  }

  try {
    const response = await fetch(`${url}/rest/v1${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const text = await response.text()
      return { data: null, error: `Supabase error ${response.status}: ${text}` }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export function registerSyncHandlers(): void {
  // Load user settings from Supabase
  ipcMain.handle('sync:load', async () => {
    const userId = getUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const { data, error } = await supabaseRequest(
      'GET',
      `/user_settings?user_id=eq.${userId}&select=*`
    )

    if (error) return { success: false, error }

    const rows = data as UserSettings[]
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: true, settings: null }
    }

    const settings = rows[0]

    // Write loaded settings to local electron-store for offline use
    if (settings.api_keys) {
      const keys = settings.api_keys
      if (keys.anthropicApiKey) encryptAndStore('anthropicApiKey', keys.anthropicApiKey)
      if (keys.openaiApiKey) encryptAndStore('openaiApiKey', keys.openaiApiKey)
      if (keys.googleAiKey) encryptAndStore('googleAiKey', keys.googleAiKey)
      if (keys.groqApiKey) encryptAndStore('groqApiKey', keys.groqApiKey)
      if (keys.openrouterApiKey) encryptAndStore('openrouterApiKey', keys.openrouterApiKey)
    }

    if (settings.preferences) {
      const prefs = settings.preferences
      if (prefs.model) store.set('model', prefs.model)
      if (prefs.temperature !== undefined) store.set('temperature', prefs.temperature)
      if (prefs.maxTokens !== undefined) store.set('maxTokens', prefs.maxTokens)
      if (prefs.ollamaUrl) store.set('ollamaUrl', prefs.ollamaUrl)
      if (prefs.locale) store.set('locale', prefs.locale)
    }

    if (settings.connection_configs) {
      store.set('savedConnections', settings.connection_configs)
    }

    return { success: true, settings }
  })

  // Save user settings to Supabase (primary store) + cache locally
  ipcMain.handle('sync:save', async (_, partialSettings: Partial<UserSettings>) => {
    const userId = getUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const payload = {
      user_id: userId,
      ...partialSettings,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabaseRequest('POST', '/user_settings', payload)

    if (error) return { success: false, error }

    // Cache to electron-store for offline access
    if (partialSettings.api_keys) {
      const keys = partialSettings.api_keys
      if (keys.anthropicApiKey !== undefined) encryptAndStore('anthropicApiKey', keys.anthropicApiKey || '')
      if (keys.openaiApiKey !== undefined) encryptAndStore('openaiApiKey', keys.openaiApiKey || '')
      if (keys.googleAiKey !== undefined) encryptAndStore('googleAiKey', keys.googleAiKey || '')
      if (keys.groqApiKey !== undefined) encryptAndStore('groqApiKey', keys.groqApiKey || '')
      if (keys.openrouterApiKey !== undefined) encryptAndStore('openrouterApiKey', keys.openrouterApiKey || '')
    }
    if (partialSettings.preferences) {
      const prefs = partialSettings.preferences
      if (prefs.model !== undefined) store.set('model', prefs.model)
      if (prefs.temperature !== undefined) store.set('temperature', prefs.temperature)
      if (prefs.maxTokens !== undefined) store.set('maxTokens', prefs.maxTokens)
      if (prefs.ollamaUrl !== undefined) store.set('ollamaUrl', prefs.ollamaUrl)
      if (prefs.locale !== undefined) store.set('locale', prefs.locale)
    }
    if (partialSettings.connection_configs) {
      store.set('savedConnections', partialSettings.connection_configs)
    }

    return { success: true }
  })

  // ── Communication Sessions ──

  // Save a communication session
  ipcMain.handle(
    'session:save',
    async (
      _,
      sessionData: {
        sessionName: string
        connections: {
          id: string
          type: string
          label: string
          customLabel?: string
          config: Record<string, unknown>
          encoding: string
        }[]
        recentLogs: Record<
          string,
          { timestamp: number; direction: string; hex: string; ascii: string }[]
        >
      }
    ) => {
      const userId = getUserId()
      if (!userId) return { success: false, error: 'Not authenticated' }

      const payload = {
        user_id: userId,
        session_name: sessionData.sessionName,
        connections: sessionData.connections,
        recent_logs: sessionData.recentLogs,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseRequest('POST', '/communication_sessions', payload)
      if (error) return { success: false, error }
      return { success: true, data }
    }
  )

  // List all sessions for the current user
  ipcMain.handle('session:list', async () => {
    const userId = getUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const { data, error } = await supabaseRequest(
      'GET',
      `/communication_sessions?user_id=eq.${userId}&select=id,session_name,connections,created_at,updated_at&order=updated_at.desc`
    )

    if (error) return { success: false, error }
    return { success: true, sessions: data }
  })

  // Load a specific session
  ipcMain.handle('session:load', async (_, sessionId: string) => {
    const userId = getUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const { data, error } = await supabaseRequest(
      'GET',
      `/communication_sessions?id=eq.${sessionId}&user_id=eq.${userId}&select=*`
    )

    if (error) return { success: false, error }
    const rows = data as Record<string, unknown>[]
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: 'Session not found' }
    }
    return { success: true, session: rows[0] }
  })

  // Delete a session
  ipcMain.handle('session:delete', async (_, sessionId: string) => {
    const userId = getUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const { error } = await supabaseRequest(
      'DELETE',
      `/communication_sessions?id=eq.${sessionId}&user_id=eq.${userId}`
    )

    if (error) return { success: false, error }
    return { success: true }
  })

  // Update a session
  ipcMain.handle(
    'session:update',
    async (
      _,
      sessionId: string,
      sessionData: {
        sessionName?: string
        connections?: {
          id: string
          type: string
          label: string
          customLabel?: string
          config: Record<string, unknown>
          encoding: string
        }[]
        recentLogs?: Record<
          string,
          { timestamp: number; direction: string; hex: string; ascii: string }[]
        >
      }
    ) => {
      const userId = getUserId()
      if (!userId) return { success: false, error: 'Not authenticated' }

      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (sessionData.sessionName !== undefined) payload.session_name = sessionData.sessionName
      if (sessionData.connections !== undefined) payload.connections = sessionData.connections
      if (sessionData.recentLogs !== undefined) payload.recent_logs = sessionData.recentLogs

      const { error } = await supabaseRequest(
        'PATCH',
        `/communication_sessions?id=eq.${sessionId}&user_id=eq.${userId}`,
        payload
      )

      if (error) return { success: false, error }
      return { success: true }
    }
  )

  // Save all current local settings to Supabase
  ipcMain.handle('sync:save-all', async () => {
    const userId = getUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const apiKeys: UserSettings['api_keys'] = {
      anthropicApiKey: decryptFromStore('anthropicApiKey'),
      openaiApiKey: decryptFromStore('openaiApiKey'),
      googleAiKey: decryptFromStore('googleAiKey'),
      groqApiKey: decryptFromStore('groqApiKey'),
      openrouterApiKey: decryptFromStore('openrouterApiKey')
    }

    const preferences: UserSettings['preferences'] = {
      model: (store.get('model') as string) || undefined,
      temperature: store.get('temperature') as number | undefined,
      maxTokens: store.get('maxTokens') as number | undefined,
      ollamaUrl: (store.get('ollamaUrl') as string) || undefined,
      locale: (store.get('locale') as string) || undefined
    }

    const connectionConfigs = (store.get('savedConnections') as UserSettings['connection_configs']) || []

    const payload = {
      user_id: userId,
      api_keys: apiKeys,
      connection_configs: connectionConfigs,
      preferences,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabaseRequest('POST', '/user_settings', payload)

    if (error) return { success: false, error }
    return { success: true }
  })
}

function encryptAndStore(key: string, value: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    store.set(key + '_encrypted', safeStorage.encryptString(value))
  } else {
    store.set(key, value)
  }
}

function decryptFromStore(key: string): string | undefined {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const enc = store.get(key + '_encrypted') as Buffer | undefined
      if (enc) return safeStorage.decryptString(Buffer.from(enc))
    }
    return (store.get(key) as string) || undefined
  } catch {
    return undefined
  }
}
