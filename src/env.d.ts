/// <reference types="vite/client" />

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'error'
type DataEncoding = 'hex' | 'ascii' | 'both'

interface PortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  productId?: string
  vendorId?: string
}

interface IpcResult {
  success: boolean
  error?: string
}

interface SendResult extends IpcResult {
  bytesSent?: number
}

interface BindResult extends IpcResult {
  port?: number
}

interface ListPortsResult extends IpcResult {
  ports: PortInfo[]
}

interface ElectronSerial {
  listPorts: () => Promise<ListPortsResult>
  open: (config: Record<string, unknown>) => Promise<IpcResult>
  close: (portId: string) => Promise<IpcResult>
  send: (portId: string, data: string, encoding: string) => Promise<SendResult>
  onData: (cb: (portId: string, data: Uint8Array) => void) => () => void
  onError: (cb: (portId: string, error: string) => void) => () => void
  onDisconnect: (cb: (portId: string) => void) => () => void
}

interface ElectronTcp {
  connect: (config: Record<string, unknown>) => Promise<IpcResult>
  listen: (config: Record<string, unknown>) => Promise<IpcResult>
  close: (connId: string) => Promise<IpcResult>
  send: (connId: string, data: string, encoding: string) => Promise<SendResult>
  onData: (cb: (connId: string, data: Uint8Array, from?: string) => void) => () => void
  onClientConnect: (cb: (connId: string, clientAddr: string) => void) => () => void
  onClientDisconnect: (cb: (connId: string, clientAddr: string) => void) => () => void
  onError: (cb: (connId: string, error: string) => void) => () => void
  onDisconnect: (cb: (connId: string) => void) => () => void
}

interface ElectronUdp {
  bind: (config: Record<string, unknown>) => Promise<BindResult>
  close: (sockId: string) => Promise<IpcResult>
  send: (
    sockId: string,
    host: string,
    port: number,
    data: string,
    encoding: string
  ) => Promise<SendResult>
  onData: (cb: (sockId: string, data: Uint8Array, rinfo: { address: string; port: number }) => void) => () => void
  onError: (cb: (sockId: string, error: string) => void) => () => void
}

interface ElectronSettings {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<IpcResult>
  getAll: () => Promise<Record<string, unknown>>
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
}

interface AuthLoginResult extends IpcResult {
  user?: GoogleUserInfo
}

interface ElectronAuth {
  getUser: () => Promise<GoogleUserInfo | null>
  logout: () => Promise<IpcResult>
  login: (provider: 'github' | 'google') => Promise<AuthLoginResult>
  refreshToken: () => Promise<AuthLoginResult>
  googleLogin: (clientId: string, clientSecret: string) => Promise<AuthLoginResult>
  supabaseLogin: (supabaseUrl: string, supabaseKey: string, provider: 'github' | 'google') => Promise<AuthLoginResult>
}

interface ConnectionContextParam {
  connectionId: string
  connectionType: string
  label: string
  status: string
  config: Record<string, unknown>
}

interface LLMStreamParams {
  provider: string
  model: string
  apiKey: string
  messages: { role: string; content: string }[]
  systemPrompt: string
  maxTokens: number
  temperature: number
  baseUrl?: string
  extraHeaders?: Record<string, string>
  connections?: ConnectionContextParam[]
  activeConnectionId?: string | null
}

interface LLMStreamResult extends IpcResult {
  requestId?: string
}

interface RAGEntry {
  timestamp: number
  direction: string
  raw: number[]
  from?: string
}

interface RAGSearchResult {
  content: string
  metadata: Record<string, unknown>
}

interface RAGSearchResponse extends IpcResult {
  results?: RAGSearchResult[]
}

interface RAGStatsResponse extends IpcResult {
  stats?: {
    totalEntries: number
    byConnection: Record<string, number>
    byDirection: Record<string, number>
  }
}

interface ElectronLLM {
  stream: (params: LLMStreamParams) => Promise<LLMStreamResult>
  cancel: (requestId: string) => Promise<IpcResult>
  onChunk: (cb: (requestId: string, text: string) => void) => () => void
  onDone: (cb: (requestId: string) => void) => () => void
  onError: (cb: (requestId: string, error: string) => void) => () => void
  ragAdd: (entry: RAGEntry, connectionId: string, connectionType: string) => Promise<IpcResult>
  ragBulkAdd: (entries: RAGEntry[], connectionId: string, connectionType: string) => Promise<IpcResult>
  ragSearch: (query: string, options?: { connectionId?: string; limit?: number; direction?: string; timeRangeMinutes?: number }) => Promise<RAGSearchResponse>
  ragStats: () => Promise<RAGStatsResponse>
  ragClear: (connectionId?: string) => Promise<IpcResult>
}

