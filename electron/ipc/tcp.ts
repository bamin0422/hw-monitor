import { ipcMain, BrowserWindow } from 'electron'
import * as net from 'net'

interface TcpClientConfig {
  connId: string
  host: string
  port: number
  autoReconnect?: boolean
}

interface TcpServerConfig {
  connId: string
  host?: string
  port: number
}

const connections = new Map<string, net.Socket | net.Server>()

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] || null
}

export function registerTcpHandlers(): void {
  // TCP Client: connect
  ipcMain.handle('tcp:connect', async (_, config: TcpClientConfig) => {
    try {
      if (connections.has(config.connId)) {
        return { success: false, error: 'Connection already exists' }
      }

      const socket = new net.Socket()

      await new Promise<void>((resolve, reject) => {
        socket.connect(config.port, config.host, resolve)
        socket.once('error', reject)
      })

      socket.on('data', (data: Buffer) => {
        const win = getMainWindow()
        win?.webContents.send('tcp:data', config.connId, data)
      })

      socket.on('error', (err) => {
        const win = getMainWindow()
        win?.webContents.send('tcp:error', config.connId, err.message)
      })

      socket.on('close', () => {
        const win = getMainWindow()
        win?.webContents.send('tcp:disconnect', config.connId)
        connections.delete(config.connId)
      })

      connections.set(config.connId, socket)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // TCP Server: listen
  ipcMain.handle('tcp:listen', async (_, config: TcpServerConfig) => {
    try {
      if (connections.has(config.connId)) {
        return { success: false, error: 'Server already exists' }
      }

      const server = net.createServer((clientSocket) => {
        const clientAddr = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`
        const win = getMainWindow()
        win?.webContents.send('tcp:client-connect', config.connId, clientAddr)

        clientSocket.on('data', (data: Buffer) => {
          win?.webContents.send('tcp:data', config.connId, data, clientAddr)
        })

        clientSocket.on('close', () => {
          win?.webContents.send('tcp:client-disconnect', config.connId, clientAddr)
        })

        clientSocket.on('error', (err) => {
          win?.webContents.send('tcp:error', config.connId, `Client ${clientAddr}: ${err.message}`)
        })
      })

      await new Promise<void>((resolve, reject) => {
        server.listen(config.port, config.host || '0.0.0.0', resolve)
        server.once('error', reject)
      })

      server.on('error', (err) => {
        const win = getMainWindow()
        win?.webContents.send('tcp:error', config.connId, err.message)
      })

      connections.set(config.connId, server)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Close TCP connection/server
  ipcMain.handle('tcp:close', async (_, connId: string) => {
    try {
      const conn = connections.get(connId)
      if (!conn) return { success: false, error: 'Connection not found' }

      await new Promise<void>((resolve) => {
        if (conn instanceof net.Socket) {
          conn.destroy()
        } else {
          (conn as net.Server).close()
        }
        resolve()
      })

      connections.delete(connId)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Send data over TCP
  ipcMain.handle(
    'tcp:send',
    async (_, connId: string, data: string, encoding: 'hex' | 'ascii') => {
      try {
        const conn = connections.get(connId)
        if (!conn || conn instanceof net.Server) {
          return { success: false, error: 'Not a TCP client connection' }
        }

        let buffer: Buffer
        if (encoding === 'hex') {
          buffer = Buffer.from(data.replace(/\s+/g, ''), 'hex')
        } else {
          buffer = Buffer.from(data, 'utf8')
        }

        await new Promise<void>((resolve, reject) => {
          ;(conn as net.Socket).write(buffer, (err) => {
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
