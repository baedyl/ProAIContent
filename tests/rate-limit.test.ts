import { afterEach, describe, expect, it, vi } from 'vitest'
import { consumeRateLimit } from '@/lib/rate-limit'

describe('rate limiter', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('enforces limit and exposes retry metadata', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    const config = { limit: 2, windowMs: 1_000 }

    const first = consumeRateLimit('test-key', config)
    expect(first.success).toBe(true)
    expect(first.remaining).toBe(1)

    const second = consumeRateLimit('test-key', config)
    expect(second.success).toBe(true)
    expect(second.remaining).toBe(0)

    const third = consumeRateLimit('test-key', config)
    expect(third.success).toBe(false)
    expect(third.remaining).toBe(0)
    expect(third.retryAfter).toBe(1_000)

    vi.advanceTimersByTime(1_000)

    const fourth = consumeRateLimit('test-key', config)
    expect(fourth.success).toBe(true)
    expect(fourth.remaining).toBe(1)
  })
})


