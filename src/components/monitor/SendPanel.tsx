import { useState, useRef, useCallback } from 'react'
import { Send, Clock, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConnectionStore } from '@/store/connectionStore'
import type { Connection, DataEncoding } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface Props {
  connection: Connection
  onSend: (data: string, encoding: DataEncoding) => Promise<void>
}

const EOL_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'CR', value: '\r' },
  { label: 'LF', value: '\n' },
  { label: 'CR+LF', value: '\r\n' }
]

export function SendPanel({ connection, onSend }: Props) {
  const [input, setInput] = useState('')
  const [sendEncoding, setSendEncoding] = useState<DataEncoding>('ascii')
  const [eol, setEol] = useState('\n')
  const [sending, setSending] = useState(false)
  const { setPeriodicSend } = useConnectionStore()
  const { t } = useTranslation()
  const periodicTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const data = sendEncoding === 'ascii' ? input + eol : input
      await onSend(data, sendEncoding)
      setInput('')
    } finally {
      setSending(false)
    }
  }, [input, eol, sendEncoding, onSend, sending])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const togglePeriodic = () => {
    if (connection.periodicSend.active) {
      if (periodicTimer.current) clearInterval(periodicTimer.current)
      periodicTimer.current = null
      setPeriodicSend(connection.id, 'active', false)
      setPeriodicSend(connection.id, 'count', 0)
    } else {
      setPeriodicSend(connection.id, 'active', true)
      setPeriodicSend(connection.id, 'count', 0)
      periodicTimer.current = setInterval(async () => {
        const state = useConnectionStore.getState()
        const conn = state.connections.find((c) => c.id === connection.id)
        if (!conn?.periodicSend.active) {
          if (periodicTimer.current) clearInterval(periodicTimer.current)
          return
        }
        await onSend(conn.periodicSend.data, conn.periodicSend.encoding as DataEncoding)
        setPeriodicSend(connection.id, 'count', conn.periodicSend.count + 1)
      }, connection.periodicSend.intervalMs)
    }
  }

  return (
    <div className="border-t border-border p-3 space-y-2 bg-card/50">
      <div className="flex items-center gap-2">
        <div className="flex rounded-md overflow-hidden border border-border">
          {(['ascii', 'hex'] as DataEncoding[]).map((enc) => (
            <button
              key={enc}
              onClick={() => setSendEncoding(enc)}
              className={cn(
                'px-2 py-1 text-xs transition-colors',
                sendEncoding === enc ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {enc.toUpperCase()}
            </button>
          ))}
        </div>

        {sendEncoding === 'ascii' && (
          <div className="flex rounded-md overflow-hidden border border-border">
            {EOL_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setEol(opt.value)}
                className={cn(
                  'px-2 py-1 text-xs transition-colors',
                  eol === opt.value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          className="flex-1 h-8 text-xs font-mono"
          placeholder={sendEncoding === 'hex' ? t('send.hexPlaceholder') : t('send.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          size="sm"
          className="h-8 px-3"
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          <Send className="h-3 w-3 mr-1" />
          {t('send.send')}
        </Button>
      </div>

      {/* Periodic send */}
      <div className="flex items-center gap-2 text-xs">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <Input
          className="h-6 w-36 text-xs font-mono"
          placeholder={t('send.periodicPlaceholder')}
          value={connection.periodicSend.data}
          onChange={(e) => setPeriodicSend(connection.id, 'data', e.target.value)}
          disabled={connection.periodicSend.active}
        />
        <span className="text-muted-foreground">{t('send.every')}</span>
        <Input
          className="h-6 w-20 text-xs"
          type="number"
          value={connection.periodicSend.intervalMs}
          onChange={(e) => setPeriodicSend(connection.id, 'intervalMs', Number(e.target.value))}
          disabled={connection.periodicSend.active}
        />
        <span className="text-muted-foreground">{t('send.ms')}</span>
        <Button
          size="sm"
          variant={connection.periodicSend.active ? 'destructive' : 'outline'}
          className="h-6 text-xs px-2"
          onClick={togglePeriodic}
        >
          {connection.periodicSend.active ? (
            <><Square className="h-2 w-2 mr-1" />{t('send.stop')} ({connection.periodicSend.count})</>
          ) : t('send.start')}
        </Button>
      </div>
    </div>
  )
}
