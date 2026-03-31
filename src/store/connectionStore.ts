import { create } from 'zustand'
import type {
  Connection,
  ConnectionType,
  DataDirection,
  DataEncoding,
  SerialConfig,
  TcpClientConfig,
  TcpServerConfig,
  UdpConfig,
  BleConfig,
  ChatMessage,
  AppSettings
} from '@/types'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Persistence helpers — save/load connection configs via electron-store
interface SavedConnection {
  id: string
  type: ConnectionType
  label: string
  customLabel?: string
  config: SerialConfig | TcpClientConfig | TcpServerConfig | UdpConfig | BleConfig
  encoding: DataEncoding
}

function saveConnectionsToStore(connections: Connection[]) {
  const saved: SavedConnection[] = connections.map((c) => ({
    id: c.id,
    type: c.type,
    label: c.label,
    customLabel: c.customLabel,
    config: c.config,
    encoding: c.encoding
  }))
  // Always save locally for immediate persistence
  window.electronAPI?.settings?.set('savedConnections', saved)
  // Also sync to Supabase (fire-and-forget)
  window.electronAPI?.sync?.save({ connection_configs: saved }).catch(() => {})
}

export async function loadSavedConnections(): Promise<Connection[]> {
  try {
    const raw = await window.electronAPI.settings.get('savedConnections')
    if (!Array.isArray(raw)) return []
    return (raw as SavedConnection[]).map((s) => ({
      id: s.id,
      type: s.type,
      label: s.label,
      customLabel: s.customLabel,
      status: 'disconnected' as const,
      config: s.config,
      data: [],
      encoding: s.encoding || 'both',
      autoScroll: true,
      periodicSend: {
        active: false,
        data: '',
        encoding: 'ascii' as DataEncoding,
        intervalMs: 1000,
        count: 0
      },
      connectedClients: []
    }))
  } catch {
    return []
  }
}

interface ConnectionStore {
  connections: Connection[]
  activeConnectionId: string | null
  chatMessages: ChatMessage[]
  settings: AppSettings
  streamingMessageId: string | null

  // Connection actions
  addConnection: (type: ConnectionType) => string
  removeConnection: (id: string) => void
  setActiveConnection: (id: string) => void
  restoreConnections: (connections: Connection[]) => void
  updateConnectionStatus: (
    id: string,
    status: Connection['status'],
    error?: string
  ) => void
  updateConnectionConfig: (
    id: string,
    config: Partial<SerialConfig | TcpClientConfig | TcpServerConfig | UdpConfig | BleConfig>
  ) => void
  appendData: (
    id: string,
    direction: DataDirection,
    raw: Uint8Array,
    from?: string
  ) => void
  clearData: (id: string) => void
  setEncoding: (id: string, encoding: DataEncoding) => void
  setAutoScroll: (id: string, value: boolean) => void
  setPeriodicSend: (id: string, field: string, value: unknown) => void
  renameConnection: (id: string, customLabel: string) => void
  addConnectedClient: (id: string, clientAddr: string) => void
  removeConnectedClient: (id: string, clientAddr: string) => void

  // Chat actions
  addChatMessage: (role: 'user' | 'assistant', content: string) => string
  appendChatContent: (id: string, delta: string) => void
  finishChatMessage: (id: string) => void
  clearChat: () => void
  setStreamingMessageId: (id: string | null) => void

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void
}

const defaultSettings: AppSettings = {
  anthropicApiKey: '',
  openaiApiKey: '',
  googleAiKey: '',
  groqApiKey: '',
  openrouterApiKey: '',
  ollamaUrl: 'http://localhost:11434',
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  maxTokens: 4096,
  defaultBaudRate: 9600,
  defaultEncoding: 'both'
}

const defaultSerialConfig: SerialConfig = {
  path: '',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
  label: 'RS-232'
}

const defaultTcpClientConfig: TcpClientConfig = {
  host: '127.0.0.1',
  port: 8080,
  autoReconnect: false
}

const defaultTcpServerConfig: TcpServerConfig = {
  host: '0.0.0.0',
  port: 8080
}

const defaultUdpConfig: UdpConfig = {
  localPort: 9090,
  localHost: '0.0.0.0',
  targetHost: '127.0.0.1',
  targetPort: 9090
}

const defaultBleConfig: BleConfig = {
  deviceId: '',
  deviceName: '',
  serviceUuid: '',
  characteristicUuid: '',
  writeCharacteristicUuid: '',
  notifyCharacteristicUuid: ''
}

