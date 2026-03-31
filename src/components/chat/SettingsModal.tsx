import { useState, useEffect } from 'react'
import { Settings, LogOut, User, Check, ChevronDown, ChevronUp, Key, ExternalLink, Bot, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { useConnectionStore } from '@/store/connectionStore'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/lib/i18n'
import { PROVIDER_URLS, GOOGLE_MODELS } from '@/lib/models'

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    ollama: 'bg-orange-500/20 text-orange-400',
    groq: 'bg-purple-500/20 text-purple-400',
    openrouter: 'bg-cyan-500/20 text-cyan-400',
    anthropic: 'bg-primary/20 text-primary',
    google: 'bg-blue-500/20 text-blue-400',
    openai: 'bg-teal-500/20 text-teal-400'
  }
  const labels: Record<string, string> = {
    ollama: 'OL',
    groq: 'GQ',
    openrouter: 'OR',
    anthropic: 'A',
    google: 'G',
    openai: 'O'
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${colors[provider] || ''}`}>
      {labels[provider] || '?'}
    </span>
  )
}

export function SettingsModal() {
  const { settings, updateSettings } = useConnectionStore()
  const { user, setUser } = useAuthStore()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [googleAiKey, setGoogleAiKey] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [groqApiKey, setGroqApiKey] = useState('')
  const [openrouterApiKey, setOpenrouterApiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaUrl || 'http://localhost:11434')
  const [temperature, setTemperature] = useState(String(settings.temperature))
  const [maxTokens, setMaxTokens] = useState(String(settings.maxTokens))
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)

  const hasAnthropicKey = apiKey.trim().length > 0
  const hasGoogleAiKey = googleAiKey.trim().length > 0
  const hasOpenaiKey = openaiApiKey.trim().length > 0
  const hasGroqKey = groqApiKey.trim().length > 0
  const hasOpenrouterKey = openrouterApiKey.trim().length > 0

  useEffect(() => {
    if (!open) return
    Promise.all([
      window.electronAPI.settings.get('anthropicApiKey'),
      window.electronAPI.settings.get('googleAiKey'),
      window.electronAPI.settings.get('openaiApiKey'),
      window.electronAPI.settings.get('groqApiKey'),
      window.electronAPI.settings.get('openrouterApiKey'),
      window.electronAPI.settings.get('ollamaUrl')
    ]).then(([key, gKey, oKey, grKey, orKey, olUrl]) => {
      if (key) setApiKey(key as string)
      if (gKey) setGoogleAiKey(gKey as string)
      if (oKey) setOpenaiApiKey(oKey as string)
      if (grKey) setGroqApiKey(grKey as string)
      if (orKey) setOpenrouterApiKey(orKey as string)
      if (olUrl) setOllamaUrl(olUrl as string)
    })
    setTemperature(String(settings.temperature))
    setMaxTokens(String(settings.maxTokens))
    setExpandedProvider(null)
  }, [open, settings])

  const handleSave = async () => {
    // Save to Supabase (primary) — also caches to electron-store locally
    await window.electronAPI.sync.save({
      api_keys: {
        anthropicApiKey: apiKey,
        openaiApiKey,
        googleAiKey,
        groqApiKey,
        openrouterApiKey
      },
      preferences: {
        ollamaUrl,
        temperature: Number(temperature),
        maxTokens: Number(maxTokens)
      }
    })

    // Update in-memory store
    updateSettings({
      anthropicApiKey: apiKey,
      openaiApiKey: openaiApiKey,
      googleAiKey: googleAiKey,
      groqApiKey: groqApiKey,
      openrouterApiKey: openrouterApiKey,
      ollamaUrl: ollamaUrl,
      temperature: Number(temperature),
      maxTokens: Number(maxTokens)
    })

    setOpen(false)
  }

  const handleGoogleLogout = async () => {
    await window.electronAPI.auth.logout()
    setUser(null)
  }

  const openProviderConsole = (provider: string) => {
    const url = PROVIDER_URLS[provider]
    if (url) window.open(url, '_blank')
  }

  const toggleProvider = (provider: string) => {
    setExpandedProvider(expandedProvider === provider ? null : provider)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">

          {/* ── Account ── */}
          <section className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {t('settings.account')}
            </p>

            <div className="rounded-lg border border-border bg-card/60 p-3">
              {user ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border/50">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 shrink-0" onClick={handleGoogleLogout}>
                    <LogOut className="h-3 w-3" />
                    {t('settings.logout')}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">{t('settings.notConfigured')}</p>
              )}
            </div>
          </section>

          {/* ── Built-in Agent ── */}
          <section className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {t('settings.builtInAgent')}
            </p>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-primary/20 text-primary">HW</span>
                  <span className="text-xs font-medium">HW Monitor AI</span>
                  <span className="text-[9px] px-1 py-0 rounded bg-sky-500/15 text-sky-400 font-medium">{t('settings.builtInLabel')}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-primary">
                  <Bot className="h-3 w-3" />
                  {t('settings.builtInActive')}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{t('settings.builtInDesc')}</p>

              {/* Built-in model list (read-only) */}
              <div className="space-y-1">
                {GOOGLE_MODELS.filter((m) => m.builtIn).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/40 border border-border/50">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400">G</span>
                    <span className="text-xs font-medium">{m.name}</span>
                    <span className="ml-auto text-[9px] text-muted-foreground">{t(m.descKey)}</span>
                  </div>
                ))}
              </div>

              {/* Optional: enter personal Google AI key for unlimited use */}
              <Button
                variant={expandedProvider === 'google' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 gap-1 text-[10px] w-full"
                onClick={() => toggleProvider('google')}
              >
                <Key className="h-3 w-3" />
                {t('settings.builtInAdvanced')}
                {expandedProvider === 'google' ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </Button>

              {expandedProvider === 'google' && (
                <div className="space-y-1.5 border-t border-border/50 pt-2">
                  <Label className="text-xs">{t('settings.personalGoogleKey')}</Label>
                  <Input
                    type="password"
                    className="font-mono text-xs h-8"
                    placeholder={t('settings.googleAiKeyPlaceholder')}
                    value={googleAiKey}
                    onChange={(e) => setGoogleAiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">{t('settings.personalKeyDesc')}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Free Providers ── */}
          <section className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {t('settings.freeProviders')}
            </p>

            {/* Groq card */}
            <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ProviderBadge provider="groq" />
                  <span className="text-xs font-medium">Groq</span>
                  <span className="text-[9px] px-1 py-0 rounded bg-yellow-500/15 text-yellow-400 font-medium">{t('settings.free')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasGroqKey ? (
                    <span className="flex items-center gap-1 text-[10px] text-purple-400">
                      <Check className="h-3 w-3" />
                      {t('settings.configured')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t('settings.notConfigured')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] flex-1"
                  onClick={() => openProviderConsole('groq')}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('settings.getFreeKey')}
                </Button>
                <Button
                  variant={expandedProvider === 'groq' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => toggleProvider('groq')}
                >
                  <Key className="h-3 w-3" />
                  {expandedProvider === 'groq' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {expandedProvider === 'groq' && (
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    className="font-mono text-xs h-8"
                    placeholder="gsk_..."
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">{t('settings.groqDesc')}</p>
                </div>
              )}
            </div>

            {/* OpenRouter card */}
            <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ProviderBadge provider="openrouter" />
                  <span className="text-xs font-medium">OpenRouter</span>
                  <span className="text-[9px] px-1 py-0 rounded bg-yellow-500/15 text-yellow-400 font-medium">{t('settings.free')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasOpenrouterKey ? (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                      <Check className="h-3 w-3" />
                      {t('settings.configured')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t('settings.notConfigured')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] flex-1"
                  onClick={() => openProviderConsole('openrouter')}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('settings.getFreeKey')}
                </Button>
                <Button
                  variant={expandedProvider === 'openrouter' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => toggleProvider('openrouter')}
                >
                  <Key className="h-3 w-3" />
                  {expandedProvider === 'openrouter' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {expandedProvider === 'openrouter' && (
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    className="font-mono text-xs h-8"
                    placeholder="sk-or-..."
                    value={openrouterApiKey}
                    onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">{t('settings.openrouterDesc')}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Premium Provider Keys ── */}
          <section className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {t('settings.premiumProviders')}
            </p>

            {/* Anthropic card */}
            <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ProviderBadge provider="anthropic" />
                  <span className="text-xs font-medium">Anthropic</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasAnthropicKey ? (
                    <span className="flex items-center gap-1 text-[10px] text-primary">
                      <Check className="h-3 w-3" />
                      {t('settings.configured')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t('settings.notConfigured')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] flex-1"
                  onClick={() => openProviderConsole('anthropic')}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('settings.getApiKey')}
                </Button>
                <Button
                  variant={expandedProvider === 'anthropic' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => toggleProvider('anthropic')}
                >
                  <Key className="h-3 w-3" />
                  {expandedProvider === 'anthropic' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {expandedProvider === 'anthropic' && (
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    className="font-mono text-xs h-8"
                    placeholder="sk-ant-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">{t('settings.encryptedStorage')}</p>
                </div>
              )}
            </div>

            {/* Google card */}
            <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ProviderBadge provider="google" />
                  <span className="text-xs font-medium">Google</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasGoogleAiKey ? (
                    <span className="flex items-center gap-1 text-[10px] text-blue-400">
                      <Check className="h-3 w-3" />
                      {t('settings.configured')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t('settings.notConfigured')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] flex-1"
                  onClick={() => openProviderConsole('google')}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('settings.getApiKey')}
                </Button>
                <Button
                  variant={expandedProvider === 'google-premium' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => toggleProvider('google-premium')}
                >
                  <Key className="h-3 w-3" />
                  {expandedProvider === 'google-premium' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {expandedProvider === 'google-premium' && (
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    className="font-mono text-xs h-8"
                    placeholder={t('settings.googleAiKeyPlaceholder')}
                    value={googleAiKey}
                    onChange={(e) => setGoogleAiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">{t('settings.encryptedStorage')}</p>
                </div>
              )}
            </div>

            {/* OpenAI card */}
            <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ProviderBadge provider="openai" />
                  <span className="text-xs font-medium">OpenAI</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasOpenaiKey ? (
                    <span className="flex items-center gap-1 text-[10px] text-teal-400">
                      <Check className="h-3 w-3" />
                      {t('settings.configured')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t('settings.notConfigured')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] flex-1"
                  onClick={() => openProviderConsole('openai')}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('settings.getApiKey')}
                </Button>
                <Button
                  variant={expandedProvider === 'openai' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => toggleProvider('openai')}
                >
                  <Key className="h-3 w-3" />
                  {expandedProvider === 'openai' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {expandedProvider === 'openai' && (
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    className="font-mono text-xs h-8"
                    placeholder={t('settings.openaiKeyPlaceholder')}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">{t('settings.encryptedStorage')}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Parameters ── */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{t('settings.parameters')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Temperature</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">0.0 – 1.0</p>
              </div>
              <div>
                <Label className="text-xs">Max Tokens</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  type="number"
                  min="256"
                  max="8192"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">256 – 8192</p>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{t('settings.cancel')}</Button>
          <Button size="sm" onClick={handleSave}>{t('settings.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
