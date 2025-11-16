import { describe, expect, it } from 'vitest'
import {
  MIN_WORD_COUNT,
  MAX_WORD_COUNT,
  WORD_COUNT_TOLERANCE,
  calculateBounds,
  isWithinTolerance,
  countWords,
  calculateMaxTokens,
} from '@/lib/content-constraints'

describe('content constraints utilities', () => {
  it('computes lower and upper bounds within tolerance', () => {
    const target = 1_000
    const { lower, upper } = calculateBounds(target)

    expect(lower).toBe(Math.max(MIN_WORD_COUNT, Math.floor(target * (1 - WORD_COUNT_TOLERANCE))))
    expect(upper).toBe(Math.min(MAX_WORD_COUNT, Math.ceil(target * (1 + WORD_COUNT_TOLERANCE))))
    expect(lower).toBeLessThan(upper)
  })

  it('clamps bounds to configured minimum and maximum limits', () => {
    const belowMinimum = calculateBounds(40)
    expect(belowMinimum.lower).toBe(MIN_WORD_COUNT)
    expect(belowMinimum.upper).toBeLessThanOrEqual(MAX_WORD_COUNT)

    const aboveMaximum = calculateBounds(10_000)
    expect(aboveMaximum.upper).toBe(MAX_WORD_COUNT)
    expect(aboveMaximum.lower).toBeGreaterThanOrEqual(MIN_WORD_COUNT)
  })

  it('verifies tolerance checks correctly', () => {
    const { lower, upper } = calculateBounds(750)
    expect(isWithinTolerance(750, lower, upper)).toBe(true)
    expect(isWithinTolerance(lower - 1, lower, upper)).toBe(false)
    expect(isWithinTolerance(upper + 1, lower, upper)).toBe(false)
  })

  it('counts words while stripping markdown characters', () => {
    const markdown = '# Heading\n\n**Bold** text with _italic_ and `code` blocks.'
    expect(countWords(markdown)).toBe(8)
  })

  it('calculates token ceilings and enforces the cap', () => {
    expect(calculateMaxTokens(1_000)).toBe(4_200)
    expect(calculateMaxTokens(10_000)).toBe(12_000)
  })
})


