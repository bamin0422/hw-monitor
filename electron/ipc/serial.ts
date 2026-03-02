import { ipcMain, BrowserWindow } from 'electron'
import { SerialPort } from 'serialport'

interface SerialConfig {
  portId: string
  path: string
  baudRate: number
  dataBits: 5 | 6 | 7 | 8
  stopBits: 1 | 1.5 | 2
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space'
  flowControl: 'none' | 'hardware' | 'software'
}

const openPorts = new Map<string, SerialPort>()

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] || null
}

export function registerSerialHandlers(): void {
  // List available serial ports
  ipcMain.handle('serial:list-ports', async () => {
    try {
      const ports = await SerialPort.list()
      return { success: true, ports }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Open serial port
  ipcMain.handle('serial:open', async (_, config: SerialConfig) => {
    try {
      if (openPorts.has(config.portId)) {
        return { success: false, error: 'Port already open' }
      }

      const port = new SerialPort({
        path: config.path,
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity,
        rtscts: config.flowControl === 'hardware',
        xon: config.flowControl === 'software',
        xoff: config.flowControl === 'software',
        autoOpen: false
      })

      await new Promise<void>((resolve, reject) => {
        port.open((err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      port.on('data', (data: Buffer) => {
        const win = getMainWindow()
        win?.webContents.send('serial:data', config.portId, data)
      })

      port.on('error', (err) => {
        const win = getMainWindow()
        win?.webContents.send('serial:error', config.portId, err.message)
        openPorts.delete(config.portId)
      })

      port.on('close', () => {
        const win = getMainWindow()
        win?.webContents.send('serial:disconnect', config.portId)
        openPorts.delete(config.portId)
      })

      openPorts.set(config.portId, port)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Close serial port
  ipcMain.handle('serial:close', async (_, portId: string) => {
    try {
      const port = openPorts.get(portId)
      if (!port) return { success: false, error: 'Port not open' }

      await new Promise<void>((resolve, reject) => {
        port.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      openPorts.delete(portId)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Send data through serial port
  ipcMain.handle(
    'serial:send',
    async (_, portId: string, data: string, encoding: 'hex' | 'ascii') => {
      try {
        const port = openPorts.get(portId)
        if (!port) return { success: false, error: 'Port not open' }

        let buffer: Buffer
        if (encoding === 'hex') {
          const hexStr = data.replace(/\s+/g, '')
          buffer = Buffer.from(hexStr, 'hex')
        } else {
          buffer = Buffer.from(data, 'utf8')
        }

        await new Promise<void>((resolve, reject) => {
          port.write(buffer, (err) => {
            if (err) reject(err)
            else resolve()
          })
        })

        return { success: true, bytesSent: buffer.length }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )
}
