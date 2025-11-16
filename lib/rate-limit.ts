/**
 * Simple in-memory rate limiter.
 * Suitable for MVP/prototype workloads running on a single server instance.
 */

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  retryAfter?: number
}

type Bucket = {
  count: number
  reset: number
}

const buckets = new Map<string, Bucket>()

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const window = config.windowMs
  const bucket = buckets.get(key)

  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + window })
    return {
      success: true,
      remaining: config.limit - 1,
      reset: now + window,
    }
  }

  if (bucket.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      reset: bucket.reset,
      retryAfter: Math.max(0, bucket.reset - now),
    }
  }

  bucket.count += 1
  return {
    success: true,
    remaining: config.limit - bucket.count,
    reset: bucket.reset,
  }
}

