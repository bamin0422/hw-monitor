import { useState } from 'react'
import { Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useConnectionStore } from '@/store/connectionStore'
import { useTranslation } from '@/lib/i18n'
import type { TcpClientConfig, TcpServerConfig, ConnectionType } from '@/types'

interface Props {
  connectionId: string
  connectionType: ConnectionType
  onConnect: () => void
  onDisconnect: () => void
  isConnected: boolean
}

export function TcpConfig({ connectionId, connectionType, onConnect, onDisconnect, isConnected }: Props) {
  const { connections, updateConnectionConfig } = useConnectionStore()
  const conn = connections.find((c) => c.id === connectionId)

  const { t } = useTranslation()

  if (connectionType === 'tcp-client') {
    const config = conn?.config as TcpClientConfig
    const update = (key: keyof TcpClientConfig, value: unknown) =>
      updateConnectionConfig(connectionId, { [key]: value } as Partial<TcpClientConfig>)

    return (
      <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('tcp.client')}</span>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">{t('tcp.host')}</Label>
            <Input
              className="h-7 text-xs mt-1"
              value={config?.host || ''}
              onChange={(e) => update('host', e.target.value)}
              placeholder="127.0.0.1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t('tcp.port')}</Label>
            <Input
              className="h-7 text-xs mt-1"
              type="number"
              value={config?.port || 8080}
              onChange={(e) => update('port', Number(e.target.value))}
            />
          </div>
        </div>
        <Button
          className="w-full h-7 text-xs"
          variant={isConnected ? 'destructive' : 'default'}
          onClick={isConnected ? onDisconnect : onConnect}
        >
          <Plug className="h-3 w-3 mr-1" />
          {isConnected ? t('tcp.disconnect') : t('tcp.connect')}
        </Button>
      </div>
    )
  }

  // TCP Server
  const config = conn?.config as TcpServerConfig
  const update = (key: keyof TcpServerConfig, value: unknown) =>
    updateConnectionConfig(connectionId, { [key]: value } as Partial<TcpServerConfig>)

  return (
    <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('tcp.server')}</span>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">{t('tcp.bindAddress')}</Label>
          <Input
            className="h-7 text-xs mt-1"
            value={config?.host || ''}
            onChange={(e) => update('host', e.target.value)}
            placeholder="0.0.0.0"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t('tcp.port')}</Label>
          <Input
            className="h-7 text-xs mt-1"
            type="number"
            value={config?.port || 8080}
            onChange={(e) => update('port', Number(e.target.value))}
          />
        </div>
      </div>
      <Button
        className="w-full h-7 text-xs"
        variant={isConnected ? 'destructive' : 'default'}
        onClick={isConnected ? onDisconnect : onConnect}
      >
        <Plug className="h-3 w-3 mr-1" />
        {isConnected ? t('tcp.stopServer') : t('tcp.startServer')}
      </Button>
    </div>
  )
}
