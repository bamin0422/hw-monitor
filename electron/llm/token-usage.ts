import Store from 'electron-store'
import { MONTHLY_TOKEN_LIMIT } from '../config'

const store = new Store({ name: 'hw-monitor-token-usage' })

interface MonthlyUsage {
  month: string       // YYYY-MM
  tokensUsed: number
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

function getUsageKey(userId: string): string {
  return `usage_${userId}`
}

function getMonthlyUsage(userId: string): MonthlyUsage {
  const key = getUsageKey(userId)
  const stored = store.get(key) as MonthlyUsage | undefined
  const currentMonth = monthKey()

  if (stored && stored.month === currentMonth) {
    return stored
  }

  // New month — reset
  const fresh: MonthlyUsage = { month: currentMonth, tokensUsed: 0 }
  store.set(key, fresh)
  return fresh
}

/**
 * Check if the user can use the built-in key (has remaining quota).
 */
export function checkTokenBudget(userId: string): {
  allowed: boolean
  remaining: number
  limit: number
  used: number
} {
  const usage = getMonthlyUsage(userId)
  const remaining = Math.max(0, MONTHLY_TOKEN_LIMIT - usage.tokensUsed)
  return {
    allowed: remaining > 0,
    remaining,
    limit: MONTHLY_TOKEN_LIMIT,
    used: usage.tokensUsed
  }
}

/**
 * Record token usage after a successful LLM call.
 */
export function recordTokenUsage(userId: string, tokens: number): MonthlyUsage {
  const usage = getMonthlyUsage(userId)
  usage.tokensUsed += tokens
  store.set(getUsageKey(userId), usage)
  return usage
}

/**
 * Estimate token count from text.
 * Rough heuristic: ~4 chars per token for English, ~2 chars per token for CJK.
 */
export function estimateTokens(text: string): number {
  const cjkCount = (text.match(/[\u3000-\u9fff\uac00-\ud7af]/g) || []).length
  const nonCjkLength = text.length - cjkCount
  return Math.ceil(nonCjkLength / 4 + cjkCount / 2)
}

/**
 * Get current usage stats for display.
 */
export function getTokenUsageStats(userId: string): {
  month: string
  used: number
  limit: number
  remaining: number
  percentUsed: number
} {
  const usage = getMonthlyUsage(userId)
  const remaining = Math.max(0, MONTHLY_TOKEN_LIMIT - usage.tokensUsed)
  return {
    month: usage.month,
    used: usage.tokensUsed,
    limit: MONTHLY_TOKEN_LIMIT,
    remaining,
    percentUsed: Math.round((usage.tokensUsed / MONTHLY_TOKEN_LIMIT) * 100)
  }
}
