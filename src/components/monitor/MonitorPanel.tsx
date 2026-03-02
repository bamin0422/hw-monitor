import { useState, useCallback, useEffect } from 'react'
import { Plus, X, Wifi, WifiOff, Radio, Antenna, Trash2, Download, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { DataDisplay } from './DataDisplay'
import { SendPanel } from './SendPanel'
import { ConnectionStatus } from './ConnectionStatus'
import { useConnectionStore } from '@/store/connectionStore'
import type { Connection, ConnectionType, DataEncoding, SerialConfig as SConfig, TcpClientConfig, TcpServerConfig, UdpConfig as UConfig } from '@/types'
import { cn } from '@/lib/utils'
import { formatTimestamp } from '@/lib/utils'

const TYPE_ICONS: Record<ConnectionType, React.ReactNode> = {
  serial: <Radio className="h-3 w-3" />,
  'tcp-client': <Wifi className="h-3 w-3" />,
  'tcp-server': <Antenna className="h-3 w-3" />,
  udp: <WifiOff className="h-3 w-3" />
}

const TYPE_LABELS: Record<ConnectionType, string> = {
  serial: 'Serial',
  'tcp-client': 'TCP Client',
  'tcp-server': 'TCP Server',
  udp: 'UDP'
}

function TabItem({
  conn,
  isActive,
  onSelect,
  onClose
}: {
  conn: Connection
  isActive: boolean
  onSelect: () => void
  onClose: () => void
}) {
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
      <span className={conn.status === 'connected' || conn.status === 'listening' ? 'text-green-500' : 'text-muted-foreground'}>
        {TYPE_ICONS[conn.type]}
      </span>
      <span>{conn.label}</span>
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
    appendData,
    clearData,
    setEncoding,
    setAutoScroll,
    addConnectedClient,
    removeConnectedClient
  } = useConnectionStore()

  const activeConn = connections.find((c) => c.id === activeConnectionId)

  // Register IPC event listeners
  useEffect(() => {
    const unsubSerial = window.electronAPI.serial.onData((portId, data) => {
      const buf = data instanceof Buffer ? data : Buffer.from(data)
      appendData(portId, 'rx', new Uint8Array(buf))
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
      const buf = data instanceof Buffer ? data : Buffer.from(data)
      appendData(connId, 'rx', new Uint8Array(buf), from)
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
      const buf = data instanceof Buffer ? data : Buffer.from(data)
      const r = rinfo as { address: string; port: number }
      appendData(sockId, 'rx', new Uint8Array(buf), `${r.address}:${r.port}`)
    })
    const unsubUdpErr = window.electronAPI.udp.onError((sockId, err) => {
      appendData(sockId, 'system', new TextEncoder().encode(`Error: ${err}`))
      updateConnectionStatus(sockId, 'error', err)
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
      } else {
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
      }

      if (!result.success) {
        updateConnectionStatus(conn.id, 'error', result.error)
        appendData(conn.id, 'system', new TextEncoder().encode(`Error: ${result.error}`))
      }
    },
    [updateConnectionStatus, appendData]
  )

  const handleDisconnect = useCallback(
    async (conn: Connection) => {
      let result: { success: boolean; error?: string }
      if (conn.type === 'serial') {
        result = await window.electronAPI.serial.close(conn.id)
      } else if (conn.type === 'tcp-client' || conn.type === 'tcp-server') {
        result = await window.electronAPI.tcp.close(conn.id)
      } else {
        result = await window.electronAPI.udp.close(conn.id)
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
      } else {
        return
      }

      if (result.success) {
        const buf = encoding === 'hex'
          ? Buffer.from(data.replace(/\s+/g, ''), 'hex')
          : Buffer.from(data, 'utf8')
        appendData(conn.id, 'tx', new Uint8Array(buf))
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
            {(['serial', 'tcp-client', 'tcp-server', 'udp'] as ConnectionType[]).map((type) => (
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
          <p className="text-sm">No connection open</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Connection
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['serial', 'tcp-client', 'tcp-server', 'udp'] as ConnectionType[]).map((type) => (
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

            {/* Display options */}
            <div className="p-3 bg-card rounded-lg border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display</span>
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
                  Auto-scroll
                </button>
              </div>
            </div>

            {/* TCP Server clients */}
            {activeConn.type === 'tcp-server' && (activeConn.connectedClients?.length ?? 0) > 0 && (
              <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Clients ({activeConn.connectedClients?.length})
                </span>
                {activeConn.connectedClients?.map((addr) => (
                  <div key={addr} className="text-xs text-green-400 font-mono">{addr}</div>
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
                  <TooltipContent>Clear</TooltipContent>
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
                  <TooltipContent>Export Log</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground ml-auto">
                {activeConn.data.length} entries
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
