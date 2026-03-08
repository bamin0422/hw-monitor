import { contextBridge, ipcRenderer } from 'electron'

// Serial API
const serialAPI = {
  listPorts: () => ipcRenderer.invoke('serial:list-ports'),
  open: (config: unknown) => ipcRenderer.invoke('serial:open', config),
  close: (portId: string) => ipcRenderer.invoke('serial:close', portId),
  send: (portId: string, data: Buffer | string, encoding: string) =>
    ipcRenderer.invoke('serial:send', portId, data, encoding),
  onData: (callback: (portId: string, data: Buffer) => void) => {
    const handler = (_: unknown, portId: string, data: Buffer) => callback(portId, data)
    ipcRenderer.on('serial:data', handler)
    return () => ipcRenderer.removeListener('serial:data', handler)
  },
  onError: (callback: (portId: string, error: string) => void) => {
    const handler = (_: unknown, portId: string, error: string) => callback(portId, error)
    ipcRenderer.on('serial:error', handler)
    return () => ipcRenderer.removeListener('serial:error', handler)
  },
  onDisconnect: (callback: (portId: string) => void) => {
    const handler = (_: unknown, portId: string) => callback(portId)
    ipcRenderer.on('serial:disconnect', handler)
    return () => ipcRenderer.removeListener('serial:disconnect', handler)
  }
}

// TCP API
const tcpAPI = {
  connect: (config: unknown) => ipcRenderer.invoke('tcp:connect', config),
  listen: (config: unknown) => ipcRenderer.invoke('tcp:listen', config),
  close: (connId: string) => ipcRenderer.invoke('tcp:close', connId),
  send: (connId: string, data: Buffer | string, encoding: string) =>
    ipcRenderer.invoke('tcp:send', connId, data, encoding),
  onData: (callback: (connId: string, data: Buffer, from?: string) => void) => {
    const handler = (_: unknown, connId: string, data: Buffer, from?: string) =>
      callback(connId, data, from)
    ipcRenderer.on('tcp:data', handler)
    return () => ipcRenderer.removeListener('tcp:data', handler)
  },
  onClientConnect: (callback: (connId: string, clientAddr: string) => void) => {
    const handler = (_: unknown, connId: string, clientAddr: string) =>
      callback(connId, clientAddr)
    ipcRenderer.on('tcp:client-connect', handler)
    return () => ipcRenderer.removeListener('tcp:client-connect', handler)
  },
  onClientDisconnect: (callback: (connId: string, clientAddr: string) => void) => {
    const handler = (_: unknown, connId: string, clientAddr: string) =>
      callback(connId, clientAddr)
    ipcRenderer.on('tcp:client-disconnect', handler)
    return () => ipcRenderer.removeListener('tcp:client-disconnect', handler)
  },
  onError: (callback: (connId: string, error: string) => void) => {
    const handler = (_: unknown, connId: string, error: string) => callback(connId, error)
    ipcRenderer.on('tcp:error', handler)
    return () => ipcRenderer.removeListener('tcp:error', handler)
  },
  onDisconnect: (callback: (connId: string) => void) => {
    const handler = (_: unknown, connId: string) => callback(connId)
    ipcRenderer.on('tcp:disconnect', handler)
    return () => ipcRenderer.removeListener('tcp:disconnect', handler)
  }
}

// UDP API
const udpAPI = {
  bind: (config: unknown) => ipcRenderer.invoke('udp:bind', config),
  close: (sockId: string) => ipcRenderer.invoke('udp:close', sockId),
  send: (sockId: string, host: string, port: number, data: Buffer | string, encoding: string) =>
    ipcRenderer.invoke('udp:send', sockId, host, port, data, encoding),
  onData: (callback: (sockId: string, data: Buffer, rinfo: unknown) => void) => {
    const handler = (_: unknown, sockId: string, data: Buffer, rinfo: unknown) =>
      callback(sockId, data, rinfo)
    ipcRenderer.on('udp:data', handler)
    return () => ipcRenderer.removeListener('udp:data', handler)
  },
  onError: (callback: (sockId: string, error: string) => void) => {
    const handler = (_: unknown, sockId: string, error: string) => callback(sockId, error)
    ipcRenderer.on('udp:error', handler)
    return () => ipcRenderer.removeListener('udp:error', handler)
  }
}

