import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatArticleDate } from './formatDate'

describe('formatArticleDate', () => {
  // Freeze "now" to a fixed point so tests are deterministic
  const NOW = new Date('2026-07-15T12:00:00Z')

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for dates less than 1 minute ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 30 * 1000) // 30 seconds ago
    expect(formatArticleDate(date)).toBe('just now')
  })

  it('returns "just now" for dates less than 1 minute ago (string input)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 10 * 1000) // 10 seconds ago
    expect(formatArticleDate(date.toISOString())).toBe('just now')
  })

  it('returns singular "1 minute ago"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 60 * 1000) // exactly 1 minute ago
    expect(formatArticleDate(date)).toBe('1 minute ago')
  })

  it('returns plural "X minutes ago"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 15 * 60 * 1000) // 15 minutes ago
    expect(formatArticleDate(date)).toBe('15 minutes ago')
  })

  it('returns singular "1 hour ago"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 60 * 60 * 1000) // exactly 1 hour ago
    expect(formatArticleDate(date)).toBe('1 hour ago')
  })

  it('returns plural "X hours ago"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
    expect(formatArticleDate(date)).toBe('3 hours ago')
  })

  it('returns "1 day ago" for yesterday', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 24 * 60 * 60 * 1000) // exactly 24 hours ago
    expect(formatArticleDate(date)).toBe('1 day ago')
  })

  it('returns "X days ago" for 2-6 days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    expect(formatArticleDate(date)).toBe('3 days ago')
  })

  it('returns "X days ago" for 6 days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
    expect(formatArticleDate(date)).toBe('6 days ago')
  })

  it('returns absolute date for articles older than 7 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date('2026-01-15T10:00:00Z')
    // Expected: "Jan 15, 2026"
    expect(formatArticleDate(date)).toBe('Jan 15, 2026')
  })

  it('returns absolute date for very old dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date('2024-03-01T08:00:00Z')
    // Expected: "Mar 1, 2024"
    expect(formatArticleDate(date)).toBe('Mar 1, 2024')
  })

  it('handles boundary at exactly 24 hours (should be "1 day ago")', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 24 * 60 * 60 * 1000 + 1000) // 23h 59m 59s ago
    // 23 hours ago — still in the "hours" range
    expect(formatArticleDate(date)).toBe('23 hours ago')
  })

  it('handles boundary at exactly 7 days (should be absolute date)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    const date = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    // Should be absolute: "Jul 8, 2026"
    expect(formatArticleDate(date)).toBe('Jul 8, 2026')
  })
})
