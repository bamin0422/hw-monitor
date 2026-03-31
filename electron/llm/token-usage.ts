import Store from 'electron-store'
import { DAILY_TOKEN_LIMIT } from '../config'

const store = new Store({ name: 'hw-monitor-token-usage' })

interface DailyUsage {
  date: string        // YYYY-MM-DD
  tokensUsed: number
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function getUsageKey(userId: string): string {
  return `usage_${userId}`
}

function getDailyUsage(userId: string): DailyUsage {
  const key = getUsageKey(userId)
  const stored = store.get(key) as DailyUsage | undefined
  const today = todayKey()

  if (stored && stored.date === today) {
    return stored
  }

  // New day — reset
  const fresh: DailyUsage = { date: today, tokensUsed: 0 }
  store.set(key, fresh)
  return fresh
}

/**
 * Check if the user can use the built-in key (has remaining quota).
 * Returns { allowed, remaining, limit, used }.
 */
export function checkTokenBudget(userId: string): {
  allowed: boolean
  remaining: number
  limit: number
  used: number
} {
  const usage = getDailyUsage(userId)
  const remaining = Math.max(0, DAILY_TOKEN_LIMIT - usage.tokensUsed)
  return {
    allowed: remaining > 0,
    remaining,
    limit: DAILY_TOKEN_LIMIT,
    used: usage.tokensUsed
  }
}

/**
 * Record token usage after a successful LLM call.
 * Estimates tokens from text length when exact count is unavailable.
 */
export function recordTokenUsage(userId: string, tokens: number): DailyUsage {
  const usage = getDailyUsage(userId)
  usage.tokensUsed += tokens
  store.set(getUsageKey(userId), usage)
  return usage
}

/**
 * Estimate token count from text.
 * Rough heuristic: ~4 chars per token for English, ~2 chars per token for CJK.
 */
export function estimateTokens(text: string): number {
  // Count CJK characters
  const cjkCount = (text.match(/[\u3000-\u9fff\uac00-\ud7af]/g) || []).length
  const nonCjkLength = text.length - cjkCount
  return Math.ceil(nonCjkLength / 4 + cjkCount / 2)
}

/**
 * Get current usage stats for display.
 */
export function getTokenUsageStats(userId: string): {
  date: string
  used: number
  limit: number
  remaining: number
  percentUsed: number
} {
  const usage = getDailyUsage(userId)
  const remaining = Math.max(0, DAILY_TOKEN_LIMIT - usage.tokensUsed)
  return {
    date: usage.date,
    used: usage.tokensUsed,
    limit: DAILY_TOKEN_LIMIT,
    remaining,
    percentUsed: Math.round((usage.tokensUsed / DAILY_TOKEN_LIMIT) * 100)
  }
}
