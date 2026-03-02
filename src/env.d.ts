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
  onData: (cb: (portId: string, data: Buffer) => void) => () => void
  onError: (cb: (portId: string, error: string) => void) => () => void
  onDisconnect: (cb: (portId: string) => void) => () => void
}

interface ElectronTcp {
  connect: (config: Record<string, unknown>) => Promise<IpcResult>
  listen: (config: Record<string, unknown>) => Promise<IpcResult>
  close: (connId: string) => Promise<IpcResult>
  send: (connId: string, data: string, encoding: string) => Promise<SendResult>
  onData: (cb: (connId: string, data: Buffer, from?: string) => void) => () => void
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
  onData: (cb: (sockId: string, data: Buffer, rinfo: { address: string; port: number }) => void) => () => void
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
  googleLogin: (clientId: string, clientSecret: string) => Promise<AuthLoginResult>
}

interface ElectronAPI {
  serial: ElectronSerial
  tcp: ElectronTcp
  udp: ElectronUdp
  settings: ElectronSettings
  auth: ElectronAuth
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
