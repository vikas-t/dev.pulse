import { NextResponse } from 'next/server'
import { articlesCache } from '@/lib/cache/articles-cache'

/**
 * GET /api/cache/stats
 * Get cache statistics for monitoring and debugging
 *
 * Returns:
 * - isValid: whether cache is currently valid
 * - timestamp: when cache was last updated (null if never cached)
 * - articleCount: number of articles in cache
 * - hits: number of cache hits
 * - misses: number of cache misses
 * - hitRate: cache hit rate percentage
 */
export async function GET() {
  try {
    const stats = articlesCache.getStats()
    const totalRequests = stats.hits + stats.misses
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0

    return NextResponse.json({
      success: true,
      cache: {
        isValid: stats.isValid,
        timestamp: stats.timestamp,
        articleCount: stats.articleCount,
      },
      stats: {
        hits: stats.hits,
        misses: stats.misses,
        totalRequests,
        hitRate: hitRate.toFixed(2) + '%',
      },
    })
  } catch (error) {
    console.error('[Cache Stats] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
