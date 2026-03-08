import { useState, useEffect } from 'react'
import { RefreshCw, Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import type { SerialConfig as Config, PortInfo } from '@/types'

interface Props {
  connectionId: string
  onConnect: () => void
  onDisconnect: () => void
  isConnected: boolean
}

const BAUD_RATES = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]

export function SerialConfig({ connectionId, onConnect, onDisconnect, isConnected }: Props) {
  const [ports, setPorts] = useState<PortInfo[]>([])
  const { connections, updateConnectionConfig } = useConnectionStore()
  const conn = connections.find((c) => c.id === connectionId)
  const config = conn?.config as Config

  const refreshPorts = async () => {
    const result = await window.electronAPI.serial.listPorts()
    if (result.success) setPorts(result.ports)
  }

  useEffect(() => {
    refreshPorts()
  }, [])

  const { t } = useTranslation()

  const update = (key: keyof Config, value: unknown) => {
    updateConnectionConfig(connectionId, { [key]: value } as Partial<Config>)
  }

  return (
    <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('serial.title')}</span>
        <Select value={config?.label} onValueChange={(v) => update('label', v)}>
          <SelectTrigger className="h-6 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RS-232">RS-232</SelectItem>
            <SelectItem value="RS-422">RS-422</SelectItem>
            <SelectItem value="RS-485">RS-485</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">{t('serial.port')}</Label>
          <div className="flex gap-1 mt-1">
            <Select value={config?.path} onValueChange={(v) => update('path', v)}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder={t('serial.selectPort')} />
              </SelectTrigger>
              <SelectContent>
                {ports.map((p) => (
                  <SelectItem key={p.path} value={p.path}>
                    {p.path} {p.manufacturer ? `(${p.manufacturer})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={refreshPorts}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{t('serial.baudRate')}</Label>
          <Select
            value={String(config?.baudRate)}
            onValueChange={(v) => update('baudRate', Number(v))}
          >
            <SelectTrigger className="h-7 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BAUD_RATES.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{t('serial.dataBits')}</Label>
          <Select
            value={String(config?.dataBits)}
            onValueChange={(v) => update('dataBits', Number(v))}
          >
            <SelectTrigger className="h-7 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 6, 7, 8].map((b) => (
                <SelectItem key={b} value={String(b)}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{t('serial.stopBits')}</Label>
          <Select
            value={String(config?.stopBits)}
            onValueChange={(v) => update('stopBits', Number(v))}
          >
            <SelectTrigger className="h-7 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 1.5, 2].map((b) => (
                <SelectItem key={b} value={String(b)}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{t('serial.parity')}</Label>
          <Select value={config?.parity} onValueChange={(v) => update('parity', v)}>
            <SelectTrigger className="h-7 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['none', 'even', 'odd', 'mark', 'space'].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">{t('serial.flowControl')}</Label>
          <Select value={config?.flowControl} onValueChange={(v) => update('flowControl', v)}>
            <SelectTrigger className="h-7 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('serial.flowNone')}</SelectItem>
              <SelectItem value="hardware">{t('serial.flowHardware')}</SelectItem>
              <SelectItem value="software">{t('serial.flowSoftware')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="w-full h-7 text-xs"
        variant={isConnected ? 'destructive' : 'default'}
        onClick={isConnected ? onDisconnect : onConnect}
      >
        <Plug className="h-3 w-3 mr-1" />
        {isConnected ? t('serial.disconnect') : t('serial.connect')}
      </Button>
    </div>
  )
}
