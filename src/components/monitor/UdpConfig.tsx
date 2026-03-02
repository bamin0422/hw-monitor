import { Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConnectionStore } from '@/store/connectionStore'
import type { UdpConfig as Config } from '@/types'

interface Props {
  connectionId: string
  onBind: () => void
  onClose: () => void
  isBound: boolean
}

export function UdpConfig({ connectionId, onBind, onClose, isBound }: Props) {
  const { connections, updateConnectionConfig } = useConnectionStore()
  const conn = connections.find((c) => c.id === connectionId)
  const config = conn?.config as Config

  const update = (key: keyof Config, value: unknown) =>
    updateConnectionConfig(connectionId, { [key]: value } as Partial<Config>)

  return (
    <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">UDP Socket</span>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Local Host</Label>
          <Input
            className="h-7 text-xs mt-1"
            value={config?.localHost || ''}
            onChange={(e) => update('localHost', e.target.value)}
            placeholder="0.0.0.0"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Local Port</Label>
          <Input
            className="h-7 text-xs mt-1"
            type="number"
            value={config?.localPort || 9090}
            onChange={(e) => update('localPort', Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Target Host</Label>
          <Input
            className="h-7 text-xs mt-1"
            value={config?.targetHost || ''}
            onChange={(e) => update('targetHost', e.target.value)}
            placeholder="127.0.0.1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Target Port</Label>
          <Input
            className="h-7 text-xs mt-1"
            type="number"
            value={config?.targetPort || 9090}
            onChange={(e) => update('targetPort', Number(e.target.value))}
          />
        </div>
      </div>
      <Button
        className="w-full h-7 text-xs"
        variant={isBound ? 'destructive' : 'default'}
        onClick={isBound ? onClose : onBind}
      >
        <Plug className="h-3 w-3 mr-1" />
        {isBound ? 'Close Socket' : 'Bind Socket'}
      </Button>
    </div>
  )
}