// Settings API
const settingsAPI = {
  get: (key: string) => ipcRenderer.invoke('settings:get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  getAll: () => ipcRenderer.invoke('settings:get-all')
}

// Auth API
const authAPI = {
  getUser: () => ipcRenderer.invoke('auth:get-user'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  login: (provider: 'github' | 'google') =>
    ipcRenderer.invoke('auth:login', provider),
  refreshToken: () => ipcRenderer.invoke('auth:refresh-token'),
  googleLogin: (clientId: string, clientSecret: string) =>
    ipcRenderer.invoke('auth:google-login', clientId, clientSecret),
  supabaseLogin: (supabaseUrl: string, supabaseKey: string, provider: 'github' | 'google') =>
    ipcRenderer.invoke('auth:supabase-login', supabaseUrl, supabaseKey, provider)
}

// LLM API
const llmAPI = {
  stream: (params: {
    provider: string
    model: string
    apiKey: string
    messages: { role: string; content: string }[]
    systemPrompt: string
    maxTokens: number
    temperature: number
    baseUrl?: string
    extraHeaders?: Record<string, string>
    connections?: { connectionId: string; connectionType: string; label: string; status: string; config: Record<string, unknown> }[]
    activeConnectionId?: string | null
  }) => ipcRenderer.invoke('llm:stream', params),
  cancel: (requestId: string) => ipcRenderer.invoke('llm:cancel', requestId),
  onChunk: (callback: (requestId: string, text: string) => void) => {
    const handler = (_: unknown, requestId: string, text: string) =>
      callback(requestId, text)
    ipcRenderer.on('llm:chunk', handler)
    return () => ipcRenderer.removeListener('llm:chunk', handler)
  },
  onDone: (callback: (requestId: string) => void) => {
    const handler = (_: unknown, requestId: string) => callback(requestId)
    ipcRenderer.on('llm:done', handler)
    return () => ipcRenderer.removeListener('llm:done', handler)
  },
  onError: (callback: (requestId: string, error: string) => void) => {
    const handler = (_: unknown, requestId: string, error: string) =>
      callback(requestId, error)
    ipcRenderer.on('llm:error', handler)
    return () => ipcRenderer.removeListener('llm:error', handler)
  },
  // RAG data store
  ragAdd: (
    entry: { timestamp: number; direction: string; raw: number[]; from?: string },
    connectionId: string,
    connectionType: string
  ) => ipcRenderer.invoke('llm:rag-add', entry, connectionId, connectionType),
  ragBulkAdd: (
    entries: { timestamp: number; direction: string; raw: number[]; from?: string }[],
    connectionId: string,
    connectionType: string
  ) => ipcRenderer.invoke('llm:rag-bulk-add', entries, connectionId, connectionType),
  ragSearch: (
    query: string,
    options?: { connectionId?: string; limit?: number; direction?: string; timeRangeMinutes?: number }
  ) => ipcRenderer.invoke('llm:rag-search', query, options),
  ragStats: () => ipcRenderer.invoke('llm:rag-stats'),
  ragClear: (connectionId?: string) => ipcRenderer.invoke('llm:rag-clear', connectionId)
}

// BLE API
const bleAPI = {
  available: () => ipcRenderer.invoke('ble:available'),
  scan: (durationMs?: number) => ipcRenderer.invoke('ble:scan', durationMs),
  stopScan: () => ipcRenderer.invoke('ble:stop-scan'),
  connect: (connId: string, deviceId: string) =>
    ipcRenderer.invoke('ble:connect', connId, deviceId),
  disconnect: (connId: string) => ipcRenderer.invoke('ble:disconnect', connId),
  read: (connId: string, serviceUuid: string, charUuid: string) =>
    ipcRenderer.invoke('ble:read', connId, serviceUuid, charUuid),
  write: (connId: string, serviceUuid: string, charUuid: string, data: number[], withoutResponse: boolean) =>
    ipcRenderer.invoke('ble:write', connId, serviceUuid, charUuid, data, withoutResponse),
  subscribe: (connId: string, serviceUuid: string, charUuid: string) =>
    ipcRenderer.invoke('ble:subscribe', connId, serviceUuid, charUuid),
  unsubscribe: (connId: string, serviceUuid: string, charUuid: string) =>
    ipcRenderer.invoke('ble:unsubscribe', connId, serviceUuid, charUuid),
  onDeviceFound: (callback: (device: unknown) => void) => {
    const handler = (_: unknown, device: unknown) => callback(device)
    ipcRenderer.on('ble:device-found', handler)
    return () => ipcRenderer.removeListener('ble:device-found', handler)
  },
  onData: (callback: (connId: string, data: number[]) => void) => {
    const handler = (_: unknown, connId: string, data: number[]) => callback(connId, data)
    ipcRenderer.on('ble:data', handler)
    return () => ipcRenderer.removeListener('ble:data', handler)
  },
  onDisconnect: (callback: (connId: string) => void) => {
    const handler = (_: unknown, connId: string) => callback(connId)
    ipcRenderer.on('ble:disconnect', handler)
    return () => ipcRenderer.removeListener('ble:disconnect', handler)
  }
}

// Sync API (Supabase cloud storage)
const syncAPI = {
  load: () => ipcRenderer.invoke('sync:load'),
  save: (settings: unknown) => ipcRenderer.invoke('sync:save', settings),
  saveAll: () => ipcRenderer.invoke('sync:save-all')
}

// Session API (communication session persistence)
const sessionAPI = {
  save: (data: {
    sessionName: string
    connections: { id: string; type: string; label: string; customLabel?: string; config: Record<string, unknown>; encoding: string }[]
    recentLogs: Record<string, { timestamp: number; direction: string; hex: string; ascii: string }[]>
  }) => ipcRenderer.invoke('session:save', data),
  list: () => ipcRenderer.invoke('session:list'),
  load: (sessionId: string) => ipcRenderer.invoke('session:load', sessionId),
  delete: (sessionId: string) => ipcRenderer.invoke('session:delete', sessionId),
  update: (sessionId: string, data: {
    sessionName?: string
    connections?: { id: string; type: string; label: string; customLabel?: string; config: Record<string, unknown>; encoding: string }[]
    recentLogs?: Record<string, { timestamp: number; direction: string; hex: string; ascii: string }[]>
  }) => ipcRenderer.invoke('session:update', sessionId, data)
}

// Updater API
const updaterAPI = {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  onChecking: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('updater:checking', handler)
    return () => ipcRenderer.removeListener('updater:checking', handler)
  },
  onAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => {
    const handler = (_: unknown, info: { version: string; releaseDate?: string; releaseNotes?: string }) => callback(info)
    ipcRenderer.on('updater:available', handler)
    return () => ipcRenderer.removeListener('updater:available', handler)
  },
  onNotAvailable: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('updater:not-available', handler)
    return () => ipcRenderer.removeListener('updater:not-available', handler)
  },
  onProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
    const handler = (_: unknown, progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => callback(progress)
    ipcRenderer.on('updater:progress', handler)
    return () => ipcRenderer.removeListener('updater:progress', handler)
  },
  onDownloaded: (callback: (info: { version: string }) => void) => {
    const handler = (_: unknown, info: { version: string }) => callback(info)
    ipcRenderer.on('updater:downloaded', handler)
    return () => ipcRenderer.removeListener('updater:downloaded', handler)
  },
  onError: (callback: (error: string) => void) => {
    const handler = (_: unknown, error: string) => callback(error)
    ipcRenderer.on('updater:error', handler)
    return () => ipcRenderer.removeListener('updater:error', handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  serial: serialAPI,
  tcp: tcpAPI,
  udp: udpAPI,
  settings: settingsAPI,
  auth: authAPI,
  llm: llmAPI,
  ble: bleAPI,
  sync: syncAPI,
  session: sessionAPI,
  updater: updaterAPI
})
