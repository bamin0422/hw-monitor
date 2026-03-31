export type Provider = 'ollama' | 'groq' | 'openrouter' | 'anthropic' | 'google' | 'openai'

export interface ModelInfo {
  id: string
  name: string
  provider: Provider
  descKey: string
  free: boolean
  builtIn?: boolean
}

// ── Free: Ollama (local, no API key) ──
export const OLLAMA_MODELS: ModelInfo[] = [
  { id: 'ollama/llama3.2',  name: 'Llama 3.2 (3B)',  provider: 'ollama', descKey: 'model.llama32.desc',  free: true },
  { id: 'ollama/llama3.1',  name: 'Llama 3.1 (8B)',  provider: 'ollama', descKey: 'model.llama31.desc',  free: true },
  { id: 'ollama/mistral',   name: 'Mistral 7B',      provider: 'ollama', descKey: 'model.mistral.desc',  free: true },
  { id: 'ollama/gemma2',    name: 'Gemma 2 (9B)',     provider: 'ollama', descKey: 'model.gemma2.desc',   free: true }
]

// ── Free: Groq (cloud, free tier, API key required) ──
export const GROQ_MODELS: ModelInfo[] = [
  { id: 'groq/llama-3.3-70b-versatile', name: 'Llama 3.3 70B',     provider: 'groq', descKey: 'model.llama33groq.desc',    free: true },
  { id: 'groq/llama-3.1-8b-instant',    name: 'Llama 3.1 8B Fast', provider: 'groq', descKey: 'model.llama31instant.desc', free: true },
  { id: 'groq/gemma2-9b-it',            name: 'Gemma 2 9B',        provider: 'groq', descKey: 'model.gemma2groq.desc',     free: true }
]

// ── Free: OpenRouter (cloud, free models, API key required) ──
export const OPENROUTER_MODELS: ModelInfo[] = [
  { id: 'openrouter/meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B',    provider: 'openrouter', descKey: 'model.llama33or.desc',     free: true },
  { id: 'openrouter/deepseek/deepseek-chat:free',            name: 'DeepSeek V3',      provider: 'openrouter', descKey: 'model.deepseekChat.desc',  free: true },
  { id: 'openrouter/deepseek/deepseek-r1:free',              name: 'DeepSeek R1',      provider: 'openrouter', descKey: 'model.deepseekR1.desc',    free: true },
  { id: 'openrouter/google/gemini-2.0-flash:free',       name: 'Gemini 2.0 Flash', provider: 'openrouter', descKey: 'model.geminiFlashOr.desc', free: true }
]

// ── Paid: Anthropic (API key required) ──
export const ANTHROPIC_MODELS: ModelInfo[] = [
  { id: 'claude-sonnet-4-20250514',   name: 'Claude Sonnet 4',   provider: 'anthropic', descKey: 'model.claudeSonnet4.desc',  free: false },
  { id: 'claude-opus-4-20250514',     name: 'Claude Opus 4',     provider: 'anthropic', descKey: 'model.claudeOpus4.desc',    free: false },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', descKey: 'model.claude35Sonnet.desc', free: false },
  { id: 'claude-3-5-haiku-20241022',  name: 'Claude 3.5 Haiku',  provider: 'anthropic', descKey: 'model.claude35Haiku.desc',  free: false }
]

// ── Built-in: Google Gemini (built-in key available, monthly limit applies) ──
export const GOOGLE_MODELS: ModelInfo[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', descKey: 'model.geminiFlash.desc', free: false, builtIn: true },
  { id: 'gemini-1.5-pro',   name: 'Gemini 1.5 Pro',   provider: 'google', descKey: 'model.geminiPro.desc',   free: false, builtIn: true }
]

// ── Paid: OpenAI (API key required) ──
export const OPENAI_MODELS: ModelInfo[] = [
  { id: 'gpt-4o',      name: 'GPT-4o',      provider: 'openai', descKey: 'model.gpt4o.desc',     free: false },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', descKey: 'model.gpt4oMini.desc', free: false }
]

export const FREE_MODELS: ModelInfo[] = [
  ...OLLAMA_MODELS,
  ...GROQ_MODELS,
  ...OPENROUTER_MODELS
]

export const PAID_MODELS: ModelInfo[] = [
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...OPENAI_MODELS
]

export const ALL_MODELS: ModelInfo[] = [
  ...FREE_MODELS,
  ...PAID_MODELS
]

export const PROVIDER_LABELS: Record<Provider, string> = {
  ollama: 'Ollama (Local)',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic',
  google: 'Google',
  openai: 'OpenAI'
}

export const PROVIDER_URLS: Record<string, string> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  google: 'https://aistudio.google.com/app/apikey',
  openai: 'https://platform.openai.com/api-keys',
  groq: 'https://console.groq.com/keys',
  openrouter: 'https://openrouter.ai/keys'
}

/** Extract the actual model ID to send to the API (strip provider prefix) */
export function getApiModelId(modelId: string): string {
  if (modelId.startsWith('ollama/')) return modelId.slice(7)
  if (modelId.startsWith('groq/')) return modelId.slice(5)
  if (modelId.startsWith('openrouter/')) return modelId.slice(11)
  return modelId
}

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return ALL_MODELS.find((m) => m.id === modelId)
}

export function getProviderForModel(modelId: string): Provider | undefined {
  return getModelInfo(modelId)?.provider
}
