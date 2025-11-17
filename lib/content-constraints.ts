/**
 * Shared content length constraints and helpers used by API routes and UI.
 */

export const MIN_WORD_COUNT = 50
export const MAX_WORD_COUNT = 5000
export const WORD_COUNT_TOLERANCE = 0.2  // Increased from 0.1 (10%) to 0.2 (20%)

// Token limits by model (completion tokens only, not including prompt)
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'gpt-4-turbo-preview': 4096,
  'gpt-4-turbo': 4096,
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-3.5-turbo': 4096,
  'gpt-3.5-turbo-16k': 16384,
}

const DEFAULT_MAX_TOKENS = 4096 // Safe default for most models
const TOKENS_PER_WORD_MULTIPLIER = 1.5 // More conservative estimate (was 4.2, way too high)

export interface WordCountBounds {
  lower: number
  upper: number
}

export function calculateBounds(wordCount: number, tolerance = WORD_COUNT_TOLERANCE): WordCountBounds {
  const lower = Math.max(MIN_WORD_COUNT, Math.floor(wordCount * (1 - tolerance)))
  const upper = Math.min(MAX_WORD_COUNT, Math.ceil(wordCount * (1 + tolerance)))
  return { lower, upper }
}

export function isWithinTolerance(wordCount: number, lower: number, upper: number): boolean {
  return wordCount >= lower && wordCount <= upper
}

export function getModelTokenLimit(model?: string): number {
  return model ? MODEL_TOKEN_LIMITS[model] || DEFAULT_MAX_TOKENS : DEFAULT_MAX_TOKENS
}

export interface TokenBudget {
  estimatedTokens: number
  maxSafeTokens: number
}

export function calculateTokenBudget(targetWordCount: number, model?: string): TokenBudget {
  const modelLimit = getModelTokenLimit(model)
  const maxSafeTokens = Math.floor(modelLimit * 0.95)
  const estimatedTokens = Math.ceil(targetWordCount * TOKENS_PER_WORD_MULTIPLIER)
  return { estimatedTokens, maxSafeTokens }
}

export function countWords(content: string): number {
  const sanitized = content.replace(/[#*_\`>\-]/g, ' ')
  const words = sanitized.trim().split(/\s+/).filter(Boolean)
  return words.length
}


