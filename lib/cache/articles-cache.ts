/**
 * In-memory article cache
 *
 * Caches articles in application memory to avoid database queries on every request.
 * Cache is cleared only when user clicks the refresh button.
 *
 * Trade-offs:
 * - Simple: No external dependencies (Redis, etc.)
 * - Fast: In-memory lookup (microseconds vs milliseconds for DB)
 * - Serverless: Each instance has its own cache (acceptable for V1)
 * - Memory: ~500KB per 100 articles (acceptable)
 */

import type { Article } from '@prisma/client'

interface CacheEntry {
  data: Article[]
  timestamp: number
  epoch: string // YYYY-MM-DD of 3-day window start (UTC)
  isValid: boolean
}

interface CacheStats {
  isValid: boolean
  timestamp: number | null
  epoch: string | null
  articleCount: number
  hits: number
  misses: number
}

// Module-level cache storage
let cache: CacheEntry | null = null
let stats = { hits: 0, misses: 0 }

export const articlesCache = {
  /**
   * Get cached articles if valid
   * @param currentEpoch - YYYY-MM-DD string of 3-day window start (UTC)
   * @returns Cached articles or null if cache miss/stale
   */
  getCached(currentEpoch: string): Article[] | null {
    if (!cache || !cache.isValid) {
      stats.misses++
      return null
    }

    // Check if cache epoch matches current epoch (daily rotation)
    if (cache.epoch !== currentEpoch) {
      stats.misses++
      cache.isValid = false
      return null
    }

    stats.hits++
    return cache.data
  },

  /**
   * Store articles in cache
   * @param articles Articles to cache
   * @param epoch YYYY-MM-DD string of 3-day window start (UTC)
   */
  setCache(articles: Article[], epoch: string): void {
    cache = {
      data: articles,
      timestamp: Date.now(),
      epoch,
      isValid: true,
    }
  },

  /**
   * Invalidate cache (mark as stale)
   * Next request will rebuild cache from database
   */
  invalidate(): void {
    if (cache) {
      cache.isValid = false
    }
  },

  /**
   * Get cache statistics (for monitoring/debugging)
   */
  getStats(): CacheStats {
    return {
      isValid: cache?.isValid ?? false,
      timestamp: cache?.timestamp ?? null,
      epoch: cache?.epoch ?? null,
      articleCount: cache?.data.length ?? 0,
      hits: stats.hits,
      misses: stats.misses,
    }
  },
}
