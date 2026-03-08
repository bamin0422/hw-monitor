import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { dataStore } from './vectorstore'
import type { ConnectionContext } from './vectorstore'

/**
 * Create LangChain tools for hardware interaction.
 * Tools are created per-request with current connection state bound.
 */
export function createHardwareTools(
  connections: ConnectionContext[],
  activeConnectionId: string | null
) {
  const searchDataTool = tool(
    async (input) => {
      const results = dataStore.search(input.query, {
        connectionId: input.connectionId || activeConnectionId || undefined,
        limit: input.limit || 20,
        direction: input.direction as 'rx' | 'tx' | 'system' | undefined,
        timeRangeMs: input.timeRangeMinutes
          ? input.timeRangeMinutes * 60 * 1000
          : undefined
      })

      if (results.length === 0) {
        return 'No matching data entries found.'
      }

      return results.map((doc) => doc.pageContent).join('\n')
    },
    {
      name: 'search_communication_data',
      description:
        'Search through historical hardware communication data. Use this to find specific data patterns, hex sequences, or communication events. Returns matching data entries sorted by relevance.',
      schema: z.object({
        query: z
          .string()
          .describe(
            'Search query - can be hex patterns (e.g., "FF 00 AA"), ASCII text, or descriptive terms'
          ),
        connectionId: z
          .string()
          .optional()
          .describe('Filter by specific connection ID. If omitted, searches active connection.'),
        direction: z
          .enum(['rx', 'tx', 'system'])
          .optional()
          .describe('Filter by data direction: rx (received), tx (transmitted), system'),
        limit: z
          .number()
          .optional()
          .describe('Maximum number of results to return (default: 20)'),
        timeRangeMinutes: z
          .number()
          .optional()
          .describe('Only search within the last N minutes')
      })
    }
  )

  const getConnectionInfoTool = tool(
    async (_input) => {
      if (connections.length === 0) {
        return 'No connections configured.'
      }

      const lines: string[] = []
      for (const conn of connections) {
        const isActive = conn.connectionId === activeConnectionId
        lines.push(`${isActive ? '>>> ' : ''}Connection: ${conn.label}`)
        lines.push(`  ID: ${conn.connectionId}`)
        lines.push(`  Type: ${conn.connectionType}`)
        lines.push(`  Status: ${conn.status}`)

        // Config details
        const cfg = conn.config
        if (conn.connectionType === 'serial') {
          lines.push(
            `  Port: ${cfg.path}, Baud: ${cfg.baudRate}, ${cfg.dataBits}${String(cfg.parity).charAt(0).toUpperCase()}${cfg.stopBits}`
          )
        } else if (conn.connectionType === 'tcp-client') {
          lines.push(`  Target: ${cfg.host}:${cfg.port}`)
        } else if (conn.connectionType === 'tcp-server') {
          lines.push(`  Listen: ${cfg.host}:${cfg.port}`)
        } else if (conn.connectionType === 'udp') {
          lines.push(
            `  Local: ${cfg.localHost}:${cfg.localPort} → Target: ${cfg.targetHost}:${cfg.targetPort}`
          )
        } else if (conn.connectionType === 'ble') {
          lines.push(`  Device: ${cfg.deviceName || cfg.deviceId || '(none)'}`)
        }
        lines.push('')
      }

      // Add data store stats
      const stats = dataStore.getStats()
      lines.push(`Data Store: ${stats.totalEntries} total entries`)
      lines.push(
        `  By direction: ${Object.entries(stats.byDirection)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`
      )

      return lines.join('\n')
    },
    {
      name: 'get_connection_info',
      description:
        'Get information about all configured hardware connections, their status, and configuration. Also shows data store statistics.',
      schema: z.object({})
    }
  )

  const getRecentDataTool = tool(
    async (input) => {
      const connId = input.connectionId || activeConnectionId
      if (!connId) {
        return 'No active connection. Specify a connectionId.'
      }

      const docs = dataStore.getRecent(connId, input.limit || 50)
      if (docs.length === 0) {
        return 'No data available for this connection.'
      }

      return docs.map((doc) => doc.pageContent).join('\n')
    },
    {
      name: 'get_recent_data',
      description:
        'Get the most recent communication data entries for a connection. Use this to see the latest data flow.',
      schema: z.object({
        connectionId: z
          .string()
          .optional()
          .describe('Connection ID. If omitted, uses active connection.'),
        limit: z
          .number()
          .optional()
          .describe('Number of recent entries to retrieve (default: 50)')
      })
    }
  )

  const analyzePatternTool = tool(
    async (input) => {
      const connId = input.connectionId || activeConnectionId
      if (!connId) {
        return 'No active connection. Specify a connectionId.'
      }

      const docs = dataStore.getRecent(connId, 200)
      if (docs.length < 2) {
        return 'Not enough data to analyze patterns. Need at least 2 entries.'
      }

      // Basic pattern analysis
      const analysis: string[] = []
      const rxCount = docs.filter((d) => d.metadata.direction === 'rx').length
      const txCount = docs.filter((d) => d.metadata.direction === 'tx').length
      const sysCount = docs.filter((d) => d.metadata.direction === 'system').length

      analysis.push(`Data Summary (last ${docs.length} entries):`)
      analysis.push(`  RX: ${rxCount}, TX: ${txCount}, System: ${sysCount}`)

      // Time span
      if (docs.length >= 2) {
        const firstTs = docs[0].metadata.timestamp as number
        const lastTs = docs[docs.length - 1].metadata.timestamp as number
        const spanMs = lastTs - firstTs
        const spanSec = (spanMs / 1000).toFixed(1)
        analysis.push(`  Time span: ${spanSec}s`)
        if (docs.length > 1) {
          const avgInterval = (spanMs / (docs.length - 1)).toFixed(1)
          analysis.push(`  Avg interval: ${avgInterval}ms`)
        }
      }

      // Frequency of common hex prefixes (first 2 bytes)
      const prefixCounts: Record<string, number> = {}
      for (const doc of docs) {
        const hex = (doc.metadata.hexData as string).split(' ').slice(0, 2).join(' ')
        if (hex) prefixCounts[hex] = (prefixCounts[hex] || 0) + 1
      }

      const sortedPrefixes = Object.entries(prefixCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)

      if (sortedPrefixes.length > 0) {
        analysis.push('\nCommon data prefixes (first 2 bytes):')
        for (const [prefix, count] of sortedPrefixes) {
          analysis.push(`  ${prefix}: ${count} occurrences (${((count / docs.length) * 100).toFixed(1)}%)`)
        }
      }

      // Check for request-response patterns
      const pairs: string[] = []
      for (let i = 0; i < docs.length - 1; i++) {
        if (
          docs[i].metadata.direction === 'tx' &&
          docs[i + 1].metadata.direction === 'rx'
        ) {
          const delay = (docs[i + 1].metadata.timestamp as number) - (docs[i].metadata.timestamp as number)
          pairs.push(`TX→RX delay: ${delay}ms`)
        }
      }

      if (pairs.length > 0) {
        analysis.push(`\nRequest-Response patterns found: ${pairs.length}`)
        const delays = pairs.map((p) => parseInt(p.match(/\d+/)?.[0] || '0'))
        const avgDelay = (delays.reduce((a, b) => a + b, 0) / delays.length).toFixed(1)
        const minDelay = Math.min(...delays)
        const maxDelay = Math.max(...delays)
        analysis.push(`  Avg response time: ${avgDelay}ms (min: ${minDelay}ms, max: ${maxDelay}ms)`)
      }

      return analysis.join('\n')
    },
    {
      name: 'analyze_data_pattern',
      description:
        'Analyze communication data patterns for a connection. Identifies common data prefixes, request-response patterns, timing, and data flow statistics.',
      schema: z.object({
        connectionId: z
          .string()
          .optional()
          .describe('Connection ID. If omitted, uses active connection.')
      })
    }
  )

  return [searchDataTool, getConnectionInfoTool, getRecentDataTool, analyzePatternTool]
}
