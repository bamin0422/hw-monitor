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
  googleLogin: (clientId: string, clientSecret: string) =>
    ipcRenderer.invoke('auth:google-login', clientId, clientSecret)
}

contextBridge.exposeInMainWorld('electronAPI', {
  serial: serialAPI,
  tcp: tcpAPI,
  udp: udpAPI,
  settings: settingsAPI,
  auth: authAPI
})
