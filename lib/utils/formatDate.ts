/**
 * Format a date for display in article cards.
 *
 * Returns:
 * - "just now" for < 1 minute
 * - "X min ago" / "X mins ago" for < 1 hour
 * - "X hour ago" / "X hours ago" for < 24 hours
 * - "Yesterday" for 1 day ago
 * - "X days ago" for 2-6 days
 * - "Last week" for 7-13 days
 * - "X weeks ago" for 2-4 weeks
 * - "Last month" for 30-59 days
 * - "X months ago" for 2-11 months
 * - "Jan 17" for this year (older than 11 months)
 * - "Jan 17, 2024" for previous years
 */
export function formatArticleDate(date: Date | string): string {
  const publishedDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - publishedDate.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  // Less than 1 minute
  if (diffMinutes < 1) return 'just now'

  // Less than 1 hour: show minutes
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} ago`
  }

  // Less than 24 hours: show hours
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  }

  // Yesterday
  if (diffDays === 1) return 'Yesterday'

  // 2-6 days
  if (diffDays < 7) return `${diffDays} days ago`

  // Last week (7-13 days)
  if (diffDays < 14) return 'Last week'

  // 2-4 weeks (14-29 days)
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} weeks ago`
  }

  // Last month (30-59 days)
  if (diffDays < 60) return 'Last month'

  // 2-11 months (60-364 days)
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} months ago`
  }

  // Older: absolute date — drop year when it's the current year
  const thisYear = now.getFullYear()
  const pubYear = publishedDate.getFullYear()

  const monthDay = publishedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  if (pubYear === thisYear) {
    return monthDay // "Jan 17"
  }

  return `${monthDay}, ${pubYear}` // "Jan 17, 2024"
}

/**
 * Full date/time string for use in a tooltip (title attribute).
 * Example: "Monday, January 17, 2024 at 10:00 AM EST"
 */
export function formatArticleDateTooltip(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}
