import { ipcMain, BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import { streamAgentResponse } from '../llm/agent'
import { dataStore } from '../llm/vectorstore'
import type { ConnectionContext, DataEntry } from '../llm/vectorstore'

const activeRequests = new Map<string, AbortController>()

interface StreamParams {
  provider: string
  model: string
  apiKey: string
  messages: { role: string; content: string }[]
  systemPrompt: string
  maxTokens: number
  temperature: number
  baseUrl?: string
  // Connection context for RAG and tools
  connections?: ConnectionContext[]
  activeConnectionId?: string | null
}

function sendToRenderer(win: BrowserWindow, channel: string, ...args: unknown[]) {
  if (!win.isDestroyed()) {
    win.webContents.send(channel, ...args)
  }
}

export function registerLLMHandlers(): void {
  // ── Main streaming handler (LangChain-based) ──
  ipcMain.handle('llm:stream', async (event, params: StreamParams) => {
    const requestId = randomUUID()
    const controller = new AbortController()
    activeRequests.set(requestId, controller)

    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return { success: false, error: 'No window found' }
    }

    // Start streaming in background
    ;(async () => {
      try {
        await streamAgentResponse(
          requestId,
          {
            provider: params.provider,
            model: params.model,
            apiKey: params.apiKey,
            messages: params.messages,
            systemPrompt: params.systemPrompt,
            maxTokens: params.maxTokens,
            temperature: params.temperature,
            baseUrl: params.baseUrl,
            connections: params.connections || [],
            activeConnectionId: params.activeConnectionId || null
          },
          win,
          controller.signal
        )
        sendToRenderer(win, 'llm:done', requestId)
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          sendToRenderer(win, 'llm:done', requestId)
        } else {
          const errMsg = err instanceof Error ? err.message : String(err)
          sendToRenderer(win, 'llm:error', requestId, errMsg)
        }
      } finally {
        activeRequests.delete(requestId)
      }
    })()

    return { success: true, requestId }
  })

  // ── Cancel handler ──
  ipcMain.handle('llm:cancel', (_, requestId: string) => {
    const controller = activeRequests.get(requestId)
    if (controller) {
      controller.abort()
      activeRequests.delete(requestId)
      return { success: true }
    }
    return { success: false, error: 'Request not found' }
  })

  // ── RAG data store handlers ──

  // Add data to the RAG store
  ipcMain.handle(
    'llm:rag-add',
    (
      _,
      entry: { timestamp: number; direction: string; raw: number[]; from?: string },
      connectionId: string,
      connectionType: string
    ) => {
      try {
        const dataEntry: DataEntry = {
          timestamp: entry.timestamp,
          direction: entry.direction as 'rx' | 'tx' | 'system',
          raw: new Uint8Array(entry.raw),
          from: entry.from
        }
        dataStore.addEntry(dataEntry, connectionId, connectionType)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  // Bulk add data
  ipcMain.handle(
    'llm:rag-bulk-add',
    (
      _,
      entries: { timestamp: number; direction: string; raw: number[]; from?: string }[],
      connectionId: string,
      connectionType: string
    ) => {
      try {
        const dataEntries: DataEntry[] = entries.map((e) => ({
          timestamp: e.timestamp,
          direction: e.direction as 'rx' | 'tx' | 'system',
          raw: new Uint8Array(e.raw),
          from: e.from
        }))
        dataStore.addEntries(dataEntries, connectionId, connectionType)
        return { success: true, count: dataEntries.length }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  // Search RAG store
  ipcMain.handle(
    'llm:rag-search',
    (
      _,
      query: string,
      options?: {
        connectionId?: string
        limit?: number
        direction?: string
        timeRangeMinutes?: number
      }
    ) => {
      try {
        const results = dataStore.search(query, options)
        return {
          success: true,
          results: results.map((doc) => ({
            content: doc.pageContent,
            metadata: doc.metadata
          }))
        }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  // Get RAG store stats
  ipcMain.handle('llm:rag-stats', () => {
    return { success: true, stats: dataStore.getStats() }
  })

  // Clear RAG store
  ipcMain.handle('llm:rag-clear', (_, connectionId?: string) => {
    if (connectionId) {
      dataStore.clearConnection(connectionId)
    } else {
      dataStore.clear()
    }
    return { success: true }
  })
}