interface BleDeviceInfo {
  id: string
  name: string
  rssi: number
  address: string
}

interface BleServiceInfo {
  uuid: string
  characteristics: { uuid: string; properties: string[] }[]
}

interface BleScanResult extends IpcResult {
  devices?: BleDeviceInfo[]
}

interface BleConnectResult extends IpcResult {
  services?: BleServiceInfo[]
}

interface BleReadResult extends IpcResult {
  data?: number[]
}

interface ElectronBle {
  available: () => Promise<{ available: boolean }>
  scan: (durationMs?: number) => Promise<BleScanResult>
  stopScan: () => Promise<IpcResult>
  connect: (connId: string, deviceId: string) => Promise<BleConnectResult>
  disconnect: (connId: string) => Promise<IpcResult>
  read: (connId: string, serviceUuid: string, charUuid: string) => Promise<BleReadResult>
  write: (connId: string, serviceUuid: string, charUuid: string, data: number[], withoutResponse: boolean) => Promise<IpcResult>
  subscribe: (connId: string, serviceUuid: string, charUuid: string) => Promise<IpcResult>
  unsubscribe: (connId: string, serviceUuid: string, charUuid: string) => Promise<IpcResult>
  onDeviceFound: (cb: (device: BleDeviceInfo) => void) => () => void
  onData: (cb: (connId: string, data: number[]) => void) => () => void
  onDisconnect: (cb: (connId: string) => void) => () => void
}

interface SyncResult extends IpcResult {
  settings?: {
    api_keys?: {
      anthropicApiKey?: string
      openaiApiKey?: string
      googleAiKey?: string
      groqApiKey?: string
      openrouterApiKey?: string
    }
    connection_configs?: {
      id: string
      type: string
      label: string
      customLabel?: string
      config: Record<string, unknown>
      encoding: string
    }[]
    preferences?: {
      model?: string
      temperature?: number
      maxTokens?: number
      ollamaUrl?: string
      locale?: string
    }
  } | null
}

interface ElectronSync {
  load: () => Promise<SyncResult>
  save: (settings: unknown) => Promise<IpcResult>
  saveAll: () => Promise<IpcResult>
}

interface SessionConnectionConfig {
  id: string
  type: string
  label: string
  customLabel?: string
  config: Record<string, unknown>
  encoding: string
}

interface SessionLogEntry {
  timestamp: number
  direction: string
  hex: string
  ascii: string
}

interface SessionSaveData {
  sessionName: string
  connections: SessionConnectionConfig[]
  recentLogs: Record<string, SessionLogEntry[]>
}

interface SessionUpdateData {
  sessionName?: string
  connections?: SessionConnectionConfig[]
  recentLogs?: Record<string, SessionLogEntry[]>
}

interface SessionInfo {
  id: string
  session_name: string
  connections: SessionConnectionConfig[]
  created_at: string
  updated_at: string
}

interface SessionDetail extends SessionInfo {
  recent_logs: Record<string, SessionLogEntry[]>
}

interface SessionListResult extends IpcResult {
  sessions?: SessionInfo[]
}

interface SessionLoadResult extends IpcResult {
  session?: SessionDetail
}

interface ElectronSession {
  save: (data: SessionSaveData) => Promise<IpcResult>
  list: () => Promise<SessionListResult>
  load: (sessionId: string) => Promise<SessionLoadResult>
  delete: (sessionId: string) => Promise<IpcResult>
  update: (sessionId: string, data: SessionUpdateData) => Promise<IpcResult>
}

interface ElectronUpdater {
  check: () => Promise<IpcResult & { version?: string }>
  download: () => Promise<IpcResult>
  install: () => Promise<IpcResult>
  onChecking: (cb: () => void) => () => void
  onAvailable: (cb: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void
  onNotAvailable: (cb: () => void) => () => void
  onProgress: (cb: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void
  onDownloaded: (cb: (info: { version: string }) => void) => () => void
  onError: (cb: (error: string) => void) => () => void
}

interface ElectronAPI {
  serial: ElectronSerial
  tcp: ElectronTcp
  udp: ElectronUdp
  settings: ElectronSettings
  auth: ElectronAuth
  llm: ElectronLLM
  ble: ElectronBle
  sync: ElectronSync
  session: ElectronSession
  updater: ElectronUpdater
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
