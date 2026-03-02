import { ipcMain, BrowserWindow } from 'electron'
import * as dgram from 'dgram'

interface UdpConfig {
  sockId: string
  localPort?: number
  localHost?: string
}

const sockets = new Map<string, dgram.Socket>()

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] || null
}

export function registerUdpHandlers(): void {
  // Bind UDP socket
  ipcMain.handle('udp:bind', async (_, config: UdpConfig) => {
    try {
      if (sockets.has(config.sockId)) {
        return { success: false, error: 'Socket already exists' }
      }

      const socket = dgram.createSocket('udp4')

      socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
        const win = getMainWindow()
        win?.webContents.send('udp:data', config.sockId, data, {
          address: rinfo.address,
          port: rinfo.port
        })
      })

      socket.on('error', (err) => {
        const win = getMainWindow()
        win?.webContents.send('udp:error', config.sockId, err.message)
      })

      await new Promise<void>((resolve, reject) => {
        socket.bind(config.localPort || 0, config.localHost || '0.0.0.0', () => resolve())
        socket.once('error', reject)
      })

      sockets.set(config.sockId, socket)
      const addr = socket.address()
      return { success: true, port: addr.port }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Close UDP socket
  ipcMain.handle('udp:close', async (_, sockId: string) => {
    try {
      const socket = sockets.get(sockId)
      if (!socket) return { success: false, error: 'Socket not found' }

      await new Promise<void>((resolve) => socket.close(resolve))
      sockets.delete(sockId)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Send UDP datagram
  ipcMain.handle(
    'udp:send',
    async (_, sockId: string, host: string, port: number, data: string, encoding: 'hex' | 'ascii') => {
      try {
        let socket = sockets.get(sockId)
        let autoClose = false

        if (!socket) {
          // Create temporary socket for send-only
          socket = dgram.createSocket('udp4')
          autoClose = true
        }

        let buffer: Buffer
        if (encoding === 'hex') {
          buffer = Buffer.from(data.replace(/\s+/g, ''), 'hex')
        } else {
          buffer = Buffer.from(data, 'utf8')
        }

        await new Promise<void>((resolve, reject) => {
          socket!.send(buffer, port, host, (err) => {
            if (err) reject(err)
            else resolve()
          })
        })

        if (autoClose) socket.close()
        return { success: true, bytesSent: buffer.length }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )
}
