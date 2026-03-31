import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import type { ConnectionStatus as StatusType } from '@/types'

interface Props {
  status: StatusType
  label?: string
}

export function ConnectionStatus({ status, label }: Props) {
  const { t } = useTranslation()

  const statusConfig = {
    disconnected: { color: 'bg-gray-500', text: t('status.disconnected'), pulse: false },
    connecting: { color: 'bg-yellow-500', text: t('status.connecting'), pulse: true },
    connected: { color: 'bg-sky-500', text: t('status.connected'), pulse: false },
    listening: { color: 'bg-blue-500', text: t('status.listening'), pulse: true },
    error: { color: 'bg-red-500', text: t('status.error'), pulse: false }
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-2 w-2 rounded-full', config.color, config.pulse && 'animate-pulse')} />
      <span className="text-xs text-muted-foreground">{label || config.text}</span>
    </div>
  )
}
