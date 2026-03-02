import { ipcMain, safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store({
  name: 'hw-monitor-settings'
})

const ENCRYPTED_KEYS = ['anthropicApiKey', 'googleClientId', 'googleClientSecret', 'googleAiKey']

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_, key: string) => {
    try {
      if (ENCRYPTED_KEYS.includes(key) && safeStorage.isEncryptionAvailable()) {
        const encrypted = store.get(key + '_encrypted') as Buffer | undefined
        if (encrypted) {
          return safeStorage.decryptString(Buffer.from(encrypted))
        }
        return ''
      }
      return store.get(key)
    } catch {
      return null
    }
  })

  ipcMain.handle('settings:set', (_, key: string, value: unknown) => {
    try {
      if (ENCRYPTED_KEYS.includes(key) && safeStorage.isEncryptionAvailable() && typeof value === 'string') {
        const encrypted = safeStorage.encryptString(value)
        store.set(key + '_encrypted', encrypted)
      } else {
        store.set(key, value)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:get-all', () => {
    try {
      const all = store.store
      // Remove encrypted raw values from response
      const safe: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(all)) {
        if (!key.endsWith('_encrypted')) {
          safe[key] = value
        }
      }
      return safe
    } catch {
      return {}
    }
  })
}
