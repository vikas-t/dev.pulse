/**
 * Format a date for display in article cards
 *
 * Returns:
 * - Relative time for recent articles (< 24 hours): "2 hours ago", "30 minutes ago"
 * - "1 day ago" for yesterday
 * - Absolute date for older: "Jan 17, 2026"
 */
export function formatArticleDate(date: Date | string): string {
  const publishedDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - publishedDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Less than 1 hour: show minutes
  if (diffMinutes < 60) {
    if (diffMinutes < 1) return 'just now'
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  // Less than 24 hours: show hours
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  }

  // 1 day ago
  if (diffDays === 1) {
    return '1 day ago'
  }

  // 2-6 days: show days ago
  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  // Older: show absolute date in local timezone
  return publishedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
