import { ipcMain, BrowserWindow } from 'electron'

interface BleDevice {
  id: string
  name: string
  rssi: number
  address: string
}

interface BleService {
  uuid: string
  characteristics: { uuid: string; properties: string[] }[]
}

let noble: typeof import('@abandonware/noble') | null = null
const connectedPeripherals = new Map<string, import('@abandonware/noble').Peripheral>()
const subscribedCharacteristics = new Map<string, import('@abandonware/noble').Characteristic>()

function loadNoble(): typeof import('@abandonware/noble') | null {
  if (noble) return noble
  try {
    noble = require('@abandonware/noble')
    return noble
  } catch {
    console.warn('BLE: @abandonware/noble not available. BLE features disabled.')
    return null
  }
}

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  return windows.length > 0 ? windows[0] : null
}

export function registerBleHandlers(): void {
  ipcMain.handle('ble:available', () => {
    return { available: loadNoble() !== null }
  })

  ipcMain.handle('ble:scan', async (_, durationMs: number = 5000) => {
    const n = loadNoble()
    if (!n) return { success: false, error: 'BLE not available' }

    const devices: BleDevice[] = []

    return new Promise<{ success: boolean; devices?: BleDevice[]; error?: string }>((resolve) => {
      const onDiscover = (peripheral: import('@abandonware/noble').Peripheral) => {
        const name = peripheral.advertisement?.localName || peripheral.address || 'Unknown'
        if (!devices.find((d) => d.id === peripheral.id)) {
          const device: BleDevice = {
            id: peripheral.id,
            name,
            rssi: peripheral.rssi ?? -100,
            address: peripheral.address || peripheral.id
          }
          devices.push(device)
          const win = getMainWindow()
          if (win && !win.isDestroyed()) {
            win.webContents.send('ble:device-found', device)
          }
        }
      }

      n.on('discover', onDiscover)

      n.startScanning([], true, (err?: Error) => {
        if (err) {
          n.removeListener('discover', onDiscover)
          resolve({ success: false, error: err.message })
        }
      })

      setTimeout(() => {
        n.stopScanning()
        n.removeListener('discover', onDiscover)
        resolve({ success: true, devices })
      }, durationMs)
    })
  })

  ipcMain.handle('ble:stop-scan', () => {
    const n = loadNoble()
    if (!n) return { success: false, error: 'BLE not available' }
    n.stopScanning()
    return { success: true }
  })

  ipcMain.handle('ble:connect', async (_, connId: string, deviceId: string) => {
    const n = loadNoble()
    if (!n) return { success: false, error: 'BLE not available' }

    return new Promise<{ success: boolean; services?: BleService[]; error?: string }>((resolve) => {
      // Find the peripheral by scanning briefly
      const onDiscover = async (peripheral: import('@abandonware/noble').Peripheral) => {
        if (peripheral.id !== deviceId) return

        n.stopScanning()
        n.removeListener('discover', onDiscover)

        peripheral.connect((err?: Error) => {
          if (err) {
            resolve({ success: false, error: err.message })
            return
          }

          connectedPeripherals.set(connId, peripheral)

          // Set up disconnect handler
          peripheral.once('disconnect', () => {
            connectedPeripherals.delete(connId)
            const win = getMainWindow()
            if (win && !win.isDestroyed()) {
              win.webContents.send('ble:disconnect', connId)
            }
          })

          // Discover services and characteristics
          peripheral.discoverAllServicesAndCharacteristics(
            (discoverErr?: Error, services?: import('@abandonware/noble').Service[], _chars?: import('@abandonware/noble').Characteristic[]) => {
              if (discoverErr) {
                resolve({ success: true, services: [] })
                return
              }

              const bleServices: BleService[] = (services || []).map((svc) => ({
                uuid: svc.uuid,
                characteristics: svc.characteristics.map((ch) => ({
                  uuid: ch.uuid,
                  properties: ch.properties
                }))
              }))

              resolve({ success: true, services: bleServices })
            }
          )
        })
      }

      n.on('discover', onDiscover)
      n.startScanning([], true)

      // Timeout
      setTimeout(() => {
        n.removeListener('discover', onDiscover)
        n.stopScanning()
        resolve({ success: false, error: 'Device not found (scan timeout)' })
      }, 10000)
    })
  })

  ipcMain.handle('ble:disconnect', async (_, connId: string) => {
    const peripheral = connectedPeripherals.get(connId)
    if (!peripheral) return { success: false, error: 'Not connected' }

    // Unsubscribe all characteristics for this connection
    for (const [key, char] of subscribedCharacteristics.entries()) {
      if (key.startsWith(connId + ':')) {
        char.unsubscribe()
        subscribedCharacteristics.delete(key)
      }
    }

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      peripheral.disconnect((err?: Error) => {
        connectedPeripherals.delete(connId)
        if (err) resolve({ success: false, error: err.message })
        else resolve({ success: true })
      })
    })
  })

  ipcMain.handle(
    'ble:read',
    async (_, connId: string, serviceUuid: string, charUuid: string) => {
      const peripheral = connectedPeripherals.get(connId)
      if (!peripheral) return { success: false, error: 'Not connected' }

      return new Promise<{ success: boolean; data?: number[]; error?: string }>((resolve) => {
        peripheral.discoverSomeServicesAndCharacteristics(
          [serviceUuid],
          [charUuid],
          (err?: Error, _services?: import('@abandonware/noble').Service[], chars?: import('@abandonware/noble').Characteristic[]) => {
            if (err || !chars || chars.length === 0) {
              resolve({ success: false, error: err?.message || 'Characteristic not found' })
              return
            }

            chars[0].read((readErr: Error | null, data: Buffer) => {
              if (readErr) {
                resolve({ success: false, error: readErr.message })
                return
              }
              resolve({ success: true, data: Array.from(data) })
            })
          }
        )
      })
    }
  )

  ipcMain.handle(
    'ble:write',
    async (_, connId: string, serviceUuid: string, charUuid: string, data: number[], withoutResponse: boolean) => {
      const peripheral = connectedPeripherals.get(connId)
      if (!peripheral) return { success: false, error: 'Not connected' }

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        peripheral.discoverSomeServicesAndCharacteristics(
          [serviceUuid],
          [charUuid],
          (err?: Error, _services?: import('@abandonware/noble').Service[], chars?: import('@abandonware/noble').Characteristic[]) => {
            if (err || !chars || chars.length === 0) {
              resolve({ success: false, error: err?.message || 'Characteristic not found' })
              return
            }

            const buf = Buffer.from(data)
            chars[0].write(buf, withoutResponse, (writeErr: Error | null) => {
              if (writeErr) resolve({ success: false, error: writeErr.message })
              else resolve({ success: true })
            })
          }
        )
      })
    }
  )

  ipcMain.handle(
    'ble:subscribe',
    async (_, connId: string, serviceUuid: string, charUuid: string) => {
      const peripheral = connectedPeripherals.get(connId)
      if (!peripheral) return { success: false, error: 'Not connected' }

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        peripheral.discoverSomeServicesAndCharacteristics(
          [serviceUuid],
          [charUuid],
          (err?: Error, _services?: import('@abandonware/noble').Service[], chars?: import('@abandonware/noble').Characteristic[]) => {
            if (err || !chars || chars.length === 0) {
              resolve({ success: false, error: err?.message || 'Characteristic not found' })
              return
            }

            const char = chars[0]
            const key = `${connId}:${serviceUuid}:${charUuid}`

            char.on('data', (data: Buffer) => {
              const win = getMainWindow()
              if (win && !win.isDestroyed()) {
                win.webContents.send('ble:data', connId, Array.from(data))
              }
            })

            char.subscribe((subErr?: Error) => {
              if (subErr) {
                resolve({ success: false, error: subErr.message })
                return
              }
              subscribedCharacteristics.set(key, char)
              resolve({ success: true })
            })
          }
        )
      })
    }
  )

  ipcMain.handle(
    'ble:unsubscribe',
    async (_, connId: string, serviceUuid: string, charUuid: string) => {
      const key = `${connId}:${serviceUuid}:${charUuid}`
      const char = subscribedCharacteristics.get(key)
      if (!char) return { success: false, error: 'Not subscribed' }

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        char.unsubscribe((err?: Error) => {
          subscribedCharacteristics.delete(key)
          if (err) resolve({ success: false, error: err.message })
          else resolve({ success: true })
        })
      })
    }
  )
}
