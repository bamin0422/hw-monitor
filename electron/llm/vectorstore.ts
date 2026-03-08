import { Document } from '@langchain/core/documents'

export interface DataEntry {
  timestamp: number
  direction: 'rx' | 'tx' | 'system'
  raw: Uint8Array
  from?: string
}

export interface ConnectionContext {
  connectionId: string
  connectionType: string
  label: string
  status: string
  config: Record<string, unknown>
}

interface StoredDocument {
  content: string
  metadata: {
    timestamp: number
    direction: string
    connectionId: string
    connectionType: string
    hexData: string
    asciiData: string
  }
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

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return (
    d.toLocaleTimeString('en-GB', { hour12: false }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  )
}

/**
 * In-memory data store for hardware communication data.
 * Provides RAG-style retrieval via keyword matching and time-based filtering.
 * When embeddings are available, can be upgraded to vector search.
 */
export class HardwareDataStore {
  private documents: StoredDocument[] = []
  private maxDocuments: number = 5000

  /**
   * Add a communication data entry to the store.
   */
  addEntry(entry: DataEntry, connectionId: string, connectionType: string): void {
    const hexData = toHex(entry.raw)
    const asciiData = toAscii(entry.raw)
    const dir = entry.direction === 'rx' ? 'RX' : entry.direction === 'tx' ? 'TX' : 'SYS'
    const from = entry.from ? ` [${entry.from}]` : ''
    const content = `[${formatTimestamp(entry.timestamp)}] ${dir}${from}: HEX: ${hexData} | ASCII: ${asciiData}`

    this.documents.push({
      content,
      metadata: {
        timestamp: entry.timestamp,
        direction: entry.direction,
        connectionId,
        connectionType,
        hexData,
        asciiData
      }
    })

    // Trim old documents if exceeding max
    if (this.documents.length > this.maxDocuments) {
      this.documents = this.documents.slice(-this.maxDocuments)
    }
  }

  /**
   * Bulk add data entries (e.g., on initialization).
   */
  addEntries(
    entries: DataEntry[],
    connectionId: string,
    connectionType: string
  ): void {
    for (const entry of entries) {
      this.addEntry(entry, connectionId, connectionType)
    }
  }

  /**
   * Search for relevant data entries based on a query.
   * Uses keyword matching + time-based relevance scoring.
   */
  search(
    query: string,
    options: {
      connectionId?: string
      limit?: number
      direction?: 'rx' | 'tx' | 'system'
      timeRangeMs?: number
    } = {}
  ): Document[] {
    const { connectionId, limit = 20, direction, timeRangeMs } = options
    const now = Date.now()

    // Normalize query for matching
    const queryLower = query.toLowerCase()
    const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 1)

    // Extract hex patterns from query (e.g., "FF 00" or "ff00")
    const hexPattern = query.match(/[0-9a-fA-F]{2}[\s,]*[0-9a-fA-F]{2}/g)
    const hexTokens = hexPattern
      ? hexPattern.map((h) => h.replace(/[\s,]/g, '').toUpperCase())
      : []

    let filtered = this.documents

    // Filter by connection
    if (connectionId) {
      filtered = filtered.filter((d) => d.metadata.connectionId === connectionId)
    }

    // Filter by direction
    if (direction) {
      filtered = filtered.filter((d) => d.metadata.direction === direction)
    }

    // Filter by time range
    if (timeRangeMs) {
      const cutoff = now - timeRangeMs
      filtered = filtered.filter((d) => d.metadata.timestamp >= cutoff)
    }

    // Score documents by relevance
    const scored = filtered.map((doc) => {
      let score = 0

      // Time-based scoring (more recent = higher score)
      const age = now - doc.metadata.timestamp
      score += Math.max(0, 1 - age / (24 * 60 * 60 * 1000)) * 2 // 0-2 points for recency

      // Keyword matching
      const contentLower = doc.content.toLowerCase()
      for (const token of queryTokens) {
        if (contentLower.includes(token)) score += 3
      }

      // Hex pattern matching (high weight)
      const hexNormalized = doc.metadata.hexData.replace(/\s/g, '')
      for (const hex of hexTokens) {
        if (hexNormalized.includes(hex)) score += 5
      }

      // ASCII content matching
      if (queryTokens.some((t) => doc.metadata.asciiData.toLowerCase().includes(t))) {
        score += 4
      }

      return { doc, score }
    })

    // Sort by score (descending), then by timestamp (descending)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.doc.metadata.timestamp - a.doc.metadata.timestamp
    })

    // Return top results as LangChain Documents
    return scored.slice(0, limit).map(
      ({ doc }) =>
        new Document({
          pageContent: doc.content,
          metadata: doc.metadata
        })
    )
  }

  /**
   * Get the most recent entries for a connection.
   */
  getRecent(connectionId: string, limit: number = 50): Document[] {
    return this.documents
      .filter((d) => d.metadata.connectionId === connectionId)
      .slice(-limit)
      .map(
        (doc) =>
          new Document({
            pageContent: doc.content,
            metadata: doc.metadata
          })
      )
  }

  /**
   * Get statistics about stored data.
   */
  getStats(): {
    totalEntries: number
    byConnection: Record<string, number>
    byDirection: Record<string, number>
  } {
    const byConnection: Record<string, number> = {}
    const byDirection: Record<string, number> = {}

    for (const doc of this.documents) {
      byConnection[doc.metadata.connectionId] =
        (byConnection[doc.metadata.connectionId] || 0) + 1
      byDirection[doc.metadata.direction] =
        (byDirection[doc.metadata.direction] || 0) + 1
    }

    return {
      totalEntries: this.documents.length,
      byConnection,
      byDirection
    }
  }

  /**
   * Clear all stored data.
   */
  clear(): void {
    this.documents = []
  }

  /**
   * Clear data for a specific connection.
   */
  clearConnection(connectionId: string): void {
    this.documents = this.documents.filter(
      (d) => d.metadata.connectionId !== connectionId
    )
  }

  /**
   * Get total number of stored documents.
   */
  get size(): number {
    return this.documents.length
  }
}

// Singleton instance
export const dataStore = new HardwareDataStore()
