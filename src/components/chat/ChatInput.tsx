import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useConnectionStore } from '@/store/connectionStore'
import { bufferToHex, bufferToAscii, formatTimestamp } from '@/lib/utils'
import { buildConnectionContext } from '@/lib/chatActions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation()
  const { connections, activeConnectionId } = useConnectionStore()
  const activeConn = connections.find((c) => c.id === activeConnectionId)

  // Connections that have data to attach
  const connectionsWithData = connections.filter((c) => c.data.length > 0)

  const handleSend = useCallback(() => {
    const msg = input.trim()
    if (!msg || disabled) return
    onSend(msg)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, onSend, disabled])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleAttachData = useCallback((conn: typeof activeConn) => {
    if (!conn || conn.data.length === 0) return

    const meta = buildConnectionContext(conn)
    const last30 = conn.data.slice(-30)
    const summary = last30
      .map((d) => {
        const ts = formatTimestamp(d.timestamp)
        const dir = d.direction.toUpperCase()
        const hex = bufferToHex(d.raw)
        const ascii = bufferToAscii(d.raw)
        const from = d.from ? ` (from ${d.from})` : ''
        return `[${ts}] ${dir}${from}: HEX: ${hex} | ASCII: ${ascii}`
      })
      .join('\n')

    const context = `\n\n[Connection Info]\n\`\`\`\n${meta}\n\`\`\`\n\n[Communication Data - last ${last30.length} entries]\n\`\`\`\n${summary}\n\`\`\`\n\n${t('chat.analyzeAndFix')}:`
    setInput((prev) => prev + context)
    textareaRef.current?.focus()
  }, [t])

  return (
    <div className="border-t border-border p-3 bg-card/30">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className={cn(
              'w-full min-h-[36px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed'
            )}
            placeholder={t('chat.inputPlaceholder')}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
        </div>
        <div className="flex flex-col gap-1">
          {connectionsWithData.length > 0 && (
            connectionsWithData.length === 1 ? (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAttachData(connectionsWithData[0])}
                title={t('chat.attachData')}
              >
                <Paperclip className="h-3 w-3" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title={t('chat.attachData')}
                  >
                    <Paperclip className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {connectionsWithData.map((conn) => (
                    <DropdownMenuItem
                      key={conn.id}
                      onClick={() => handleAttachData(conn)}
                      className="text-xs"
                    >
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full mr-2',
                        (conn.status === 'connected' || conn.status === 'listening')
                          ? 'bg-sky-500' : 'bg-muted-foreground'
                      )} />
                      {conn.customLabel || conn.label}
                      <span className="ml-auto text-muted-foreground text-[10px]">
                        {conn.data.length} {t('monitor.entries')}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          )}
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={handleSend}
            disabled={!input.trim() || disabled}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