function createConnection(type: ConnectionType): Connection {
  let config: Connection['config']
  let label: string

  switch (type) {
    case 'serial':
      config = { ...defaultSerialConfig }
      label = 'Serial'
      break
    case 'tcp-client':
      config = { ...defaultTcpClientConfig }
      label = 'TCP Client'
      break
    case 'tcp-server':
      config = { ...defaultTcpServerConfig }
      label = 'TCP Server'
      break
    case 'udp':
      config = { ...defaultUdpConfig }
      label = 'UDP'
      break
    case 'ble':
      config = { ...defaultBleConfig }
      label = 'BLE'
      break
  }

  return {
    id: generateId(),
    type,
    label,
    status: 'disconnected',
    config,
    data: [],
    encoding: 'both',
    autoScroll: true,
    periodicSend: {
      active: false,
      data: '',
      encoding: 'ascii',
      intervalMs: 1000,
      count: 0
    },
    connectedClients: []
  }
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  chatMessages: [],
  settings: defaultSettings,
  streamingMessageId: null,

  addConnection: (type) => {
    const conn = createConnection(type)
    set((state) => {
      const updated = [...state.connections, conn]
      saveConnectionsToStore(updated)
      return { connections: updated, activeConnectionId: conn.id }
    })
    return conn.id
  },

  removeConnection: (id) => {
    set((state) => {
      const remaining = state.connections.filter((c) => c.id !== id)
      saveConnectionsToStore(remaining)
      const newActive =
        state.activeConnectionId === id
          ? remaining.length > 0
            ? remaining[remaining.length - 1].id
            : null
          : state.activeConnectionId
      return { connections: remaining, activeConnectionId: newActive }
    })
  },

  setActiveConnection: (id) => set({ activeConnectionId: id }),

  updateConnectionStatus: (id, status, error) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, status, error } : c
      )
    }))
  },

  updateConnectionConfig: (id, config) => {
    set((state) => {
      const updated = state.connections.map((c) =>
        c.id === id ? { ...c, config: { ...c.config, ...config } } : c
      )
      saveConnectionsToStore(updated)
      return { connections: updated }
    })
  },

  appendData: (id, direction, raw, from) => {
    const timestamp = Date.now()
    const entry = {
      id: generateId(),
      timestamp,
      direction,
      raw,
      from
    }
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id
          ? {
              ...c,
              data: c.data.length > 5000 ? [...c.data.slice(-4999), entry] : [...c.data, entry]
            }
          : c
      )
    }))

    // Feed data into RAG store
    const conn = get().connections.find((c) => c.id === id)
    if (conn) {
      window.electronAPI?.llm?.ragAdd?.(
        { timestamp, direction, raw: Array.from(raw), from },
        id,
        conn.type
      )?.catch(() => {})
    }
  },

  clearData: (id) => {
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, data: [] } : c))
    }))
  },

  setEncoding: (id, encoding) => {
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, encoding } : c))
    }))
  },

  setAutoScroll: (id, value) => {
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, autoScroll: value } : c))
    }))
  },

  setPeriodicSend: (id, field, value) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id
          ? { ...c, periodicSend: { ...c.periodicSend, [field]: value } }
          : c
      )
    }))
  },

  renameConnection: (id, customLabel) => {
    set((state) => {
      const updated = state.connections.map((c) =>
        c.id === id ? { ...c, customLabel: customLabel || undefined } : c
      )
      saveConnectionsToStore(updated)
      return { connections: updated }
    })
  },

  restoreConnections: (restored) => {
    set((state) => ({
      connections: restored,
      activeConnectionId: restored.length > 0 ? restored[0].id : state.activeConnectionId
    }))
  },

  addConnectedClient: (id, clientAddr) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id
          ? { ...c, connectedClients: [...(c.connectedClients || []), clientAddr] }
          : c
      )
    }))
  },

  removeConnectedClient: (id, clientAddr) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id
          ? {
              ...c,
              connectedClients: (c.connectedClients || []).filter((a) => a !== clientAddr)
            }
          : c
      )
    }))
  },

  addChatMessage: (role, content) => {
    const msg: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
      streaming: role === 'assistant'
    }
    set((state) => ({ chatMessages: [...state.chatMessages, msg] }))
    return msg.id
  },

  appendChatContent: (id, delta) => {
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === id ? { ...m, content: m.content + delta } : m
      )
    }))
  },

  finishChatMessage: (id) => {
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === id ? { ...m, streaming: false } : m
      )
    }))
  },

  clearChat: () => set({ chatMessages: [], streamingMessageId: null }),

  setStreamingMessageId: (id) => set({ streamingMessageId: id }),

  updateSettings: (settings) => {
    set((state) => ({ settings: { ...state.settings, ...settings } }))
  }
}))

export const getActiveConnection = (): Connection | undefined => {
  const { connections, activeConnectionId } = useConnectionStore.getState()
  return connections.find((c) => c.id === activeConnectionId)
}
