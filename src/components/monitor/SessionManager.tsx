import { useState, useEffect, useCallback } from 'react'
import { Save, FolderOpen, Trash2, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConnectionStore } from '@/store/connectionStore'
import { useTranslation } from '@/lib/i18n'
import type { Connection, DataEncoding } from '@/types'

interface SessionInfo {
  id: string
  session_name: string
  connections: {
    id: string
    type: string
    label: string
    customLabel?: string
    config: Record<string, unknown>
    encoding: string
  }[]
  created_at: string
  updated_at: string
}

function toHex(raw: Uint8Array): string {
  return Array.from(raw)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

function toAscii(raw: Uint8Array): string {
  return Array.from(raw)
    .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'))
    .join('')
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = hex
    .split(' ')
    .filter((h) => h.length > 0)
    .map((h) => parseInt(h, 16))
  return new Uint8Array(bytes)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SessionManager() {
  const { connections, restoreConnections } = useConnectionStore()
  const { t } = useTranslation()

  const [saveOpen, setSaveOpen] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load sessions list when dialog opens
  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.session.list()
      if (result.success && result.sessions) {
        setSessions(result.sessions as SessionInfo[])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loadOpen) fetchSessions()
  }, [loadOpen, fetchSessions])

  // Save current session
  const handleSave = async () => {
    if (!sessionName.trim() || connections.length === 0) return
    setSaving(true)

    try {
      // Build connection configs (without runtime state)
      const connConfigs = connections.map((c) => ({
        id: c.id,
        type: c.type,
        label: c.label,
        customLabel: c.customLabel,
        config: c.config as Record<string, unknown>,
        encoding: c.encoding
      }))

      // Build recent logs (last 100 per connection)
      const recentLogs: Record<
        string,
        { timestamp: number; direction: string; hex: string; ascii: string }[]
      > = {}

      for (const conn of connections) {
        const recent = conn.data.slice(-100)
        if (recent.length > 0) {
          recentLogs[conn.id] = recent.map((d) => ({
            timestamp: d.timestamp,
            direction: d.direction,
            hex: toHex(d.raw),
            ascii: toAscii(d.raw)
          }))
        }
      }

      const result = await window.electronAPI.session.save({
        sessionName: sessionName.trim(),
        connections: connConfigs,
        recentLogs
      })

      if (!result.success) {
        console.error('Session save failed:', result.error)
        alert(result.error || 'Failed to save session')
        return
      }

      setSaveOpen(false)
      setSessionName('')
    } catch (err) {
      console.error('Session save error:', err)
      alert('Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  // Load a saved session
  const handleLoad = async (sessionId: string) => {
    setLoading(true)
    try {
      const result = await window.electronAPI.session.load(sessionId)
      if (!result.success || !result.session) return

      const session = result.session

      // Restore connections with disconnected status
      const restored: Connection[] = (
        session.connections as SessionInfo['connections']
      ).map((sc) => {
        const logs = session.recent_logs?.[sc.id] || []

        return {
          id: sc.id,
          type: sc.type as Connection['type'],
          label: sc.label,
          customLabel: sc.customLabel,
          status: 'disconnected' as const,
          config: sc.config as Connection['config'],
          data: logs.map((log: { timestamp: number; direction: string; hex: string; ascii: string }) => ({
            id: Math.random().toString(36).slice(2),
            timestamp: log.timestamp,
            direction: log.direction as 'rx' | 'tx' | 'system',
            raw: hexToUint8Array(log.hex)
          })),
          encoding: (sc.encoding || 'both') as DataEncoding,
          autoScroll: true,
          periodicSend: {
            active: false,
            data: '',
            encoding: 'ascii' as DataEncoding,
            intervalMs: 1000,
            count: 0
          },
          connectedClients: []
        }
      })

      restoreConnections(restored)
      setLoadOpen(false)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Delete a session
  const handleDelete = async (sessionId: string) => {
    try {
      await window.electronAPI.session.delete(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setDeleteConfirm(null)
    } catch {
      // ignore
    }
  }

  return (
    <TooltipProvider>
      {/* Save button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setSessionName(
                `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              )
              setSaveOpen(true)
            }}
            disabled={connections.length === 0}
          >
            <Save className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('session.save') || 'Save Session'}</TooltipContent>
      </Tooltip>

      {/* Load button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setLoadOpen(true)}
          >
            <FolderOpen className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('session.load') || 'Load Session'}</TooltipContent>
      </Tooltip>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('session.saveTitle') || 'Save Session'}</DialogTitle>
            <DialogDescription>
              {t('session.saveDesc') || 'Save current connections and recent logs to the cloud.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-md outline-none focus:ring-1 focus:ring-ring"
              placeholder={t('session.namePlaceholder') || 'Session name'}
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{connections.length} {t('session.connections') || 'connection(s)'}</p>
              <p>
                {connections.reduce((sum, c) => sum + Math.min(c.data.length, 100), 0)}{' '}
                {t('session.logEntries') || 'log entries (max 100 per connection)'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={!sessionName.trim() || saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {t('session.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load dialog */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('session.loadTitle') || 'Load Session'}</DialogTitle>
            <DialogDescription>
              {t('session.loadDesc') || 'Restore a saved session. Connections will be restored in disconnected state.'}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t('session.noSessions') || 'No saved sessions'}
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => handleLoad(session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.session_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(session.updated_at)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {session.connections?.length || 0} conn
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(session.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadOpen(false)}>
              {t('common.close') || 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('session.deleteTitle') || 'Delete Session'}</DialogTitle>
            <DialogDescription>
              {t('session.deleteDesc') || 'This session will be permanently deleted.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              {t('session.delete') || 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
