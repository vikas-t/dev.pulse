/**
 * Estimate reading time for an article's text content.
 *
 * Computes word count from summary points and optional insight text,
 * then divides by 200 words per minute (average reading speed for
 * technical content). Returns at least 1 minute.
 */
export function computeReadTime(summary: string[], insight?: string | null): number {
  const text = summary.join(' ') + (insight ? ' ' + insight : '')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.ceil(words / 200)
  return Math.max(1, minutes)
}
