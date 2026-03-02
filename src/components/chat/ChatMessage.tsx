import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ChatMessage as Msg } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  message: Msg
}

export function ChatMessage({ message }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === 'user'

  // Simple markdown-like rendering: code blocks
  const renderContent = (content: string) => {
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
