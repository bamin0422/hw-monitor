// ── Supabase Configuration ──
// These are PUBLIC keys (safe to embed in client apps).
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://grzkjodccddlqoltyksi.supabase.co'
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyemtqb2RjY2RkbHFvbHR5a3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODE0NjEsImV4cCI6MjA4ODE1NzQ2MX0.e4KoMKkNhotyQikTvAxIfnOC2_SySETAn6dFCLk1xXA'

// ── Built-in Gemini API Key ──
// Loaded from .env (GEMINI_API_KEY). In CI, set via GitHub Actions secrets.
export const BUILTIN_GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

// ── Token Usage Limits ──
// Monthly token limit per user when using the built-in Gemini key.
export const MONTHLY_TOKEN_LIMIT = Number(process.env.MONTHLY_TOKEN_LIMIT) || 5_000_000
