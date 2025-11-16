/**
 * Rate Limiting for Authentication Endpoints
 * Prevents brute force attacks on login
 */

interface RateLimitEntry {
  attempts: number
  resetAt: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxAttempts: number // Maximum number of attempts
  windowMs: number // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  error?: string
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (email, IP, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxAttempts: 5, windowMs: 15 * 60 * 1000 } // 5 attempts per 15 minutes
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No previous attempts or window expired
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs
    rateLimitStore.set(identifier, { attempts: 1, resetAt })
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetAt,
    }
  }

  // Check if limit exceeded
  if (entry.attempts >= config.maxAttempts) {
    const minutesRemaining = Math.ceil((entry.resetAt - now) / 60000)
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      error: `Too many login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
    }
  }

  // Increment attempts
  entry.attempts++
  rateLimitStore.set(identifier, entry)

  return {
    success: true,
    remaining: config.maxAttempts - entry.attempts,
    resetAt: entry.resetAt,
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get current rate limit status without incrementing
 * @param identifier - Unique identifier to check
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }
): { isLimited: boolean; remaining: number; resetAt: number | null } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    return {
      isLimited: false,
      remaining: config.maxAttempts,
      resetAt: null,
    }
  }

  return {
    isLimited: entry.attempts >= config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - entry.attempts),
    resetAt: entry.resetAt,
  }
}

