import { useState, useCallback, useEffect } from 'react'
import { Plus, X, Wifi, WifiOff, Radio, Antenna, Bluetooth, Trash2, Download, ScrollText } from 'lucide-react'

// Utility: convert any IPC data (Buffer serialized as object/Uint8Array) to Uint8Array
function toUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    // Electron IPC may serialize Buffer as { type: 'Buffer', data: [...] }
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) return new Uint8Array(obj.data as number[])
    if (Array.isArray(obj)) return new Uint8Array(obj)
    const values = Object.values(obj)
    if (values.length > 0 && values.every((v) => typeof v === 'number')) return new Uint8Array(values as number[])
  }
  if (typeof data === 'string') return new TextEncoder().encode(data)
  return new Uint8Array(0)
}

// Utility: hex string to Uint8Array
function hexStringToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s+/g, '')
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { SerialConfig } from './SerialConfig'
import { TcpConfig } from './TcpConfig'
import { UdpConfig } from './UdpConfig'
import { BleConfig } from './BleConfig'
import { DataDisplay } from './DataDisplay'
import { SendPanel } from './SendPanel'
import { ConnectionStatus } from './ConnectionStatus'
import { SessionManager } from './SessionManager'
import { useConnectionStore } from '@/store/connectionStore'
import type { Connection, ConnectionType, DataEncoding, SerialConfig as SConfig, TcpClientConfig, TcpServerConfig, UdpConfig as UConfig, BleConfig as BConfig } from '@/types'
import { cn } from '@/lib/utils'
import { formatTimestamp } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

const TYPE_ICONS: Record<ConnectionType, React.ReactNode> = {
  serial: <Radio className="h-3 w-3" />,
  'tcp-client': <Wifi className="h-3 w-3" />,
  'tcp-server': <Antenna className="h-3 w-3" />,
  udp: <WifiOff className="h-3 w-3" />,
  ble: <Bluetooth className="h-3 w-3" />
}

const TYPE_LABELS: Record<ConnectionType, string> = {
  serial: 'Serial',
  'tcp-client': 'TCP Client',
  'tcp-server': 'TCP Server',
  udp: 'UDP',
  ble: 'BLE'
}

