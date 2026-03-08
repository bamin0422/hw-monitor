import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

export interface ProviderConfig {
  provider: string
  model: string
  apiKey: string
  temperature: number
  maxTokens: number
  baseUrl?: string
}

/**
 * Create a LangChain chat model for any supported provider.
 * Uses OpenAI-compatible interface for Groq, OpenRouter, and Ollama.
 */
export function createChatModel(config: ProviderConfig): BaseChatModel {
  const { provider, model, apiKey, temperature, maxTokens, baseUrl } = config

  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey,
        model,
        temperature,
        maxTokens,
        streaming: true
      })

    case 'anthropic':
      return new ChatAnthropic({
        apiKey,
        model,
        temperature,
        maxTokens,
        streaming: true
      })

    case 'google':
      return new ChatGoogleGenerativeAI({
        apiKey,
        model,
        maxOutputTokens: maxTokens,
        streaming: true
      })

    case 'groq':
      return new ChatOpenAI({
        apiKey,
        model,
        temperature,
        maxTokens,
        streaming: true,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1'
        }
      })

    case 'openrouter':
      return new ChatOpenAI({
        apiKey,
        model,
        temperature,
        maxTokens,
        streaming: true,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://hw-monitor.app'
          }
        }
      })

    case 'ollama':
      return new ChatOpenAI({
        apiKey: 'ollama',
        model,
        temperature,
        maxTokens,
        streaming: true,
        configuration: {
          baseURL: (baseUrl || 'http://localhost:11434') + '/v1'
        }
      })

    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Check if a model likely supports tool calling.
 * Models without tool support will use RAG-only mode.
 */
export function supportsToolCalling(provider: string, model: string): boolean {
  switch (provider) {
    case 'openai':
      return true // All OpenAI chat models support tools
    case 'anthropic':
      return true // Claude 3+ supports tools
    case 'google':
      return true // Gemini supports tools
    case 'groq':
      // Groq supports tools for most models
      return model.includes('llama-3') || model.includes('gemma')
    case 'openrouter':
      // Only some OpenRouter models support tools
      return !model.includes(':free')
    case 'ollama':
      // Ollama tool support depends on model
      return model.includes('llama3') || model.includes('mistral')
    default:
      return false
  }
}
