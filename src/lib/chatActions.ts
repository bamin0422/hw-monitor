import type { ChatAction, Connection, SerialConfig, TcpClientConfig, TcpServerConfig, UdpConfig, BleConfig, DataEntry } from '@/types'
import type { Locale } from './i18n'

// ── Hex/ASCII helpers ──

function toHex(raw: Uint8Array): string {
  return Array.from(raw).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

function toAscii(raw: Uint8Array): string {
  return Array.from(raw).map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.')).join('')
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

// ── Dynamic system prompt builder ──

function buildConnectionSummary(conn: Connection, locale: Locale): string {
  const lines: string[] = []
  const isKo = locale === 'ko'

  const statusLabel: Record<string, Record<Locale, string>> = {
    disconnected: { ko: '연결 해제', en: 'Disconnected' },
    connecting: { ko: '연결 중', en: 'Connecting' },
    connected: { ko: '연결됨', en: 'Connected' },
    listening: { ko: '수신 대기', en: 'Listening' },
    error: { ko: '오류', en: 'Error' }
  }

  const name = conn.customLabel || conn.label
  const status = statusLabel[conn.status]?.[locale] || conn.status
  lines.push(`- ${name} (${conn.type}) — ${status}`)

  if (conn.type === 'serial') {
    const cfg = conn.config as SerialConfig
    lines.push(`  ${isKo ? '포트' : 'Port'}: ${cfg.path || '(미선택)'}, ${isKo ? '보드레이트' : 'Baud'}: ${cfg.baudRate}, ${cfg.dataBits}${cfg.parity[0].toUpperCase()}${cfg.stopBits}, ${isKo ? '프로토콜' : 'Protocol'}: ${cfg.label}`)
    if (cfg.flowControl !== 'none') lines.push(`  ${isKo ? '흐름제어' : 'Flow Control'}: ${cfg.flowControl}`)
  } else if (conn.type === 'tcp-client') {
    const cfg = conn.config as TcpClientConfig
    lines.push(`  ${isKo ? '대상' : 'Target'}: ${cfg.host}:${cfg.port}`)
  } else if (conn.type === 'tcp-server') {
    const cfg = conn.config as TcpServerConfig
    lines.push(`  ${isKo ? '리슨' : 'Listen'}: ${cfg.host}:${cfg.port}`)
    if (conn.connectedClients?.length) {
      lines.push(`  ${isKo ? '접속 클라이언트' : 'Clients'}: ${conn.connectedClients.join(', ')}`)
    }
  } else if (conn.type === 'udp') {
    const cfg = conn.config as UdpConfig
    lines.push(`  ${isKo ? '로컬' : 'Local'}: ${cfg.localHost}:${cfg.localPort} → ${isKo ? '대상' : 'Target'}: ${cfg.targetHost}:${cfg.targetPort}`)
  } else if (conn.type === 'ble') {
    const cfg = conn.config as BleConfig
    lines.push(`  ${isKo ? '장치' : 'Device'}: ${cfg.deviceName || cfg.deviceId || '(미선택)'}`)
    if (cfg.serviceUuid) lines.push(`  Service: ${cfg.serviceUuid}, Char: ${cfg.characteristicUuid}`)
  }

  if (conn.error) lines.push(`  ${isKo ? '에러' : 'Error'}: ${conn.error}`)
  return lines.join('\n')
}

function formatRecentData(data: DataEntry[], limit: number = 20): string {
  const recent = data.slice(-limit)
  if (recent.length === 0) return ''
  return recent
    .map((e) => {
      const dir = e.direction === 'rx' ? 'RX' : e.direction === 'tx' ? 'TX' : 'SYS'
      const from = e.from ? ` [${e.from}]` : ''
      return `[${formatTimestamp(e.timestamp)}] ${dir}${from}: ${toHex(e.raw)}  |  ${toAscii(e.raw)}`
    })
    .join('\n')
}

export function buildSystemPrompt(
  connections: Connection[],
  activeConnectionId: string | null,
  locale: Locale
): string {
  const isKo = locale === 'ko'
  const activeConn = connections.find((c) => c.id === activeConnectionId)

  // ── Base prompt (localized) ──
  const base = isKo
    ? `당신은 하드웨어 통신 전문가입니다. 시리얼(RS-232, RS-422, RS-485), TCP/IP, UDP, BLE 프로토콜에 정통합니다.
사용자가 통신 프로토콜을 설계, 디버깅, 구현하는 것을 도와주세요. 간결하고 실용적으로 답변하세요.
한국어로 답변하세요.

사용자가 연결 정보와 통신 데이터를 공유하면, 데이터를 분석하여 문제점을 찾고 해결 방법을 제안하세요.`
    : `You are a hardware communication expert specializing in serial protocols (RS-232, RS-422, RS-485), TCP/IP, UDP, and BLE.
Help users design, debug, and implement communication protocols. Be concise and practical.

When the user shares connection info and communication data, analyze the data for issues and suggest corrective actions.`

  // ── Action blocks instructions ──
  const actionInstructions = isKo
    ? `\n\n실행 가능한 액션 블록을 사용하여 사용자가 버튼 클릭으로 바로 실행할 수 있는 작업을 제안할 수 있습니다:

\`\`\`action
{"action": "send", "data": "ACK\\r\\n", "encoding": "ascii", "description": "ACK 응답 전송"}
\`\`\`

사용 가능한 액션:
- send: 데이터 전송. 필드: data (문자열), encoding ("hex" 또는 "ascii"), description.
  hex의 경우 "FF 00 AA BB" 형식으로 공백 구분.
- reconnect: 연결 끊고 재연결. 필드: description.
- disconnect: 연결 종료. 필드: description.
- configure: 설정 변경 제안. 필드: config (설정 객체), description.

규칙:
- 반드시 "description"에 왜 이 액션이 도움이 되는지 설명을 포함하세요.
- 원시 프로토콜 바이트는 "hex", 텍스트 명령은 "ascii" 인코딩을 사용하세요.
- 단계별 트러블슈팅을 위해 여러 액션 블록을 포함할 수 있습니다.
- 사용자가 연결 데이터를 공유하거나 통신 문제 해결을 요청할 때만 액션을 제안하세요.
- 코드 예제(액션이 아닌)는 언어 태그가 있는 일반 코드 블록을 사용하세요.`
    : `\n\nYou can suggest executable actions using action blocks. The user can click a button to execute them directly on the active connection. Use this format:

\`\`\`action
{"action": "send", "data": "ACK\\r\\n", "encoding": "ascii", "description": "Send ACK response to confirm receipt"}
\`\`\`

Available actions:
- send: Send data through the connection. Fields: data (string), encoding ("hex" or "ascii"), description.
  For hex encoding, use space-separated hex bytes like "FF 00 AA BB".
- reconnect: Disconnect and reconnect. Fields: description.
- disconnect: Close the connection. Fields: description.
- configure: Suggest configuration changes. Fields: config (object with settings), description.

Rules for action blocks:
- Always include a clear "description" explaining why this action helps.
- Use "hex" encoding when sending raw protocol bytes, "ascii" for text commands.
- You can include multiple action blocks in one response for step-by-step troubleshooting.
- Only suggest actions when the user has shared connection data or asked for help fixing communication.
- When showing code examples (not actions), use regular code blocks with language tags.`

  // ── Connection context ──
  let contextSection = ''

  if (connections.length > 0) {
    const header = isKo ? '\n\n--- 현재 연결 상태 ---' : '\n\n--- Current Connections ---'
    const connList = connections.map((c) => buildConnectionSummary(c, locale)).join('\n')

    contextSection += `${header}\n${connList}`

    if (activeConn) {
      const activeLabel = isKo
        ? `\n\n[활성 연결: ${activeConn.customLabel || activeConn.label}]`
        : `\n\n[Active Connection: ${activeConn.customLabel || activeConn.label}]`
      contextSection += activeLabel

      // Recent data from active connection
      const recentData = formatRecentData(activeConn.data)
      if (recentData) {
        const dataHeader = isKo ? '\n\n최근 통신 데이터 (최대 20건):' : '\n\nRecent communication data (up to 20 entries):'
        contextSection += `${dataHeader}\n\`\`\`\n${recentData}\n\`\`\``
      } else {
        contextSection += isKo ? '\n(아직 통신 데이터 없음)' : '\n(No communication data yet)'
      }
    }
  } else {
    contextSection = isKo
      ? '\n\n(현재 열려있는 연결 없음 — 일반 프로토콜 질문에 답변해주세요)'
      : '\n\n(No connections open — answer general protocol questions)'
  }

  return base + actionInstructions + contextSection
}

/**
 * Parse ```action code blocks from AI response text.
 * Returns an array of { action, startIndex, endIndex } for rendering.
 */
export interface ParsedSegment {
  type: 'text' | 'action'
  content: string
  action?: ChatAction
}

export function parseActionBlocks(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  const regex = /```action\s*\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Text before this action block
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    // Parse the action JSON
    const jsonStr = match[1].trim()
    try {
      const action = JSON.parse(jsonStr) as ChatAction
      if (action.action && action.description) {
        segments.push({ type: 'action', content: match[0], action })
      } else {
        // Invalid action format, treat as text
        segments.push({ type: 'text', content: match[0] })
      }
    } catch {
      // JSON parse failed, treat as regular code block
      segments.push({ type: 'text', content: match[0] })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last action block
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}

/**
 * Build connection metadata string for the AI context.
 */
export function buildConnectionContext(conn: Connection): string {
  const lines: string[] = []
  lines.push(`Connection: ${conn.customLabel || conn.label}`)
  lines.push(`Type: ${conn.type}`)
  lines.push(`Status: ${conn.status}`)
  if (conn.error) lines.push(`Error: ${conn.error}`)

  if (conn.type === 'serial') {
    const cfg = conn.config as SerialConfig
    lines.push(`Port: ${cfg.path}`)
    lines.push(`Baud Rate: ${cfg.baudRate}`)
    lines.push(`Data Bits: ${cfg.dataBits}, Stop Bits: ${cfg.stopBits}, Parity: ${cfg.parity}`)
    lines.push(`Flow Control: ${cfg.flowControl}`)
    lines.push(`Protocol: ${cfg.label}`)
  } else if (conn.type === 'tcp-client') {
    const cfg = conn.config as TcpClientConfig
    lines.push(`Host: ${cfg.host}:${cfg.port}`)
    lines.push(`Auto Reconnect: ${cfg.autoReconnect}`)
  } else if (conn.type === 'tcp-server') {
    const cfg = conn.config as TcpServerConfig
    lines.push(`Listen: ${cfg.host}:${cfg.port}`)
    if (conn.connectedClients?.length) {
      lines.push(`Connected Clients: ${conn.connectedClients.join(', ')}`)
    }
  } else if (conn.type === 'udp') {
    const cfg = conn.config as UdpConfig
    lines.push(`Local: ${cfg.localHost}:${cfg.localPort}`)
    lines.push(`Target: ${cfg.targetHost}:${cfg.targetPort}`)
  }

  return lines.join('\n')
}

/**
 * Execute an action on a connection via IPC.
 */
export async function executeAction(
  action: ChatAction,
  conn: Connection
): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.action) {
      case 'send': {
        if (!action.data) return { success: false, message: 'No data specified' }
        const encoding = action.encoding || 'ascii'

        if (conn.type === 'serial') {
          const result = await window.electronAPI.serial.send(conn.id, action.data, encoding)
          return result.success
            ? { success: true, message: `Sent ${encoding}: ${action.data}` }
            : { success: false, message: result.error || 'Send failed' }
        } else if (conn.type === 'tcp-client') {
          const result = await window.electronAPI.tcp.send(conn.id, action.data, encoding)
          return result.success
            ? { success: true, message: `Sent ${encoding}: ${action.data}` }
            : { success: false, message: result.error || 'Send failed' }
        } else if (conn.type === 'udp') {
          const cfg = conn.config as UdpConfig
          const result = await window.electronAPI.udp.send(
            conn.id, cfg.targetHost, cfg.targetPort, action.data, encoding
          )
          return result.success
            ? { success: true, message: `Sent ${encoding}: ${action.data}` }
            : { success: false, message: result.error || 'Send failed' }
        }
        return { success: false, message: 'Cannot send on this connection type' }
      }

      case 'reconnect': {
        // Disconnect first
        if (conn.type === 'serial') {
          await window.electronAPI.serial.close(conn.id)
          const cfg = conn.config as SerialConfig
          const result = await window.electronAPI.serial.open({ portId: conn.id, ...cfg })
          return result.success
            ? { success: true, message: 'Reconnected successfully' }
            : { success: false, message: result.error || 'Reconnect failed' }
        } else if (conn.type === 'tcp-client') {
          await window.electronAPI.tcp.close(conn.id)
          const cfg = conn.config as TcpClientConfig
          const result = await window.electronAPI.tcp.connect({ connId: conn.id, ...cfg })
          return result.success
            ? { success: true, message: 'Reconnected successfully' }
            : { success: false, message: result.error || 'Reconnect failed' }
        } else if (conn.type === 'tcp-server') {
          await window.electronAPI.tcp.close(conn.id)
          const cfg = conn.config as TcpServerConfig
          const result = await window.electronAPI.tcp.listen({ connId: conn.id, ...cfg })
          return result.success
            ? { success: true, message: 'Server restarted successfully' }
            : { success: false, message: result.error || 'Restart failed' }
        } else if (conn.type === 'udp') {
          await window.electronAPI.udp.close(conn.id)
          const cfg = conn.config as UdpConfig
          const result = await window.electronAPI.udp.bind({
            sockId: conn.id, localPort: cfg.localPort, localHost: cfg.localHost
          })
          return result.success
            ? { success: true, message: 'Socket rebound successfully' }
            : { success: false, message: result.error || 'Rebind failed' }
        }
        return { success: false, message: 'Unknown connection type' }
      }

      case 'disconnect': {
        if (conn.type === 'serial') {
          const result = await window.electronAPI.serial.close(conn.id)
          return result.success
            ? { success: true, message: 'Disconnected' }
            : { success: false, message: result.error || 'Disconnect failed' }
        } else if (conn.type === 'tcp-client' || conn.type === 'tcp-server') {
          const result = await window.electronAPI.tcp.close(conn.id)
          return result.success
            ? { success: true, message: 'Disconnected' }
            : { success: false, message: result.error || 'Disconnect failed' }
        } else if (conn.type === 'udp') {
          const result = await window.electronAPI.udp.close(conn.id)
          return result.success
            ? { success: true, message: 'Socket closed' }
            : { success: false, message: result.error || 'Close failed' }
        }
        return { success: false, message: 'Unknown connection type' }
      }

      case 'configure': {
        // Return config suggestion — actual application is handled by the caller
        // since it requires store updates
        return {
          success: true,
          message: `Configuration suggestion: ${JSON.stringify(action.config)}`
        }
      }

      default:
        return { success: false, message: `Unknown action: ${action.action}` }
    }
  } catch (err) {
    return { success: false, message: String(err) }
  }
}
