import { RawArticle } from '../sources/types'

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy title matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Calculate similarity between two strings (0-1, where 1 is identical)
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1.0
  }

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Normalize URL for comparison (remove protocols, www, trailing slashes)
 */
function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Check if two articles are duplicates
 */
export function areDuplicates(
  article1: RawArticle,
  article2: RawArticle,
  options: {
    urlSimilarityThreshold?: number
    titleSimilarityThreshold?: number
  } = {}
): boolean {
  const {
    urlSimilarityThreshold = 0.85,
    titleSimilarityThreshold = 0.85,
  } = options

  // Exact URL match
  if (normalizeUrl(article1.url) === normalizeUrl(article2.url)) {
    return true
  }

  // Same GitHub repo + both are releases
  if (
    article1.githubRepo &&
    article2.githubRepo &&
    article1.githubRepo === article2.githubRepo &&
    article1.url.includes('/releases/') &&
    article2.url.includes('/releases/')
  ) {
    return true
  }

  // Similar titles from same domain
  const domain1 = extractDomain(article1.url)
  const domain2 = extractDomain(article2.url)

  if (domain1 && domain2 && domain1 === domain2) {
    const titleSimilarity = stringSimilarity(
      article1.title.toLowerCase(),
      article2.title.toLowerCase()
    )
    if (titleSimilarity >= titleSimilarityThreshold) {
      return true
    }
  }

  // Very similar titles (regardless of domain)
  const titleSimilarity = stringSimilarity(
    article1.title.toLowerCase(),
    article2.title.toLowerCase()
  )
  if (titleSimilarity >= 0.95) {
    // Very high threshold for cross-domain
    return true
  }

  return false
}

/**
 * Merge duplicate articles into canonical version
 * Keeps the one with highest engagement score
 */
export function mergeArticles(articles: RawArticle[]): RawArticle {
  if (articles.length === 0) {
    throw new Error('Cannot merge empty articles array')
  }

  if (articles.length === 1) {
    return articles[0]
  }

  // Sort by score descending, use first as canonical
  const sorted = [...articles].sort((a, b) => (b.score || 0) - (a.score || 0))
  const canonical = { ...sorted[0] }

  // Merge discussion URLs from all duplicates
  const hnUrls = articles
    .map(a => a.hnDiscussionUrl)
    .filter(Boolean) as string[]
  const redditUrls = articles
    .map(a => a.redditDiscussionUrl)
    .filter(Boolean) as string[]

  if (hnUrls.length > 0 && !canonical.hnDiscussionUrl) {
    canonical.hnDiscussionUrl = hnUrls[0]
  }

  if (redditUrls.length > 0 && !canonical.redditDiscussionUrl) {
    canonical.redditDiscussionUrl = redditUrls[0]
  }

  return canonical
}

export interface DeduplicationResult {
  canonical: RawArticle[]
  duplicates: Map<string, RawArticle[]> // Map canonical URL to duplicates
}

/**
 * Deduplicate articles across all sources
 * Returns canonical articles and mapping of duplicates
 */
export function deduplicateArticles(
  articles: RawArticle[]
): DeduplicationResult {
  const canonical: RawArticle[] = []
  const duplicates = new Map<string, RawArticle[]>()

  for (const article of articles) {
    // Check if this article is a duplicate of any canonical article
    let foundDuplicate = false

    for (let i = 0; i < canonical.length; i++) {
      if (areDuplicates(article, canonical[i])) {
        // Found duplicate - merge into canonical
        const existing = canonical[i]
        const merged = mergeArticles([existing, article])
        canonical[i] = merged

        // Track duplicate
        const dupes = duplicates.get(merged.url) || []
        dupes.push(article)
        duplicates.set(merged.url, dupes)

        foundDuplicate = true
        break
      }
    }

    if (!foundDuplicate) {
      canonical.push(article)
    }
  }

  console.log(`[Deduplication] ${articles.length} → ${canonical.length} articles (removed ${articles.length - canonical.length} duplicates)`)

  return { canonical, duplicates }
}
