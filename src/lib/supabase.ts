import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

// Default Supabase config — can be overridden via settings
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const supabaseUrl = url || DEFAULT_SUPABASE_URL
  const supabaseKey = anonKey || DEFAULT_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false // We handle persistence via electron-store
      }
    })
  }
  return supabaseClient
}

export function resetSupabaseClient(): void {
  supabaseClient = null
}

export interface UserSettings {
  api_keys: {
    anthropicApiKey?: string
    openaiApiKey?: string
    googleAiKey?: string
    groqApiKey?: string
    openrouterApiKey?: string
  }
  connection_configs: {
    id: string
    type: string
    label: string
    customLabel?: string
    config: Record<string, unknown>
    encoding: string
  }[]
  preferences: {
    model?: string
    temperature?: number
    maxTokens?: number
    ollamaUrl?: string
    locale?: string
  }
}

export async function saveUserSettings(
  client: SupabaseClient,
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  const { error } = await client
    .from('user_settings')
    .upsert(
      { user_id: userId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  return !error
}

export async function loadUserSettings(
  client: SupabaseClient,
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await client
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as UserSettings
}
