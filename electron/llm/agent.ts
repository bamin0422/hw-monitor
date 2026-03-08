import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BrowserWindow } from 'electron'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { createChatModel, supportsToolCalling } from './providers'
import type { ProviderConfig } from './providers'
import { createHardwareTools } from './tools'
import { dataStore } from './vectorstore'
import type { ConnectionContext } from './vectorstore'

function sendToRenderer(win: BrowserWindow, channel: string, ...args: unknown[]) {
  if (!win.isDestroyed()) {
    win.webContents.send(channel, ...args)
  }
}

interface AgentStreamParams {
  provider: string
  model: string
  apiKey: string
  messages: { role: string; content: string }[]
  systemPrompt: string
  maxTokens: number
  temperature: number
  baseUrl?: string
  connections: ConnectionContext[]
  activeConnectionId: string | null
}

/**
 * Stream a response using LangGraph agent with tools (for tool-capable models)
 * or simple LangChain chat (for other models).
 */
export async function streamAgentResponse(
  requestId: string,
  params: AgentStreamParams,
  win: BrowserWindow,
  signal: AbortSignal
): Promise<void> {
  const providerConfig: ProviderConfig = {
    provider: params.provider,
    model: params.model,
    apiKey: params.apiKey,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    baseUrl: params.baseUrl
  }

  const chatModel = createChatModel(providerConfig)
  const useAgent = supportsToolCalling(params.provider, params.model)

  // Build RAG-enhanced system prompt
  const ragContext = buildRAGContext(params.activeConnectionId, params.messages)
  const enhancedSystemPrompt = params.systemPrompt + ragContext

  // Convert messages to LangChain format
  const lcMessages = params.messages.map((m) => {
    if (m.role === 'user') return new HumanMessage(m.content)
    if (m.role === 'assistant') return new AIMessage(m.content)
    return new HumanMessage(m.content)
  })

  if (useAgent) {
    await streamWithAgent(
      requestId,
      chatModel,
      lcMessages,
      enhancedSystemPrompt,
      params.connections,
      params.activeConnectionId,
      win,
      signal
    )
  } else {
    await streamSimpleChat(
      requestId,
      chatModel,
      lcMessages,
      enhancedSystemPrompt,
      win,
      signal
    )
  }
}

/**
 * Build RAG context by retrieving relevant data from the store.
 */
function buildRAGContext(
  activeConnectionId: string | null,
  messages: { role: string; content: string }[]
): string {
  if (dataStore.size === 0) return ''

  // Use the last user message as the query
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUserMsg) return ''

  // Search for relevant data
  const results = dataStore.search(lastUserMsg.content, {
    connectionId: activeConnectionId || undefined,
    limit: 30
  })

  if (results.length === 0) return ''

  const header = '\n\n--- Retrieved Communication Data (RAG) ---'
  const data = results.map((doc) => doc.pageContent).join('\n')
  return `${header}\nThe following data entries are relevant to the user\'s query:\n\`\`\`\n${data}\n\`\`\``
}

/**
 * Stream response using LangGraph ReAct agent with hardware tools.
 */
async function streamWithAgent(
  requestId: string,
  chatModel: BaseChatModel,
  messages: (HumanMessage | AIMessage)[],
  systemPrompt: string,
  connections: ConnectionContext[],
  activeConnectionId: string | null,
  win: BrowserWindow,
  signal: AbortSignal
): Promise<void> {
  const tools = createHardwareTools(connections, activeConnectionId)

  let agent: ReturnType<typeof createReactAgent>
  try {
    agent = createReactAgent({
      llm: chatModel as Parameters<typeof createReactAgent>[0]['llm'],
      tools: tools as StructuredToolInterface[],
      messageModifier: new SystemMessage(systemPrompt)
    })
  } catch {
    // If agent creation fails, fall back to simple chat
    await streamSimpleChat(requestId, chatModel, messages, systemPrompt, win, signal)
    return
  }

  try {
    const stream = await agent.stream(
      { messages },
      { signal }
    )

    for await (const event of stream) {
      if (signal.aborted) break

      // Handle agent events - extract text content from messages
      if (event.agent && event.agent.messages) {
        for (const msg of event.agent.messages) {
          if (typeof msg.content === 'string' && msg.content) {
            sendToRenderer(win, 'llm:chunk', requestId, msg.content)
          } else if (Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === 'text' && block.text) {
                sendToRenderer(win, 'llm:chunk', requestId, block.text)
              }
            }
          }
        }
      }

      // Handle tool results - optionally show tool usage
      if (event.tools && event.tools.messages) {
        for (const msg of event.tools.messages) {
          if (msg.content && typeof msg.content === 'string') {
            // Optionally send tool results as a formatted chunk
            const toolName = msg.name || 'tool'
            sendToRenderer(
              win,
              'llm:chunk',
              requestId,
              `\n\n> **[${toolName}]** result:\n\`\`\`\n${msg.content.slice(0, 500)}\n\`\`\`\n\n`
            )
          }
        }
      }
    }
  } catch (err) {
    // If agent streaming fails (e.g., model doesn't actually support tools),
    // fall back to simple chat
    if ((err as Error).message?.includes('tool') || (err as Error).message?.includes('function')) {
      await streamSimpleChat(requestId, chatModel, messages, systemPrompt, win, signal)
    } else {
      throw err
    }
  }
}

/**
 * Stream response using simple LangChain chat (no tools).
 * RAG context is already injected into the system prompt.
 */
async function streamSimpleChat(
  requestId: string,
  chatModel: BaseChatModel,
  messages: (HumanMessage | AIMessage)[],
  systemPrompt: string,
  win: BrowserWindow,
  signal: AbortSignal
): Promise<void> {
  const allMessages = [new SystemMessage(systemPrompt), ...messages]

  const stream = await chatModel.stream(allMessages, { signal })

  for await (const chunk of stream) {
    if (signal.aborted) break

    const content = chunk.content
    if (typeof content === 'string' && content) {
      sendToRenderer(win, 'llm:chunk', requestId, content)
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (typeof block === 'string') {
          sendToRenderer(win, 'llm:chunk', requestId, block)
        } else if (block.type === 'text' && 'text' in block) {
          sendToRenderer(win, 'llm:chunk', requestId, (block as { type: string; text: string }).text)
        }
      }
    }
  }
}
