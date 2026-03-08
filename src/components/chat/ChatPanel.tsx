import { useRef, useEffect, useCallback } from 'react'
import { Trash2, Bot, Zap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { SettingsModal } from './SettingsModal'
import { useConnectionStore } from '@/store/connectionStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation, useI18nStore } from '@/lib/i18n'
import { buildSystemPrompt } from '@/lib/chatActions'
import {
  OLLAMA_MODELS,
  GROQ_MODELS,
  OPENROUTER_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
  OPENAI_MODELS,
  getApiModelId,
  getModelInfo,
  getProviderForModel
} from '@/lib/models'
import type { Provider } from '@/lib/models'

// ── Provider badge colors ──
const PROVIDER_BADGE: Record<Provider, string> = {
  ollama: 'bg-orange-500/15 text-orange-400',
  groq: 'bg-purple-500/15 text-purple-400',
  openrouter: 'bg-cyan-500/15 text-cyan-400',
  anthropic: 'bg-primary/15 text-primary',
  google: 'bg-blue-500/15 text-blue-400',
  openai: 'bg-emerald-500/15 text-emerald-400'
}

const PROVIDER_SHORT: Record<Provider, string> = {
  ollama: 'OL',
  groq: 'GQ',
  openrouter: 'OR',
  anthropic: 'A',
  google: 'G',
  openai: 'O'
}

export function ChatPanel() {
  const {
    chatMessages,
    addChatMessage,
    appendChatContent,
    finishChatMessage,
    clearChat,
    settings,
    updateSettings,
    streamingMessageId,
    setStreamingMessageId,
    connections,
    activeConnectionId
  } = useConnectionStore()

  const { t } = useTranslation()
  const locale = useI18nStore((s) => s.locale)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeRequestRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Load saved model + API keys on mount so the Select can filter correctly
  useEffect(() => {
    const keys = ['model', 'groqApiKey', 'openrouterApiKey', 'anthropicApiKey', 'googleAiKey', 'openaiApiKey'] as const
    Promise.all(keys.map((k) => window.electronAPI.settings.get(k))).then(
      ([model, groqApiKey, openrouterApiKey, anthropicApiKey, googleAiKey, openaiApiKey]) => {
        const updates: Record<string, string> = {}
        if (model && typeof model === 'string') updates.model = model
        if (groqApiKey && typeof groqApiKey === 'string') updates.groqApiKey = groqApiKey
        if (openrouterApiKey && typeof openrouterApiKey === 'string') updates.openrouterApiKey = openrouterApiKey
        if (anthropicApiKey && typeof anthropicApiKey === 'string') updates.anthropicApiKey = anthropicApiKey
        if (googleAiKey && typeof googleAiKey === 'string') updates.googleAiKey = googleAiKey
        if (openaiApiKey && typeof openaiApiKey === 'string') updates.openaiApiKey = openaiApiKey
        if (Object.keys(updates).length > 0) updateSettings(updates)
      }
    )
  }, [updateSettings])

  const handleModelChange = (modelId: string) => {
    updateSettings({ model: modelId })
    // Save to Supabase (primary) — also caches to electron-store locally
    window.electronAPI.sync?.save({ preferences: { model: modelId } }).catch(() => {})
  }

  const handleSend = useCallback(
    async (userMessage: string) => {
      if (streamingMessageId) return

      const provider = getProviderForModel(settings.model)
      const apiModelId = getApiModelId(settings.model)

      if (!provider) {
        addChatMessage('assistant', `Unknown model: ${settings.model}`)
        return
      }

      // Resolve API key for the provider
      let apiKey = ''
      let baseUrl: string | undefined

      switch (provider) {
        case 'ollama':
          baseUrl = settings.ollamaUrl || 'http://localhost:11434'
          break
        case 'groq':
          apiKey = settings.groqApiKey || (await window.electronAPI.settings.get('groqApiKey') as string) || ''
          if (!apiKey) { addChatMessage('assistant', t('chat.groqKeyRequired')); return }
          break
        case 'openrouter':
          apiKey = settings.openrouterApiKey || (await window.electronAPI.settings.get('openrouterApiKey') as string) || ''
          if (!apiKey) { addChatMessage('assistant', t('chat.openrouterKeyRequired')); return }
          break
        case 'google':
          apiKey = settings.googleAiKey || (await window.electronAPI.settings.get('googleAiKey') as string) || ''
          if (!apiKey) { addChatMessage('assistant', t('chat.geminiKeyRequired')); return }
          break
        case 'openai':
          apiKey = settings.openaiApiKey || (await window.electronAPI.settings.get('openaiApiKey') as string) || ''
          if (!apiKey) { addChatMessage('assistant', t('chat.openaiKeyRequired')); return }
          break
        case 'anthropic':
          apiKey = settings.anthropicApiKey || (await window.electronAPI.settings.get('anthropicApiKey') as string) || ''
          if (!apiKey) { addChatMessage('assistant', t('chat.anthropicKeyRequired')); return }
          break
      }

      // Build history
      const history = chatMessages
        .slice(-20)
        .filter((m) => !m.streaming)
        .map((m) => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: userMessage })

      addChatMessage('user', userMessage)
      const assistantId = addChatMessage('assistant', '')
      setStreamingMessageId(assistantId)

      try {
        // Stream via main process IPC (no CORS issues)
        // Build connection context for RAG and tools
        const connectionContexts = connections.map((c) => ({
          connectionId: c.id,
          connectionType: c.type,
          label: c.customLabel || c.label,
          status: c.status,
          config: c.config as Record<string, unknown>
        }))

        const result = await window.electronAPI.llm.stream({
          provider,
          model: apiModelId,
          apiKey,
          messages: history,
          systemPrompt: buildSystemPrompt(connections, activeConnectionId, locale),
          maxTokens: settings.maxTokens,
          temperature: settings.temperature,
          baseUrl,
          connections: connectionContexts,
          activeConnectionId
        })

        if (!result.success || !result.requestId) {
          appendChatContent(assistantId, `\n\n❌ Error: ${result.error || 'Failed to start streaming'}`)
          finishChatMessage(assistantId)
          setStreamingMessageId(null)
          return
        }

        activeRequestRef.current = result.requestId
        const requestId = result.requestId

        // Listen for streaming events
        const unsubChunk = window.electronAPI.llm.onChunk((rid, text) => {
          if (rid === requestId) {
            appendChatContent(assistantId, text)
          }
        })

        const unsubDone = window.electronAPI.llm.onDone((rid) => {
          if (rid === requestId) {
            cleanup()
            finishChatMessage(assistantId)
            setStreamingMessageId(null)
            activeRequestRef.current = null
          }
        })

        const unsubError = window.electronAPI.llm.onError((rid, error) => {
          if (rid === requestId) {
            cleanup()
            const isConnectionErr = error.includes('Failed to fetch') || error.includes('NetworkError') || error.includes('ECONNREFUSED')
            if (provider === 'ollama' && isConnectionErr) {
              appendChatContent(assistantId, `\n\n${t('chat.ollamaNotRunning')}`)
            } else {
              appendChatContent(assistantId, `\n\n❌ Error: ${error}`)
            }
            finishChatMessage(assistantId)
            setStreamingMessageId(null)
            activeRequestRef.current = null
          }
        })

        function cleanup() {
          unsubChunk()
          unsubDone()
          unsubError()
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        appendChatContent(assistantId, `\n\n❌ Error: ${errMsg}`)
        finishChatMessage(assistantId)
        setStreamingMessageId(null)
      }
    },
    [chatMessages, settings, streamingMessageId, addChatMessage, appendChatContent, finishChatMessage, setStreamingMessageId, t]
  )

  const modelInfo = getModelInfo(settings.model)
  const provider = modelInfo?.provider || 'anthropic'
  const badgeColor = PROVIDER_BADGE[provider]

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">{t('chat.title')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearChat}
            title={t('chat.clearChat')}
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
              <p className="text-sm font-medium">{t('chat.title')}</p>
              <p className="text-xs mt-1 opacity-70">{t('chat.askProtocol')}</p>
              <p className="text-xs opacity-70">{t('chat.pasteData')}</p>
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

      {/* Model Selector */}
      <div className="border-t border-border px-3 py-1.5 bg-card/30 flex items-center gap-2">
        <Select value={settings.model} onValueChange={handleModelChange}>
          <SelectTrigger className="h-7 text-[11px] flex-1">
            <SelectValue>
              {modelInfo && (
                <span className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1 py-0 rounded font-bold ${badgeColor}`}>
                    {PROVIDER_SHORT[provider]}
                  </span>
                  <span>{modelInfo.name}</span>
                  {modelInfo.free && <Zap className="h-3 w-3 text-yellow-400" />}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Free models — only show sections where the provider is usable */}
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-400" /> {t('chat.freeModels')}
              </SelectLabel>
              {/* Ollama: always visible — works without an API key */}
              <>
                <SelectLabel className="text-[10px] text-orange-400/70 pl-4">Ollama (Local)</SelectLabel>
                {OLLAMA_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-[11px] pl-6">
                    <span className="font-medium">{m.name}</span>
                    <span className="ml-1.5 text-muted-foreground text-[10px]">{t(m.descKey)}</span>
                  </SelectItem>
                ))}
              </>
              {/* Groq: only show if API key is configured */}
              {settings.groqApiKey && (
                <>
                  <SelectLabel className="text-[10px] text-purple-400/70 pl-4">Groq</SelectLabel>
                  {GROQ_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-[11px] pl-6">
                      <span className="font-medium">{m.name}</span>
                      <span className="ml-1.5 text-muted-foreground text-[10px]">{t(m.descKey)}</span>
                    </SelectItem>
                  ))}
                </>
              )}
              {/* OpenRouter: only show if API key is configured */}
              {settings.openrouterApiKey && (
                <>
                  <SelectLabel className="text-[10px] text-cyan-400/70 pl-4">OpenRouter</SelectLabel>
                  {OPENROUTER_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-[11px] pl-6">
                      <span className="font-medium">{m.name}</span>
                      <span className="ml-1.5 text-muted-foreground text-[10px]">{t(m.descKey)}</span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectGroup>

            {/* Paid models — only render the group if at least one key is configured */}
            {(settings.anthropicApiKey || settings.googleAiKey || settings.openaiApiKey) && (
              <SelectGroup>
                <SelectLabel className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {t('chat.premiumModels')}
                </SelectLabel>
                {settings.anthropicApiKey && (
                  <>
                    <SelectLabel className="text-[10px] text-primary/70 pl-4">Anthropic</SelectLabel>
                    {ANTHROPIC_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-[11px] pl-6">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-1.5 text-muted-foreground text-[10px]">{t(m.descKey)}</span>
                      </SelectItem>
                    ))}
                  </>
                )}
                {settings.googleAiKey && (
                  <>
                    <SelectLabel className="text-[10px] text-blue-400/70 pl-4">Google</SelectLabel>
                    {GOOGLE_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-[11px] pl-6">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-1.5 text-muted-foreground text-[10px]">{t(m.descKey)}</span>
                      </SelectItem>
                    ))}
                  </>
                )}
                {settings.openaiApiKey && (
                  <>
                    <SelectLabel className="text-[10px] text-emerald-400/70 pl-4">OpenAI</SelectLabel>
                    {OPENAI_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-[11px] pl-6">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-1.5 text-muted-foreground text-[10px]">{t(m.descKey)}</span>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      <ChatInput onSend={handleSend} disabled={!!streamingMessageId} />
    </div>
  )
}
