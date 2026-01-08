import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/articles/today
 * Fetch today's top articles, optionally filtered by tech stack
 *
 * Query params:
 * - languages: comma-separated list (e.g., "python,javascript")
 * - frameworks: comma-separated list (e.g., "pytorch,langchain")
 * - limit: number of articles to return (default: 10)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const languages = searchParams.get('languages')?.split(',').filter(Boolean)
    const frameworks = searchParams.get('frameworks')?.split(',').filter(Boolean)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause for filtering
    const where: any = {
      // Only include articles with score >= 40
      importanceScore: { gte: 40 },
    }

    // Add tech stack filters if provided
    if (languages && languages.length > 0) {
      where.languages = { hasSome: languages }
    }

    if (frameworks && frameworks.length > 0) {
      where.frameworks = { hasSome: frameworks }
    }

    // Fetch articles from database
    const articles = await prisma.article.findMany({
      where,
      orderBy: [
        { importanceScore: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
      filters: {
        languages: languages || [],
        frameworks: frameworks || [],
      },
    })
  } catch (error) {
    console.error('[API] Error fetching articles:', error)

    // Return empty array on error (for now)
    // TODO: Return mock data for development?
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
