import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { MonitorPanel } from '@/components/monitor/MonitorPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { useEffect } from 'react'
import { useConnectionStore } from '@/store/connectionStore'
import { useAuthStore } from '@/store/authStore'
import { User } from 'lucide-react'

export default function App() {
  const { updateSettings } = useConnectionStore()
  const { user, setUser, setLoading } = useAuthStore()

  // Load settings and auth on startup
  useEffect(() => {
    const init = async () => {
      // Load LLM settings
      const [apiKey, model, temperature, maxTokens] = await Promise.all([
        window.electronAPI.settings.get('anthropicApiKey'),
        window.electronAPI.settings.get('model'),
        window.electronAPI.settings.get('temperature'),
        window.electronAPI.settings.get('maxTokens')
      ])
      updateSettings({
        anthropicApiKey: (apiKey as string) || '',
        model: (model as string) || 'claude-3-5-sonnet-20241022',
        temperature: (temperature as number) ?? 0.7,
        maxTokens: (maxTokens as number) ?? 4096
      })

      // Load stored Google user
      try {
        const storedUser = await window.electronAPI.auth.getUser()
        if (storedUser) setUser(storedUser)
      } catch {
        // No stored user
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [updateSettings, setUser, setLoading])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 h-9 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold tracking-wider text-foreground">HW MONITOR</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground hidden sm:block">
            Hardware Communication + Protocol Assistant
          </span>

          {/* Google user badge */}
          {user && (
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
            </div>
          )}
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
    </div>
  )
}
