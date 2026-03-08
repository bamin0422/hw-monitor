import { useState, useEffect, useCallback } from 'react'
import { Bluetooth, Search, Loader2 } from 'lucide-react'
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
import type { BleConfig as BleConfigType, BleDevice } from '@/types'

interface BleConfigProps {
  connectionId: string
  onConnect: () => void
  onDisconnect: () => void
  isConnected: boolean
}

export function BleConfig({ connectionId, onConnect, onDisconnect, isConnected }: BleConfigProps) {
  const { connections, updateConnectionConfig } = useConnectionStore()
  const { t } = useTranslation()
  const conn = connections.find((c) => c.id === connectionId)
  const config = conn?.config as BleConfigType | undefined

  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState<BleDevice[]>([])
  const [bleAvailable, setBleAvailable] = useState(true)
  const [services, setServices] = useState<{ uuid: string; characteristics: { uuid: string; properties: string[] }[] }[]>([])

  useEffect(() => {
    window.electronAPI.ble.available().then((result) => {
      setBleAvailable(result.available)
    })
  }, [])

  // Listen for discovered devices during scan
  useEffect(() => {
    const unsub = window.electronAPI.ble.onDeviceFound((device) => {
      setDevices((prev) => {
        if (prev.find((d) => d.id === (device as BleDevice).id)) return prev
        return [...prev, device as BleDevice]
      })
    })
    return unsub
  }, [])

  const handleScan = useCallback(async () => {
    setScanning(true)
    setDevices([])
    try {
      const result = await window.electronAPI.ble.scan(5000)
      if (result.success && result.devices) {
        setDevices(result.devices)
      }
    } finally {
      setScanning(false)
    }
  }, [])

  const handleDeviceSelect = useCallback(
    (deviceId: string) => {
      const device = devices.find((d) => d.id === deviceId)
      if (device) {
        updateConnectionConfig(connectionId, {
          deviceId: device.id,
          deviceName: device.name
        })
      }
    },
    [devices, connectionId, updateConnectionConfig]
  )

  const handleConnect = useCallback(async () => {
    if (!config?.deviceId) return
    onConnect()
    // After connect, the MonitorPanel will handle the actual BLE connection
    // and update services
  }, [config, onConnect])

  if (!bleAvailable) {
    return (
      <div className="p-3 bg-card rounded-lg border border-border space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Bluetooth className="h-3 w-3" />
          BLE
        </span>
        <p className="text-xs text-muted-foreground">{t('ble.notAvailable')}</p>
      </div>
    )
  }

  return (
    <div className="p-3 bg-card rounded-lg border border-border space-y-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Bluetooth className="h-3 w-3" />
        {t('ble.title')}
      </span>

      {/* Scan for devices */}
      <div className="space-y-1.5">
        <Label className="text-xs">{t('ble.device')}</Label>
        <div className="flex gap-1">
          <Select
            value={config?.deviceId || ''}
            onValueChange={handleDeviceSelect}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder={t('ble.selectDevice')}>
                {config?.deviceName || t('ble.selectDevice')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {devices.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>{d.name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {d.rssi}dBm
                    </span>
                  </div>
                </SelectItem>
              ))}
              {devices.length === 0 && (
                <SelectItem value="_none" disabled className="text-xs text-muted-foreground">
                  {t('ble.noDevices')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Connect/Disconnect */}
      <Button
        className="w-full h-7 text-xs"
        variant={isConnected ? 'destructive' : 'default'}
        onClick={isConnected ? onDisconnect : handleConnect}
        disabled={!config?.deviceId}
      >
        {isConnected ? t('ble.disconnect') : t('ble.connect')}
      </Button>

      {/* Auto-detected UUIDs (shown after connection) */}
      {isConnected && (config?.serviceUuid || config?.writeCharacteristicUuid || config?.notifyCharacteristicUuid) && (
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Auto-detected
          </span>
          {config?.serviceUuid && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Service</span>
              <div className="text-[10px] font-mono text-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded truncate">
                {config.serviceUuid}
              </div>
            </div>
          )}
          {config?.writeCharacteristicUuid && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Write</span>
              <div className="text-[10px] font-mono text-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded truncate">
                {config.writeCharacteristicUuid}
              </div>
            </div>
          )}
          {config?.notifyCharacteristicUuid && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Notify</span>
              <div className="text-[10px] font-mono text-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded truncate">
                {config.notifyCharacteristicUuid}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
