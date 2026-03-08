import { useEffect, useState } from 'react'
import { Download, X, RefreshCw, CheckCircle2 } from 'lucide-react'

type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

interface UpdateInfo {
  version: string
  percent?: number
}

export function UpdateNotification() {
  const [state, setState] = useState<UpdateState>('idle')
  const [info, setInfo] = useState<UpdateInfo>({ version: '' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const api = window.electronAPI.updater

    const unsubs = [
      api.onChecking(() => setState('checking')),
      api.onAvailable((data) => {
        setState('available')
        setInfo({ version: data.version })
        setDismissed(false)
      }),
      api.onNotAvailable(() => setState('idle')),
      api.onProgress((data) => {
        setState('downloading')
        setInfo((prev) => ({ ...prev, percent: data.percent }))
      }),
      api.onDownloaded((data) => {
        setState('downloaded')
        setInfo({ version: data.version })
      }),
      api.onError(() => setState('error'))
    ]

    // Check for updates on startup (after 5 seconds)
    const timer = setTimeout(() => {
      api.check()
    }, 5000)

    return () => {
      clearTimeout(timer)
      unsubs.forEach((unsub) => unsub())
    }
  }, [])

  if (state === 'idle' || state === 'checking' || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3 p-3">
        {state === 'available' && (
          <>
            <Download className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                v{info.version} available
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A new version is ready to download.
              </p>
              <button
                onClick={() => window.electronAPI.updater.download()}
                className="mt-2 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Download
              </button>
            </div>
          </>
        )}

        {state === 'downloading' && (
          <>
            <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Downloading...</p>
              <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${info.percent ?? 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {Math.round(info.percent ?? 0)}%
              </p>
            </div>
          </>
        )}

        {state === 'downloaded' && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                v{info.version} ready
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restart to apply the update.
              </p>
              <button
                onClick={() => window.electronAPI.updater.install()}
                className="mt-2 px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
              >
                Restart Now
              </button>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Update failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Check your connection and try again.
              </p>
              <button
                onClick={() => window.electronAPI.updater.check()}
                className="mt-2 px-3 py-1 text-xs font-medium bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
              >
                Retry
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
