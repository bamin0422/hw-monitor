import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConnectionStore } from '@/store/connectionStore'
import { bufferToHex, bufferToAscii } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { connections, activeConnectionId } = useConnectionStore()
  const activeConn = connections.find((c) => c.id === activeConnectionId)

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

  const handleAttachData = () => {
    if (!activeConn || activeConn.data.length === 0) return
    const last20 = activeConn.data.slice(-20)
    const summary = last20
      .map((d) => {
        const dir = d.direction.toUpperCase()
        const hex = bufferToHex(d.raw)
        const ascii = bufferToAscii(d.raw)
        return `[${dir}] HEX: ${hex} | ASCII: ${ascii}`
      })
      .join('\n')
    const context = `\n\n[Communication Data from ${activeConn.label}]\n\`\`\`\n${summary}\n\`\`\`\n\nAnalyze this data:`
    setInput((prev) => prev + context)
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t border-border p-3 bg-card/30">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className={cn(
              'w-full min-h-[36px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed'
            )}
            placeholder="Ask about protocols, analyze data... (Shift+Enter for newline)"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
        </div>
        <div className="flex flex-col gap-1">
          {activeConn && activeConn.data.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleAttachData}
              title="Attach recent communication data"
            >
              <Paperclip className="h-3 w-3" />
            </Button>
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
