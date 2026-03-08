import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { MonitorPanel } from '@/components/monitor/MonitorPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { LoginPage } from '@/components/auth/LoginPage'
import { UpdateNotification } from '@/components/UpdateNotification'
import { useEffect } from 'react'
import { useConnectionStore, loadSavedConnections } from '@/store/connectionStore'
import { useAuthStore } from '@/store/authStore'
import { useTranslation, type Locale } from '@/lib/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { User, Globe, Loader2, LogOut } from 'lucide-react'

export default function App() {
  const { updateSettings, restoreConnections, clearChat } = useConnectionStore()
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  const { t, locale, setLocale } = useTranslation()

  // Load settings and auth on startup
  useEffect(() => {
    const init = async () => {
      // Load saved locale first (needed for LoginPage)
      const savedLocale = await window.electronAPI.settings.get('locale')
      if (savedLocale && (savedLocale === 'ko' || savedLocale === 'en')) {
        setLocale(savedLocale as Locale)
      }

      // Load stored user and refresh token
      try {
        const storedUser = await window.electronAPI.auth.getUser()
        if (storedUser) {
          // Try to refresh the access token silently
          const refreshResult = await window.electronAPI.auth.refreshToken()
          if (refreshResult.success && refreshResult.user) {
            setUser(refreshResult.user)
          } else {
            // Refresh failed — still use stored user for offline/auto-login
            setUser(storedUser)
          }
          await loadAppData()
        }
      } catch {
        // No stored user
      } finally {
        setLoading(false)
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAppData = async () => {
    // Sync from Supabase first (writes to electron-store for local cache)
    try {
      await window.electronAPI.sync.load()
    } catch {
      // Offline or sync failed — fall back to local cache
    }

    // Load from electron-store (now populated by sync or existing local data)
    const [apiKey, openaiKey, googleAiKey, groqKey, openrouterKey, ollamaUrl, model, temperature, maxTokens] =
      await Promise.all([
        window.electronAPI.settings.get('anthropicApiKey'),
        window.electronAPI.settings.get('openaiApiKey'),
        window.electronAPI.settings.get('googleAiKey'),
        window.electronAPI.settings.get('groqApiKey'),
        window.electronAPI.settings.get('openrouterApiKey'),
        window.electronAPI.settings.get('ollamaUrl'),
        window.electronAPI.settings.get('model'),
        window.electronAPI.settings.get('temperature'),
        window.electronAPI.settings.get('maxTokens')
      ])
    updateSettings({
      anthropicApiKey: (apiKey as string) || '',
      openaiApiKey: (openaiKey as string) || '',
      googleAiKey: (googleAiKey as string) || '',
      groqApiKey: (groqKey as string) || '',
      openrouterApiKey: (openrouterKey as string) || '',
      ollamaUrl: (ollamaUrl as string) || 'http://localhost:11434',
      model: (model as string) || 'groq/llama-3.3-70b-versatile',
      temperature: (temperature as number) ?? 0.7,
      maxTokens: (maxTokens as number) ?? 4096
    })

    // Load saved locale
    const savedLocale = await window.electronAPI.settings.get('locale')
    if (savedLocale && (savedLocale === 'ko' || savedLocale === 'en')) {
      setLocale(savedLocale as Locale)
    }

    // Load saved connections
    const saved = await loadSavedConnections()
    if (saved.length > 0) {
      restoreConnections(saved)
    }
  }

  const handleLogin = async (loginUser: { id: string; email: string; name: string; picture: string }) => {
    setUser(loginUser)
    await loadAppData()
  }

  const handleLogout = async () => {
    await window.electronAPI.auth.logout()
    // Reset frontend stores so next user starts clean
    restoreConnections([])
    clearChat()
    updateSettings({
      anthropicApiKey: '',
      openaiApiKey: '',
      googleAiKey: '',
      groqApiKey: '',
      openrouterApiKey: '',
      ollamaUrl: 'http://localhost:11434',
      model: 'groq/llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 4096
    })
    setUser(null)
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // Not authenticated → show login page
  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Authenticated → show main app
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 h-9 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold tracking-wider text-foreground">{t('app.title')}</span>
        </div>

        <div className="flex items-center gap-3">
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger className="h-6 w-[90px] text-[10px] border-border/50 bg-transparent hover:bg-accent/40 gap-1">
              <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko" className="text-xs">한국어</SelectItem>
              <SelectItem value="en" className="text-xs">English</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-[10px] text-muted-foreground hidden sm:block">
            {t('app.subtitle')}
          </span>

          {/* User badge + logout */}
          <div className="flex items-center gap-1.5">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-5 h-5 rounded-full ring-1 ring-border"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-[10px] text-muted-foreground max-w-[100px] truncate">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="ml-1 p-1 rounded hover:bg-accent/60 transition-colors text-muted-foreground hover:text-foreground"
              title={t('settings.logout')}
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content: resizable panels */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <Panel defaultSize={60} minSize={35} className="overflow-hidden">
          <MonitorPanel />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />

        <Panel defaultSize={40} minSize={25} className="overflow-hidden">
          <ChatPanel />
        </Panel>
      </PanelGroup>

      <UpdateNotification />
    </div>
  )
}
