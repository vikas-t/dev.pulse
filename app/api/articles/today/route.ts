import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { articlesCache } from '@/lib/cache/articles-cache'

/**
 * GET /api/articles/today
 * Fetch today's top articles with balanced content diversity
 *
 * Query params:
 * - languages: comma-separated list (e.g., "python,javascript")
 * - frameworks: comma-separated list (e.g., "pytorch,langchain")
 * - limit: number of articles to return (default: 10)
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
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check cache first (only for unfiltered requests for V1 simplicity)
    const hasFilters = (languages && languages.length > 0) || (frameworks && frameworks.length > 0)

    if (!hasFilters) {
      const cached = articlesCache.getCached()
      if (cached) {
        console.log('[Cache HIT] Returning cached articles')

        // Apply limit to cached results
        const limitedArticles = cached.slice(0, limit)

        // Calculate distribution from cached data
        const distribution = {
          critical: cached.filter(a => a.importanceScore >= 95).length,
          major: cached.filter(a => a.importanceScore >= 75 && a.importanceScore < 95).length,
          notable: cached.filter(a => a.importanceScore >= 55 && a.importanceScore < 75).length,
          info: cached.filter(a => a.importanceScore >= 40 && a.importanceScore < 55).length,
          trending: cached.filter(a => a.isGithubTrending).length,
        }

        // Add section labels
        const articlesWithSections = limitedArticles.map(article => ({
          ...article,
          section: article.importanceScore >= 95
            ? 'critical'
            : article.isGithubTrending
              ? 'spotlight'
              : 'noteworthy'
        }))

        return NextResponse.json({
          success: true,
          articles: articlesWithSections,
          count: articlesWithSections.length,
          cached: true,
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
    }

    // Add tech stack filters if provided
    if (languages && languages.length > 0) {
      baseWhere.languages = { hasSome: languages }
    }

    if (frameworks && frameworks.length > 0) {
      baseWhere.frameworks = { hasSome: frameworks }
    }

    // Fetch articles in different score buckets (in parallel)
    const [critical, major, notable, info, trending] = await Promise.all([
      // Critical: score >= 95 (breaking, security, critical bugs)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 95 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
        take: 3,
      }),

      // Major: score 75-94 (new tools, launches, trending with engagement)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 75, lt: 95 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
        take: 6,
      }),

      // Notable: score 55-74 (launches, tools, performance, case studies)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 55, lt: 75 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
        take: 4,
      }),

      // Info: score 40-54 (research, community, general AI news)
      prisma.article.findMany({
        where: { ...baseWhere, importanceScore: { gte: 40, lt: 55 } },
        orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
        take: 3,
      }),

      // GitHub Trending: Always include fast-growing repos
      prisma.article.findMany({
        where: {
          ...baseWhere,
          isGithubTrending: true,
        },
        orderBy: [{ githubStars: 'desc' }, { publishedAt: 'desc' }],
        take: 2,
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

    // 1. Critical section: max 3 items
    addUnique(critical, 3)

    // 2. New & Noteworthy: 5-6 items, ensure diversity
    // Prioritize launches, tools, trending from major bucket
    const launchesAndTools = major.filter(a =>
      ['launch', 'trending', 'tools', 'library'].includes(a.category || '')
    )
    const otherMajor = major.filter(a =>
      !['launch', 'trending', 'tools', 'library'].includes(a.category || '')
    )

    addUnique(launchesAndTools, 3) // At least 2-3 launches/tools
    addUnique(otherMajor, 3) // Rest from major bucket
    addUnique(notable, 3) // Fill with notable

    // 3. GitHub Spotlight: Always 1-2 trending repos
    addUnique(trending, 2)

    // 4. Fill remaining slots with info bucket
    const remaining = limit - balancedFeed.length
    if (remaining > 0) {
      addUnique(info, remaining)
    }

    // Trim to exact limit
    const finalArticles = balancedFeed.slice(0, limit)

    // Add section labels for UI
    const articlesWithSections = finalArticles.map(article => ({
      ...article,
      section: article.importanceScore >= 95
        ? 'critical'
        : article.isGithubTrending && seenUrls.has(article.url)
          ? 'spotlight'
          : 'noteworthy'
    }))

    // Store in cache (only for unfiltered requests)
    if (!hasFilters) {
      articlesCache.setCache(balancedFeed)
      console.log('[Cache] Stored', balancedFeed.length, 'articles in cache')
    }

    return NextResponse.json({
      success: true,
      articles: articlesWithSections,
      count: articlesWithSections.length,
      cached: false,
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
