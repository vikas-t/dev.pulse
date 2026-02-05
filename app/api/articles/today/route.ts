import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { articlesCache } from '@/lib/cache/articles-cache'

/**
 * GET /api/articles/today
 * Fetch articles with balanced content diversity and unlimited scroll support
 *
 * Query params:
 * - languages: comma-separated list (e.g., "python,javascript")
 * - frameworks: comma-separated list (e.g., "pytorch,langchain")
 * - limit: number of articles to return (default: 10)
 * - offset: pagination offset (default: 0)
 * - older: boolean - fetch historical data older than 3 days (default: false)
 *
 * Tiered Data Strategy:
 * - Recent (last 3 days): Served from in-memory cache (fast)
 * - Historical (older): Served from database on-demand (slower)
 *
 * Balanced Feed Algorithm:
 * - Critical (2-3): score >= 95 (breaking, security, critical bugs)
 * - New & Noteworthy (5-6): score 55-94 (diverse categories)
 * - GitHub Spotlight (1-2): trending repos (regardless of score)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const languages = searchParams.get('languages')?.split(',').filter(Boolean)
    const frameworks = searchParams.get('frameworks')?.split(',').filter(Boolean)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const older = searchParams.get('older') === 'true'

    // Date range: last 3 days (UTC) for cache and database queries
    const now = new Date()
    const threeDaysAgo = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 3,
      0, 0, 0, 0
    ))
    const epoch = threeDaysAgo.toISOString().split('T')[0] // YYYY-MM-DD

    // Check cache first (only for unfiltered, non-historical requests)
    const hasFilters = (languages && languages.length > 0) || (frameworks && frameworks.length > 0)

    // Historical data requests bypass cache and query database directly
    if (older) {
      console.log(`[Historical] Fetching older articles (offset=${offset}, limit=${limit})`)
      return await fetchHistoricalArticles(threeDaysAgo, offset, limit, languages, frameworks)
    }

    if (!hasFilters) {
      const cached = articlesCache.getCached(epoch)
      if (cached) {
        console.log(`[Cache HIT] Returning page from cached 3-day dataset (offset=${offset}, limit=${limit})`)

        // Apply pagination to cached results
        const page = cached.slice(offset, offset + limit)

        // Calculate distribution from cached data
        const distribution = {
          critical: cached.filter(a => a.importanceScore >= 95).length,
          major: cached.filter(a => a.importanceScore >= 75 && a.importanceScore < 95).length,
          notable: cached.filter(a => a.importanceScore >= 55 && a.importanceScore < 75).length,
          info: cached.filter(a => a.importanceScore >= 40 && a.importanceScore < 55).length,
          trending: cached.filter(a => a.isGithubTrending).length,
        }

        // Add section labels
        const articlesWithSections = page.map(article => ({
          ...article,
          section: article.importanceScore >= 95
            ? 'critical'
            : article.isGithubTrending
              ? 'spotlight'
              : 'noteworthy'
        }))

        // Get oldest article date for UI
        const oldestArticle = page.length > 0 ? page[page.length - 1] : null
        const oldestDate = oldestArticle?.publishedAt
          ? (oldestArticle.publishedAt instanceof Date
              ? oldestArticle.publishedAt.toISOString()
              : oldestArticle.publishedAt)
          : null

        return NextResponse.json({
          success: true,
          articles: articlesWithSections,
          count: articlesWithSections.length,
          total: cached.length,
          hasMore: offset + limit < cached.length,
          cached: true,
          source: 'cache' as const,
          oldestDate,
          distribution,
          filters: {
            languages: [],
            frameworks: [],
          },
        })
      }
      console.log('[Cache MISS] Querying database')
    } else {
      console.log('[Cache SKIP] Filters applied, querying database')
    }

    // Build where clause for filtering
    const baseWhere: any = {
      // Only include articles with score >= 40
      importanceScore: { gte: 40 },
      // Only include articles from last 3 days (UTC)
      publishedAt: { gte: threeDaysAgo },
    }

    // Add tech stack filters if provided
    if (languages && languages.length > 0) {
      baseWhere.languages = { hasSome: languages }
    }

    if (frameworks && frameworks.length > 0) {
      baseWhere.frameworks = { hasSome: frameworks }
    }

    // Fetch ALL articles in different score buckets (in parallel)
    // No take limits - we want the full 3-day dataset for pagination
    const [critical, major, notable, info, trending] = await Promise.all([
      // Critical: score >= 95 (breaking, security, critical bugs)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 95 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
      }),

      // Major: score 75-94 (new tools, launches, trending with engagement)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 75, lt: 95 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
      }),

      // Notable: score 55-74 (launches, tools, performance, case studies)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 55, lt: 75 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
      }),

      // Info: score 40-54 (research, community, general AI news)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 40, lt: 55 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
      }),

      // GitHub Trending: Always include fast-growing repos
      prisma.article.findMany({
        where: {
          ...baseWhere,
          isGithubTrending: true,
        },
        orderBy: [{ githubStars: 'desc' }, { publishedAt: 'desc' }],
      }),
    ])

    // Build balanced feed
    const balancedFeed: any[] = []
    const seenUrls = new Set<string>()

    // Helper to add unique articles
    const addUnique = (articles: any[], maxCount: number) => {
      let added = 0
      for (const article of articles) {
        if (added >= maxCount) break
        if (seenUrls.has(article.url)) continue
        balancedFeed.push(article)
        seenUrls.add(article.url)
        added++
      }
      return added
    }

    // Build the full balanced feed from ALL available articles
    // (we'll apply pagination limits later when returning)

    // 1. Critical section: add all critical articles
    addUnique(critical, critical.length)

    // 2. New & Noteworthy: prioritize launches/tools, then others
    const launchesAndTools = major.filter(a =>
      ['launch', 'trending', 'tools', 'library'].includes(a.category || '')
    )
    const otherMajor = major.filter(a =>
      !['launch', 'trending', 'tools', 'library'].includes(a.category || '')
    )

    addUnique(launchesAndTools, launchesAndTools.length)
    addUnique(otherMajor, otherMajor.length)
    addUnique(notable, notable.length)

    // 3. GitHub Spotlight: add all trending repos
    addUnique(trending, trending.length)

    // 4. Add all remaining info articles
    addUnique(info, info.length)

    // Store full dataset in cache (only for unfiltered requests)
    if (!hasFilters) {
      articlesCache.setCache(balancedFeed, epoch)
      console.log(`[Cache] Stored ${balancedFeed.length} articles (epoch=${epoch})`)
    }

    // Return paginated slice
    const page = balancedFeed.slice(offset, offset + limit)

    // Add section labels for UI
    const articlesWithSections = page.map(article => ({
      ...article,
      section: article.importanceScore >= 95
        ? 'critical'
        : article.isGithubTrending && seenUrls.has(article.url)
          ? 'spotlight'
          : 'noteworthy'
    }))

    // Get oldest article date for UI
    const oldestArticle = page.length > 0 ? page[page.length - 1] : null
    const oldestDate = oldestArticle?.publishedAt?.toISOString() || null

    return NextResponse.json({
      success: true,
      articles: articlesWithSections,
      count: articlesWithSections.length,
      total: balancedFeed.length,
      hasMore: offset + limit < balancedFeed.length,
      cached: false,
      source: 'cache' as const, // Recent data, will be cached
      oldestDate,
      distribution: {
        critical: critical.length,
        major: major.length,
        notable: notable.length,
        info: info.length,
        trending: trending.length,
      },
      filters: {
        languages: languages || [],
        frameworks: frameworks || [],
      },
    })
  } catch (error) {
    console.error('[API] Error fetching articles:', error)

    return NextResponse.json(
      {
        success: false,
        articles: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Fetch historical articles older than the cache window (3 days)
 * Used for unlimited scroll - when user scrolls past cached data
 */
