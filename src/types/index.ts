export type ConnectionType = 'serial' | 'tcp-client' | 'tcp-server' | 'udp' | 'ble'
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'error'
export type DataEncoding = 'hex' | 'ascii' | 'both'
export type DataDirection = 'rx' | 'tx' | 'system'

export interface SerialConfig {
  path: string
  baudRate: number
  dataBits: 5 | 6 | 7 | 8
  stopBits: 1 | 1.5 | 2
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space'
  flowControl: 'none' | 'hardware' | 'software'
  label: 'RS-232' | 'RS-422' | 'RS-485'
}

export interface TcpClientConfig {
  host: string
  port: number
  autoReconnect: boolean
}

export interface TcpServerConfig {
  host: string
  port: number
}

export interface UdpConfig {
  localPort: number
  localHost: string
  targetHost: string
  targetPort: number
}

export interface BleDevice {
  id: string
  name: string
  rssi: number
  address: string
}

export interface BleService {
  uuid: string
  name?: string
  characteristics: BleCharacteristic[]
}

export interface BleCharacteristic {
  uuid: string
  name?: string
  properties: string[]
}

export interface BleConfig {
  deviceId: string
  deviceName: string
  serviceUuid: string
  characteristicUuid: string
  writeCharacteristicUuid: string
  notifyCharacteristicUuid: string
}

export interface DataEntry {
  id: string
  timestamp: number
  direction: DataDirection
  raw: Uint8Array
  from?: string
}

export interface PeriodicSend {
  active: boolean
  data: string
  encoding: DataEncoding
  intervalMs: number
  count: number
  timerId?: ReturnType<typeof setInterval>
}

export interface Connection {
  id: string
  type: ConnectionType
  label: string
  customLabel?: string
  status: ConnectionStatus
  config: SerialConfig | TcpClientConfig | TcpServerConfig | UdpConfig | BleConfig
  data: DataEntry[]
  encoding: DataEncoding
  autoScroll: boolean
  periodicSend: PeriodicSend
  error?: string
  connectedClients?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  streaming?: boolean
}

export type ChatActionType = 'send' | 'reconnect' | 'disconnect' | 'configure'

export interface ChatAction {
  action: ChatActionType
  data?: string
  encoding?: 'hex' | 'ascii'
  config?: Record<string, unknown>
  description: string
}

export interface AppSettings {
  anthropicApiKey: string
  openaiApiKey: string
  googleAiKey: string
  groqApiKey: string
  openrouterApiKey: string
  ollamaUrl: string
  model: string
  temperature: number
  maxTokens: number
  defaultBaudRate: number
  defaultEncoding: DataEncoding
}

export interface PortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  productId?: string
  vendorId?: string
}

export interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

export interface SupabaseUser {
  id: string
  email: string
  name: string
  picture: string
  provider: 'github' | 'google'
}

export type AuthUser = GoogleUser | SupabaseUser

export interface LLMModel {
  id: string
  name: string
  provider: 'anthropic' | 'google'
  description: string
  contextWindow: number
}
