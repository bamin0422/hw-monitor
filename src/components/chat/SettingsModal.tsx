import { useState, useEffect } from 'react'
import { Settings, LogOut, LogIn, Loader2, User } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useConnectionStore } from '@/store/connectionStore'
import { useAuthStore } from '@/store/authStore'

interface ModelInfo {
  id: string
  name: string
  provider: 'anthropic' | 'google'
  description: string
}

const ANTHROPIC_MODELS: ModelInfo[] = [
  { id: 'claude-sonnet-4-20250514',   name: 'Claude Sonnet 4',    provider: 'anthropic', description: '최신 고성능 · 200K 컨텍스트' },
  { id: 'claude-opus-4-20250514',     name: 'Claude Opus 4',      provider: 'anthropic', description: '최고 성능 · 복잡한 추론' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet',  provider: 'anthropic', description: '빠르고 균형 잡힌 성능' },
  { id: 'claude-3-5-haiku-20241022',  name: 'Claude 3.5 Haiku',   provider: 'anthropic', description: '초고속 · 경량 작업' }
]

const GOOGLE_MODELS: ModelInfo[] = [
  { id: 'gemini-2.0-flash-exp',       name: 'Gemini 2.0 Flash',   provider: 'google',    description: '빠르고 효율적 · 멀티모달' },
  { id: 'gemini-1.5-pro',             name: 'Gemini 1.5 Pro',     provider: 'google',    description: '긴 컨텍스트 · 고성능' }
]

export function SettingsModal() {
  const { settings, updateSettings } = useConnectionStore()
  const { user, setUser } = useAuthStore()

  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [googleAiKey, setGoogleAiKey] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [model, setModel] = useState(settings.model)
  const [temperature, setTemperature] = useState(String(settings.temperature))
  const [maxTokens, setMaxTokens] = useState(String(settings.maxTokens))
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')

  const hasGoogleAiKey = googleAiKey.trim().length > 0
  const allModels = hasGoogleAiKey ? [...ANTHROPIC_MODELS, ...GOOGLE_MODELS] : ANTHROPIC_MODELS
  const selectedModelInfo = allModels.find((m) => m.id === model)

  useEffect(() => {
    if (!open) return
    Promise.all([
      window.electronAPI.settings.get('anthropicApiKey'),
      window.electronAPI.settings.get('googleAiKey'),
      window.electronAPI.settings.get('googleClientId'),
      window.electronAPI.settings.get('googleClientSecret')
    ]).then(([key, gKey, gId, gSec]) => {
      if (key) setApiKey(key as string)
      if (gKey) setGoogleAiKey(gKey as string)
      if (gId) setGoogleClientId(gId as string)
      if (gSec) setGoogleClientSecret(gSec as string)
    })
    setModel(settings.model)
    setTemperature(String(settings.temperature))
    setMaxTokens(String(settings.maxTokens))
    setAuthError('')
  }, [open, settings])

  const handleSave = async () => {
    await Promise.all([
      apiKey && window.electronAPI.settings.set('anthropicApiKey', apiKey),
      window.electronAPI.settings.set('googleAiKey', googleAiKey),
      googleClientId && window.electronAPI.settings.set('googleClientId', googleClientId),
      googleClientSecret && window.electronAPI.settings.set('googleClientSecret', googleClientSecret),
      window.electronAPI.settings.set('model', model),
      window.electronAPI.settings.set('temperature', Number(temperature)),
      window.electronAPI.settings.set('maxTokens', Number(maxTokens))
    ])
    updateSettings({
      anthropicApiKey: apiKey,
      model,
      temperature: Number(temperature),
      maxTokens: Number(maxTokens)
    })
    setOpen(false)
  }

  const handleGoogleLogin = async () => {
    if (!googleClientId || !googleClientSecret) {
      setAuthError('Client ID와 Secret을 입력해주세요.')
      return
    }
    setIsSigningIn(true)
    setAuthError('')
    try {
      const result = await window.electronAPI.auth.googleLogin(googleClientId, googleClientSecret)
      if (result.success && result.user) {
        setUser(result.user as GoogleUserInfo)
      } else {
        setAuthError(result.error ?? '로그인 실패')
      }
    } catch (err) {
      setAuthError(String(err))
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleGoogleLogout = async () => {
    await window.electronAPI.auth.logout()
    setUser(null)
    if (GOOGLE_MODELS.some((m) => m.id === model)) {
      setModel(ANTHROPIC_MODELS[0].id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-1">

          {/* ── Anthropic ── */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Anthropic</p>
            <div>
              <Label className="text-xs">API Key</Label>
              <Input
                type="password"
                className="mt-1 font-mono text-xs h-8"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">OS 키체인에 암호화 저장</p>
            </div>
          </section>

          {/* ── Google ── */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Google</p>

            {/* Sign-In */}
            {user ? (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/40 border border-border">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 shrink-0" onClick={handleGoogleLogout}>
                  <LogOut className="h-3 w-3" />
                  로그아웃
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">OAuth Client ID</Label>
                  <Input
                    type="password"
                    className="mt-1 font-mono text-xs h-8"
                    placeholder="123456.apps.googleusercontent.com"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">OAuth Client Secret</Label>
                  <Input
                    type="password"
                    className="mt-1 font-mono text-xs h-8"
                    placeholder="GOCSPX-..."
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                  />
                </div>
                {authError && <p className="text-xs text-destructive">{authError}</p>}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 gap-2 text-xs"
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                >
                  {isSigningIn
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />브라우저에서 인증 중...</>
                    : <><LogIn className="h-3.5 w-3.5" />Google로 로그인</>}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Google Cloud Console → OAuth 2.0 → 데스크톱 앱 유형
                </p>
              </div>
            )}

            {/* Google AI API Key for Gemini */}
            <div className="pt-1">
              <Label className="text-xs">Google AI API Key <span className="text-muted-foreground font-normal">(Gemini 사용 시)</span></Label>
              <Input
                type="password"
                className="mt-1 font-mono text-xs h-8"
                placeholder="AI Studio에서 발급 — aistudio.google.com"
                value={googleAiKey}
                onChange={(e) => setGoogleAiKey(e.target.value)}
              />
            </div>
          </section>

          {/* ── Model ── */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">LLM 모델</p>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue>
                  {selectedModelInfo && (
                    <span className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1 py-0.5 rounded font-semibold ${
                        selectedModelInfo.provider === 'google'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {selectedModelInfo.provider === 'google' ? 'G' : 'A'}
                      </span>
                      {selectedModelInfo.name}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-[11px] text-muted-foreground">Anthropic Claude</SelectLabel>
                  {ANTHROPIC_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <span className="font-medium">{m.name}</span>
                      <span className="ml-2 text-muted-foreground text-[11px]">{m.description}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                {hasGoogleAiKey && (
                  <SelectGroup>
                    <SelectLabel className="text-[11px] text-muted-foreground">Google Gemini</SelectLabel>
                    {GOOGLE_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-2 text-muted-foreground text-[11px]">{m.description}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {selectedModelInfo && (
              <p className="text-[11px] text-muted-foreground">{selectedModelInfo.description}</p>
            )}
          </section>

          {/* ── Parameters ── */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">파라미터</p>
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
                <p className="text-[11px] text-muted-foreground mt-0.5">0.0 – 1.0</p>
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
                <p className="text-[11px] text-muted-foreground mt-0.5">256 – 8192</p>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>취소</Button>
          <Button size="sm" onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
