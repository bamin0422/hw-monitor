import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerSerialHandlers } from './ipc/serial'
import { registerTcpHandlers } from './ipc/tcp'
import { registerUdpHandlers } from './ipc/udp'
import { registerSettingsHandlers } from './ipc/settings'
import { registerAuthHandlers } from './ipc/auth'
import { registerLLMHandlers } from './ipc/llm'
import { registerBleHandlers } from './ipc/ble'
import { registerSyncHandlers } from './ipc/supabase-sync'

const isDev = process.env.NODE_ENV === 'development'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.hwmonitor')

  // Register IPC handlers (isolated so one failure doesn't block others)
  const handlers = [
    ['Serial', registerSerialHandlers],
    ['TCP', registerTcpHandlers],
    ['UDP', registerUdpHandlers],
    ['Settings', registerSettingsHandlers],
    ['Auth', registerAuthHandlers],
    ['LLM', registerLLMHandlers],
    ['BLE', registerBleHandlers],
    ['Sync', registerSyncHandlers]
  ] as const

  for (const [name, register] of handlers) {
    try {
      register()
    } catch (err) {
      console.error(`[IPC] Failed to register ${name} handlers:`, err)
    }
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