async function fetchHistoricalArticles(
  beforeDate: Date,
  offset: number,
  limit: number,
  languages?: string[],
  frameworks?: string[]
) {
  try {
    // Build where clause for historical data
    const where: Record<string, unknown> = {
      importanceScore: { gte: 40 },
      publishedAt: { lt: beforeDate }, // OLDER than cache window
    }

    // Add tech stack filters if provided
    if (languages && languages.length > 0) {
      where.languages = { hasSome: languages }
    }
    if (frameworks && frameworks.length > 0) {
      where.frameworks = { hasSome: frameworks }
    }

    // Fetch historical articles with importance-first ordering
    const articles = await prisma.article.findMany({
      where,
      orderBy: [
        { importanceScore: 'desc' },
        { publishedAt: 'desc' },
      ],
      skip: offset,
      take: limit,
    })

    // Check if more historical articles exist
    const totalHistorical = await prisma.article.count({ where })
    const hasMore = offset + limit < totalHistorical

    // Get oldest article date for UI
    const oldestArticle = articles.length > 0 ? articles[articles.length - 1] : null
    const oldestDate = oldestArticle?.publishedAt?.toISOString() || null

    // Add section labels (all historical articles go to 'historical' section)
    const articlesWithSections = articles.map(article => ({
      ...article,
      section: 'historical' as const,
    }))

    console.log(`[Historical] Found ${articles.length} articles, hasMore=${hasMore}, oldest=${oldestDate}`)

    return NextResponse.json({
      success: true,
      articles: articlesWithSections,
      count: articlesWithSections.length,
      total: totalHistorical,
      hasMore,
      cached: false,
      source: 'database' as const,
      oldestDate,
      distribution: {
        critical: articles.filter(a => a.importanceScore >= 95).length,
        major: articles.filter(a => a.importanceScore >= 75 && a.importanceScore < 95).length,
        notable: articles.filter(a => a.importanceScore >= 55 && a.importanceScore < 75).length,
        info: articles.filter(a => a.importanceScore >= 40 && a.importanceScore < 55).length,
        trending: articles.filter(a => a.isGithubTrending).length,
      },
      filters: {
        languages: languages || [],
        frameworks: frameworks || [],
      },
    })
  } catch (error) {
    console.error('[Historical] Error fetching historical articles:', error)
    return NextResponse.json(
      {
        success: false,
        articles: [],
        count: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
