import { useState } from 'react'
import { Github, Loader2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation, type Locale } from '@/lib/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface LoginPageProps {
  onLogin: (user: { id: string; email: string; name: string; picture: string }) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSigningIn, setIsSigningIn] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState('')
  const { t, locale, setLocale } = useTranslation()

  const handleLogin = async (provider: 'github' | 'google') => {
    setIsSigningIn(provider)
    setError('')
    try {
      const result = await window.electronAPI.auth.login(provider)
      if (result.success && result.user) {
        onLogin(result.user)
      } else {
        setError(result.error ?? t('login.failed'))
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setIsSigningIn(null)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Language selector */}
      <div className="absolute top-4 right-4">
        <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
          <SelectTrigger className="h-7 w-[100px] text-[11px] border-border/50 bg-card/60 backdrop-blur-sm">
            <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ko" className="text-xs">한국어</SelectItem>
            <SelectItem value="en" className="text-xs">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            HW MONITOR
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11 gap-2.5 text-sm font-medium bg-card/80 border-border hover:bg-accent/60 hover:border-border/80 transition-all"
            onClick={() => handleLogin('google')}
            disabled={isSigningIn !== null}
          >
            {isSigningIn === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {t('login.google')}
          </Button>

          <Button
            variant="outline"
            className="w-full h-11 gap-2.5 text-sm font-medium bg-card/80 border-border hover:bg-accent/60 hover:border-border/80 transition-all"
            onClick={() => handleLogin('github')}
            disabled={isSigningIn !== null}
          >
            {isSigningIn === 'github' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            {t('login.github')}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-[10px] text-muted-foreground/60 text-center mt-8 leading-relaxed">
          {t('login.footer')}
        </p>
      </div>
    </div>
  )
}
