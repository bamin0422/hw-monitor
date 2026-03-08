import { Copy, Check, Play, Send, RefreshCw, Unplug, Settings, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { ChatMessage as Msg, ChatAction, Connection } from '@/types'
import { cn } from '@/lib/utils'
import { parseActionBlocks, executeAction } from '@/lib/chatActions'
import { useConnectionStore } from '@/store/connectionStore'
import { useTranslation } from '@/lib/i18n'

interface Props {
  message: Msg
  onActionExecuted?: (action: ChatAction, result: { success: boolean; message: string }) => void
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  send: <Send className="h-3 w-3" />,
  reconnect: <RefreshCw className="h-3 w-3" />,
  disconnect: <Unplug className="h-3 w-3" />,
  configure: <Settings className="h-3 w-3" />
}

function ActionCard({
  action,
  onExecute
}: {
  action: ChatAction
  onExecute: (action: ChatAction) => Promise<void>
}) {
  const [status, setStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle')
  const [resultMsg, setResultMsg] = useState('')
  const { t } = useTranslation()

  const handleExecute = async () => {
    setStatus('executing')
    try {
      await onExecute(action)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setResultMsg(String(err))
    }
  }

  return (
    <div className={cn(
      'my-2 rounded-lg border p-2.5 text-xs',
      status === 'success' && 'border-green-500/30 bg-green-500/5',
      status === 'error' && 'border-red-500/30 bg-red-500/5',
      status === 'idle' && 'border-primary/30 bg-primary/5',
      status === 'executing' && 'border-yellow-500/30 bg-yellow-500/5'
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-primary">{ACTION_ICONS[action.action] || <Play className="h-3 w-3" />}</span>
        <span className="font-semibold text-foreground capitalize">{t(`action.${action.action}`)}</span>
      </div>
      <p className="text-muted-foreground mb-2">{action.description}</p>
      {action.data && (
        <div className="font-mono text-[10px] bg-black/20 rounded px-2 py-1 mb-2 break-all">
          {action.encoding === 'hex' ? `HEX: ${action.data}` : action.data}
        </div>
      )}
      {status === 'idle' && (
        <Button size="sm" className="h-6 text-[10px] gap-1" onClick={handleExecute}>
          <Play className="h-2.5 w-2.5" />
          {t('action.execute')}
        </Button>
      )}
      {status === 'executing' && (
        <div className="flex items-center gap-1.5 text-yellow-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{t('action.executing')}</span>
        </div>
      )}
      {status === 'success' && (
        <div className="flex items-center gap-1.5 text-green-400">
          <Check className="h-3 w-3" />
          <span>{t('action.success')}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="text-red-400">
          <span>{t('action.failed')}: {resultMsg}</span>
        </div>
      )}
    </div>
  )
}

export function ChatMessage({ message, onActionExecuted }: Props) {
  const [copied, setCopied] = useState(false)
  const { connections, activeConnectionId, updateConnectionStatus, appendData } = useConnectionStore()
  const { t } = useTranslation()

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExecuteAction = useCallback(async (action: ChatAction) => {
    const conn = connections.find((c) => c.id === activeConnectionId)
    if (!conn) throw new Error(t('action.noConnection'))

    const result = await executeAction(action, conn)

    if (result.success) {
      // Update connection status based on action
      if (action.action === 'reconnect') {
        updateConnectionStatus(conn.id, 'connected')
        appendData(conn.id, 'system', new TextEncoder().encode(`[AI] ${result.message}`))
      } else if (action.action === 'disconnect') {
        updateConnectionStatus(conn.id, 'disconnected')
        appendData(conn.id, 'system', new TextEncoder().encode(`[AI] ${result.message}`))
      } else if (action.action === 'send' && action.data) {
        const txBytes = action.encoding === 'hex'
          ? hexStringToBytes(action.data)
          : new TextEncoder().encode(action.data)
        appendData(conn.id, 'tx', txBytes)
      }

      onActionExecuted?.(action, result)
    } else {
      appendData(conn.id, 'system', new TextEncoder().encode(`[AI Error] ${result.message}`))
      onActionExecuted?.(action, result)
      throw new Error(result.message)
    }
  }, [connections, activeConnectionId, updateConnectionStatus, appendData, onActionExecuted, t])

  const isUser = message.role === 'user'

  // Render content with action block support
  const renderContent = (content: string) => {
    if (isUser || message.streaming) {
      return renderTextContent(content)
    }

    const segments = parseActionBlocks(content)
    return segments.map((seg, i) => {
      if (seg.type === 'action' && seg.action) {
        return <ActionCard key={i} action={seg.action} onExecute={handleExecuteAction} />
      }
      return <span key={i}>{renderTextContent(seg.content)}</span>
    })
  }

  // Simple markdown-like rendering: code blocks
  const renderTextContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g)
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n')
        const lang = lines[0].replace('```', '').trim()
        const code = lines.slice(1, -1).join('\n')
        return (
          <pre key={i} className="bg-black/40 rounded p-3 overflow-x-auto text-xs font-mono my-2 border border-border">
            {lang && <div className="text-muted-foreground text-[10px] mb-1">{lang}</div>}
            <code>{code}</code>
          </pre>
        )
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      )
    })
  }

  return (
    <div className={cn('flex gap-3 group', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
          <span className="text-[10px] text-primary font-bold">AI</span>
        </div>
      )}
      <div className={cn(
        'relative max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
        isUser
          ? 'bg-primary/20 border border-primary/30 text-foreground'
          : 'bg-card border border-border text-foreground'
      )}>
        {renderContent(message.content)}
        {message.streaming && (
          <span className="inline-block w-1 h-3 bg-primary ml-0.5 animate-pulse" />
        )}
        {!isUser && !message.streaming && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  )
}

// Utility: hex string to Uint8Array
function hexStringToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s+/g, '')
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
