import { useRef, useEffect, useCallback } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { Trash2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { SettingsModal } from './SettingsModal'
import { useConnectionStore } from '@/store/connectionStore'
import { ScrollArea } from '@/components/ui/scroll-area'

const GOOGLE_MODEL_IDS = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-2.0-pro']

const SYSTEM_PROMPT =
  'You are a hardware communication expert specializing in serial protocols (RS-232, RS-422, RS-485), TCP/IP, and UDP. Help users design, debug, and implement communication protocols. When showing code examples, use appropriate language-specific code blocks. Be concise and practical.'

async function streamGemini(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void
): Promise<void> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 4096 }
      })
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') break
      try {
        const json = JSON.parse(data)
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) onChunk(text)
      } catch {
        // ignore parse errors on partial chunks
      }
    }
  }
}

export function ChatPanel() {
  const {
    chatMessages,
    addChatMessage,
    appendChatContent,
    finishChatMessage,
    clearChat,
    settings,
    streamingMessageId,
    setStreamingMessageId
  } = useConnectionStore()

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = useCallback(
    async (userMessage: string) => {
      if (streamingMessageId) return

      const isGemini = GOOGLE_MODEL_IDS.includes(settings.model)

      if (isGemini) {
        const googleAiKey = await window.electronAPI.settings.get('googleAiKey')
        if (!googleAiKey) {
          addChatMessage('assistant', '⚠️ Gemini를 사용하려면 설정에서 Google AI API Key를 입력해주세요.')
          return
        }

        addChatMessage('user', userMessage)
        const assistantId = addChatMessage('assistant', '')
        setStreamingMessageId(assistantId)

        const history = chatMessages
          .slice(-20)
          .filter((m) => !m.streaming)
          .map((m) => ({ role: m.role, content: m.content }))
        history.push({ role: 'user', content: userMessage })

        try {
          await streamGemini(googleAiKey as string, settings.model, history, (text) => {
            appendChatContent(assistantId, text)
          })
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          appendChatContent(assistantId, `\n\n❌ Error: ${errMsg}`)
        } finally {
          finishChatMessage(assistantId)
          setStreamingMessageId(null)
        }
        return
      }

      // Claude (Anthropic)
      const apiKey = await window.electronAPI.settings.get('anthropicApiKey')
      if (!apiKey) {
        addChatMessage('assistant', '⚠️ 설정에서 Anthropic API Key를 입력해주세요 (톱니바퀴 아이콘).')
        return
      }

      addChatMessage('user', userMessage)
      const assistantId = addChatMessage('assistant', '')
      setStreamingMessageId(assistantId)

      try {
        const client = new Anthropic({ apiKey: apiKey as string, dangerouslyAllowBrowser: true })

        const historyMessages = chatMessages
          .slice(-20)
          .filter((m) => !m.streaming)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        historyMessages.push({ role: 'user', content: userMessage })

        const stream = await client.messages.stream({
          model: settings.model,
          max_tokens: settings.maxTokens,
          system: SYSTEM_PROMPT,
          messages: historyMessages
        })

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            appendChatContent(assistantId, chunk.delta.text)
          }
        }

        finishChatMessage(assistantId)
        setStreamingMessageId(null)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        appendChatContent(assistantId, `\n\n❌ Error: ${errMsg}`)
        finishChatMessage(assistantId)
        setStreamingMessageId(null)
      }
    },
    [
      chatMessages,
      settings,
      streamingMessageId,
      addChatMessage,
      appendChatContent,
      finishChatMessage,
      setStreamingMessageId
    ]
  )

  const modelLabel = (() => {
    const parts = settings.model.split('-')
    if (settings.model.startsWith('gemini')) return parts.slice(0, 2).join('-')
    return parts.slice(0, 3).join('-')
  })()

  const isGemini = GOOGLE_MODEL_IDS.includes(settings.model)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Protocol Assistant</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            isGemini
              ? 'bg-blue-500/15 text-blue-400'
              : 'bg-primary/15 text-primary'
          }`}>
            {modelLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearChat}
            title="대화 초기화"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <SettingsModal />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-muted-foreground">
            <Bot className="h-10 w-10 opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium">Protocol Assistant</p>
              <p className="text-xs mt-1 opacity-70">RS-232, TCP, UDP 프로토콜에 대해 물어보세요</p>
              <p className="text-xs opacity-70">또는 통신 데이터를 붙여넣어 분석하세요</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <ChatInput onSend={handleSend} disabled={!!streamingMessageId} />
    </div>
  )
}