function TabItem({
  conn,
  isActive,
  onSelect,
  onClose,
  onRename
}: {
  conn: Connection
  isActive: boolean
  onSelect: () => void
  onClose: () => void
  onRename: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(conn.customLabel || conn.label)
    setEditing(true)
  }

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== conn.label) {
      onRename(trimmed)
    } else {
      onRename('')
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-b-2 transition-colors text-xs whitespace-nowrap select-none',
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      <span className={conn.status === 'connected' || conn.status === 'listening' ? 'text-sky-500' : 'text-muted-foreground'}>
        {TYPE_ICONS[conn.type]}
      </span>
      {editing ? (
        <input
          className="bg-muted/50 text-xs w-20 px-1 py-0.5 rounded border border-border outline-none focus:ring-1 focus:ring-ring"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span onDoubleClick={handleDoubleClick}>{conn.customLabel || conn.label}</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function MonitorPanel() {
  const {
    connections,
    activeConnectionId,
    addConnection,
    removeConnection,
    setActiveConnection,
    updateConnectionStatus,
    updateConnectionConfig,
    appendData,
    clearData,
    setEncoding,
    setAutoScroll,
    addConnectedClient,
    removeConnectedClient,
    renameConnection
  } = useConnectionStore()

  const { t } = useTranslation()

  const [reconnectConn, setReconnectConn] = useState<Connection | null>(null)

  const activeConn = connections.find((c) => c.id === activeConnectionId)

  // Register IPC event listeners
  useEffect(() => {
    const unsubSerial = window.electronAPI.serial.onData((portId, data) => {
      appendData(portId, 'rx', toUint8Array(data))
    })
    const unsubSerialErr = window.electronAPI.serial.onError((portId, err) => {
      appendData(portId, 'system', new TextEncoder().encode(`Error: ${err}`))
      updateConnectionStatus(portId, 'error', err)
    })
    const unsubSerialDisc = window.electronAPI.serial.onDisconnect((portId) => {
      appendData(portId, 'system', new TextEncoder().encode('Disconnected'))
      updateConnectionStatus(portId, 'disconnected')
    })

    const unsubTcpData = window.electronAPI.tcp.onData((connId, data, from) => {
      appendData(connId, 'rx', toUint8Array(data), from)
    })
    const unsubTcpErr = window.electronAPI.tcp.onError((connId, err) => {
      appendData(connId, 'system', new TextEncoder().encode(`Error: ${err}`))
      updateConnectionStatus(connId, 'error', err)
    })
    const unsubTcpDisc = window.electronAPI.tcp.onDisconnect((connId) => {
      appendData(connId, 'system', new TextEncoder().encode('Disconnected'))
      updateConnectionStatus(connId, 'disconnected')
    })
    const unsubTcpClient = window.electronAPI.tcp.onClientConnect((connId, clientAddr) => {
      addConnectedClient(connId, clientAddr)
      appendData(connId, 'system', new TextEncoder().encode(`Client connected: ${clientAddr}`))
    })
    const unsubTcpClientDisc = window.electronAPI.tcp.onClientDisconnect((connId, clientAddr) => {
      removeConnectedClient(connId, clientAddr)
      appendData(connId, 'system', new TextEncoder().encode(`Client disconnected: ${clientAddr}`))
    })

    const unsubUdpData = window.electronAPI.udp.onData((sockId, data, rinfo) => {
      const r = rinfo as { address: string; port: number }
      appendData(sockId, 'rx', toUint8Array(data), `${r.address}:${r.port}`)
    })
    const unsubUdpErr = window.electronAPI.udp.onError((sockId, err) => {
      appendData(sockId, 'system', new TextEncoder().encode(`Error: ${err}`))
      updateConnectionStatus(sockId, 'error', err)
    })

    const unsubBleData = window.electronAPI.ble.onData((connId, data) => {
      appendData(connId, 'rx', new Uint8Array(data))
    })
    const unsubBleDisc = window.electronAPI.ble.onDisconnect((connId) => {
      appendData(connId, 'system', new TextEncoder().encode('BLE Disconnected'))
      updateConnectionStatus(connId, 'disconnected')
    })

    return () => {
      unsubSerial()
      unsubSerialErr()
      unsubSerialDisc()
      unsubTcpData()
      unsubTcpErr()
      unsubTcpDisc()
      unsubTcpClient()
      unsubTcpClientDisc()
      unsubUdpData()
      unsubUdpErr()
      unsubBleData()
      unsubBleDisc()
    }
  }, [appendData, updateConnectionStatus, addConnectedClient, removeConnectedClient])

  const handleConnect = useCallback(
    async (conn: Connection) => {
      updateConnectionStatus(conn.id, 'connecting')
      let result: { success: boolean; error?: string }

      if (conn.type === 'serial') {
        const cfg = conn.config as SConfig
        result = await window.electronAPI.serial.open({ portId: conn.id, ...cfg })
        if (result.success) {
          updateConnectionStatus(conn.id, 'connected')
          appendData(conn.id, 'system', new TextEncoder().encode(`Connected to ${cfg.path} @ ${cfg.baudRate}`))
        }
      } else if (conn.type === 'tcp-client') {
        const cfg = conn.config as TcpClientConfig
        result = await window.electronAPI.tcp.connect({ connId: conn.id, ...cfg })
        if (result.success) {
          updateConnectionStatus(conn.id, 'connected')
          appendData(conn.id, 'system', new TextEncoder().encode(`Connected to ${cfg.host}:${cfg.port}`))
        }
      } else if (conn.type === 'tcp-server') {
        const cfg = conn.config as TcpServerConfig
        result = await window.electronAPI.tcp.listen({ connId: conn.id, ...cfg })
        if (result.success) {
          updateConnectionStatus(conn.id, 'listening')
          appendData(conn.id, 'system', new TextEncoder().encode(`Listening on ${cfg.host}:${cfg.port}`))
        }
      } else if (conn.type === 'udp') {
        const cfg = conn.config as UConfig
        result = await window.electronAPI.udp.bind({
          sockId: conn.id,
          localPort: cfg.localPort,
          localHost: cfg.localHost
        })
        if (result.success) {
          updateConnectionStatus(conn.id, 'listening')
          appendData(conn.id, 'system', new TextEncoder().encode(`UDP socket bound on port ${cfg.localPort}`))
        }
      } else {
        // BLE
        const cfg = conn.config as BConfig
        if (!cfg.deviceId) {
          result = { success: false, error: 'No BLE device selected' }
        } else {
          const bleResult = await window.electronAPI.ble.connect(conn.id, cfg.deviceId) as {
            success: boolean; error?: string;
            services?: { uuid: string; characteristics: { uuid: string; properties: string[] }[] }[]
          }
          result = bleResult
          if (bleResult.success) {
            updateConnectionStatus(conn.id, 'connected')
            appendData(conn.id, 'system', new TextEncoder().encode(`BLE connected to ${cfg.deviceName || cfg.deviceId}`))

            // Auto-detect service/characteristic UUIDs from discovered services
            let serviceUuid = cfg.serviceUuid
            let writeUuid = cfg.writeCharacteristicUuid
            let notifyUuid = cfg.notifyCharacteristicUuid

            if (bleResult.services && bleResult.services.length > 0 && (!serviceUuid || !writeUuid || !notifyUuid)) {
              // Find a service that has both write and notify characteristics
              for (const svc of bleResult.services) {
                const writeCh = svc.characteristics.find((ch) =>
                  ch.properties.includes('write') || ch.properties.includes('writeWithoutResponse')
                )
                const notifyCh = svc.characteristics.find((ch) =>
                  ch.properties.includes('notify') || ch.properties.includes('indicate')
                )
                if (writeCh && notifyCh) {
                  if (!serviceUuid) serviceUuid = svc.uuid
                  if (!writeUuid) writeUuid = writeCh.uuid
                  if (!notifyUuid) notifyUuid = notifyCh.uuid
                  break
                }
              }
              // Fallback: pick first service with any usable characteristic
              if (!serviceUuid && bleResult.services.length > 0) {
                const svc = bleResult.services.find((s) => s.characteristics.length > 0) || bleResult.services[0]
                serviceUuid = svc.uuid
                if (!writeUuid) {
                  const wc = svc.characteristics.find((ch) =>
                    ch.properties.includes('write') || ch.properties.includes('writeWithoutResponse')
                  )
                  if (wc) writeUuid = wc.uuid
                }
                if (!notifyUuid) {
                  const nc = svc.characteristics.find((ch) =>
                    ch.properties.includes('notify') || ch.properties.includes('indicate')
                  )
                  if (nc) notifyUuid = nc.uuid
                }
              }

              // Update connection config with auto-detected UUIDs
              const autoConfig: Record<string, string> = {}
              if (serviceUuid && !cfg.serviceUuid) autoConfig.serviceUuid = serviceUuid
              if (writeUuid && !cfg.writeCharacteristicUuid) autoConfig.writeCharacteristicUuid = writeUuid
              if (notifyUuid && !cfg.notifyCharacteristicUuid) autoConfig.notifyCharacteristicUuid = notifyUuid
              if (Object.keys(autoConfig).length > 0) {
                updateConnectionConfig(conn.id, autoConfig)
                appendData(conn.id, 'system', new TextEncoder().encode(
                  `Auto-detected: service=${serviceUuid}, write=${writeUuid}, notify=${notifyUuid}`
                ))
              }
            }

            // Subscribe to notify characteristic for receiving data
            if (serviceUuid && notifyUuid) {
              const subResult = await window.electronAPI.ble.subscribe(conn.id, serviceUuid, notifyUuid)
              if (subResult.success) {
                appendData(conn.id, 'system', new TextEncoder().encode(`Subscribed to notify: ${notifyUuid}`))
              } else {
                appendData(conn.id, 'system', new TextEncoder().encode(`Subscribe failed: ${subResult.error}`))
              }
            }
          }
        }
      }

      if (!result.success) {
        const errLower = (result.error || '').toLowerCase()
        if (errLower.includes('already exists') || errLower.includes('already open')) {
          setReconnectConn(conn)
          return
        }
        updateConnectionStatus(conn.id, 'error', result.error)
        appendData(conn.id, 'system', new TextEncoder().encode(`Error: ${result.error}`))
      }
    },
    [updateConnectionStatus, updateConnectionConfig, appendData]
  )

  const handleReconnect = useCallback(async () => {
    if (!reconnectConn) return
    const conn = reconnectConn
    setReconnectConn(null)

    // Disconnect existing connection in the backend first
    if (conn.type === 'serial') {
      await window.electronAPI.serial.close(conn.id)
    } else if (conn.type === 'tcp-client' || conn.type === 'tcp-server') {
      await window.electronAPI.tcp.close(conn.id)
    } else if (conn.type === 'udp') {
      await window.electronAPI.udp.close(conn.id)
    } else {
      await window.electronAPI.ble.disconnect(conn.id)
    }

    // Now connect again
    handleConnect(conn)
  }, [reconnectConn, handleConnect])

  const handleDisconnect = useCallback(
    async (conn: Connection) => {
      let result: { success: boolean; error?: string }
      if (conn.type === 'serial') {
        result = await window.electronAPI.serial.close(conn.id)
      } else if (conn.type === 'tcp-client' || conn.type === 'tcp-server') {
        result = await window.electronAPI.tcp.close(conn.id)
      } else if (conn.type === 'udp') {
        result = await window.electronAPI.udp.close(conn.id)
      } else {
        result = await window.electronAPI.ble.disconnect(conn.id)
      }

      if (result.success) {
        updateConnectionStatus(conn.id, 'disconnected')
        appendData(conn.id, 'system', new TextEncoder().encode('Disconnected'))
      }
    },
    [updateConnectionStatus, appendData]
  )

  const handleSend = useCallback(
    async (conn: Connection, data: string, encoding: DataEncoding) => {
      let result: { success: boolean; error?: string; bytesSent?: number }

      if (conn.type === 'serial') {
        result = await window.electronAPI.serial.send(conn.id, data, encoding)
      } else if (conn.type === 'tcp-client') {
        result = await window.electronAPI.tcp.send(conn.id, data, encoding)
      } else if (conn.type === 'udp') {
        const cfg = conn.config as UConfig
        result = await window.electronAPI.udp.send(conn.id, cfg.targetHost, cfg.targetPort, data, encoding)
      } else if (conn.type === 'ble') {
        const cfg = conn.config as BConfig
        const writeUuid = cfg.writeCharacteristicUuid || cfg.characteristicUuid
        if (!cfg.serviceUuid || !writeUuid) {
          result = { success: false, error: 'Service/Write Characteristic UUID not configured' }
        } else {
          const bytes = encoding === 'hex'
            ? Array.from(hexStringToBytes(data))
            : Array.from(new TextEncoder().encode(data))
          result = await window.electronAPI.ble.write(conn.id, cfg.serviceUuid, writeUuid, bytes, false)
        }
      } else {
        return
      }

      if (result.success) {
        const txBytes = encoding === 'hex'
          ? hexStringToBytes(data)
          : new TextEncoder().encode(data)
        appendData(conn.id, 'tx', txBytes)
      } else {
        appendData(conn.id, 'system', new TextEncoder().encode(`Send error: ${result.error}`))
      }
    },
    [appendData]
  )

  const handleExport = useCallback(
    (conn: Connection) => {
      const lines = conn.data.map((d) => {
        const ts = formatTimestamp(d.timestamp)
        const dir = d.direction.toUpperCase()
        const hex = Array.from(d.raw).map((b) => b.toString(16).padStart(2, '0')).join(' ')
        const ascii = Array.from(d.raw).map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')
        return `[${ts}] ${dir}: ${hex}  |  ${ascii}`
      })
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${conn.label}-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    },
    []
  )

  const isActive = (conn: Connection) =>
    conn.status === 'connected' || conn.status === 'listening'

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Reconnect confirmation dialog */}
      <Dialog open={!!reconnectConn} onOpenChange={(open) => { if (!open) setReconnectConn(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('reconnect.title')}</DialogTitle>
            <DialogDescription>{t('reconnect.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReconnectConn(null)}>
              {t('reconnect.cancel')}
            </Button>
            <Button onClick={handleReconnect}>
              {t('reconnect.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-card/50 overflow-x-auto">
        <div className="flex flex-1 overflow-x-auto">
          {connections.map((conn) => (
            <TabItem
              key={conn.id}
              conn={conn}
              isActive={conn.id === activeConnectionId}
              onSelect={() => setActiveConnection(conn.id)}
              onClose={() => {
                if (isActive(conn)) handleDisconnect(conn)
                removeConnection(conn.id)
              }}
              onRename={(name) => renameConnection(conn.id, name)}
            />
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mx-1">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(['serial', 'tcp-client', 'tcp-server', 'udp', 'ble'] as ConnectionType[]).map((type) => (
              <DropdownMenuItem key={type} onClick={() => addConnection(type)}>
                <span className="mr-2">{TYPE_ICONS[type]}</span>
                {TYPE_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!activeConn ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Radio className="h-12 w-12 opacity-20" />
          <p className="text-sm">{t('monitor.noConnection')}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('monitor.newConnection')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['serial', 'tcp-client', 'tcp-server', 'udp', 'ble'] as ConnectionType[]).map((type) => (
                <DropdownMenuItem key={type} onClick={() => addConnection(type)}>
                  <span className="mr-2">{TYPE_ICONS[type]}</span>
                  {TYPE_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar: config */}
          <div className="w-56 shrink-0 border-r border-border p-2 space-y-2 overflow-y-auto bg-card/30">
            <ConnectionStatus status={activeConn.status} />

            {activeConn.type === 'serial' && (
              <SerialConfig
                connectionId={activeConn.id}
                onConnect={() => handleConnect(activeConn)}
                onDisconnect={() => handleDisconnect(activeConn)}
                isConnected={isActive(activeConn)}
              />
            )}
            {(activeConn.type === 'tcp-client' || activeConn.type === 'tcp-server') && (
              <TcpConfig
                connectionId={activeConn.id}
                connectionType={activeConn.type}
                onConnect={() => handleConnect(activeConn)}
                onDisconnect={() => handleDisconnect(activeConn)}
                isConnected={isActive(activeConn)}
              />
            )}
            {activeConn.type === 'udp' && (
              <UdpConfig
                connectionId={activeConn.id}
                onBind={() => handleConnect(activeConn)}
                onClose={() => handleDisconnect(activeConn)}
                isBound={isActive(activeConn)}
              />
            )}
            {activeConn.type === 'ble' && (
              <BleConfig
                connectionId={activeConn.id}
                onConnect={() => handleConnect(activeConn)}
                onDisconnect={() => handleDisconnect(activeConn)}
                isConnected={isActive(activeConn)}
              />
            )}

            {/* Display options */}
            <div className="p-3 bg-card rounded-lg border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('monitor.display')}</span>
              <div className="flex rounded-md overflow-hidden border border-border">
                {(['both', 'hex', 'ascii'] as DataEncoding[]).map((enc) => (
                  <button
                    key={enc}
                    onClick={() => setEncoding(activeConn.id, enc)}
                    className={cn(
                      'flex-1 py-1 text-xs transition-colors',
                      activeConn.encoding === enc ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {enc === 'both' ? 'HEX+ASCII' : enc.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoScroll(activeConn.id, !activeConn.autoScroll)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    activeConn.autoScroll ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <ScrollText className="h-3 w-3" />
                  {t('monitor.autoScroll')}
                </button>
              </div>
            </div>

            {/* TCP Server clients */}
            {activeConn.type === 'tcp-server' && (activeConn.connectedClients?.length ?? 0) > 0 && (
              <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('monitor.clients')} ({activeConn.connectedClients?.length})
                </span>
                {activeConn.connectedClients?.map((addr) => (
                  <div key={addr} className="text-xs text-sky-400 font-mono">{addr}</div>
                ))}
              </div>
            )}
          </div>

          {/* Main data area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-card/20">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => clearData(activeConn.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('monitor.clear')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleExport(activeConn)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('monitor.exportLog')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="w-px h-4 bg-border mx-0.5" />
              <SessionManager />
              <span className="text-xs text-muted-foreground ml-auto">
                {activeConn.data.length} {t('monitor.entries')}
              </span>
            </div>

            <DataDisplay
              data={activeConn.data}
              encoding={activeConn.encoding}
              autoScroll={activeConn.autoScroll}
            />

            {isActive(activeConn) && activeConn.type !== 'tcp-server' && (
              <SendPanel
                connection={activeConn}
                onSend={(data, enc) => handleSend(activeConn, data, enc)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
