import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { runPipeline } from '@/lib/pipeline/orchestrator'
import { articlesCache } from '@/lib/cache/articles-cache'

/**
 * POST /api/refresh
 * User-triggered refresh — invalidates the article cache so the next
 * feed request rebuilds from the database. Does NOT run the fetch
 * pipeline; that happens on a schedule via /api/cron/fetch.
 *
 * Headers:
 * - x-admin-secret: forces a full pipeline run (admin only)
 */
export async function POST(request: Request) {
  try {
    const adminSecret = request.headers.get('x-admin-secret')
    const adminSecretConfigured = !!process.env.ADMIN_SECRET
    const isAdmin = adminSecret && adminSecret === process.env.ADMIN_SECRET

    console.log(`[Refresh] POST received — adminSecretProvided=${!!adminSecret}, adminSecretConfigured=${adminSecretConfigured}, isAdmin=${!!isAdmin}`)

    if (isAdmin) {
      console.log('[Refresh] Admin force refresh — running pipeline...')
      const result = await runPipeline()

      await prisma.systemSettings.upsert({
        where: { id: 'system' },
        create: { id: 'system', lastRefreshAt: new Date() },
        update: { lastRefreshAt: new Date() },
      })
      articlesCache.invalidate()

      return NextResponse.json({
        success: result.success,
        message: 'Admin force refresh complete',
        stats: {
          articlesProcessed: result.articlesProcessed,
          articlesSaved: result.articlesSaved,
          duration: `${(result.duration / 1000).toFixed(2)}s`,
        },
        errors: result.errors.length > 0 ? result.errors : undefined,
      })
    }

    // Regular user refresh: invalidate cache so the next feed request
    // rebuilds from the database (picking up anything cron fetched)
    articlesCache.invalidate()

    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' },
    })

    return NextResponse.json({
      success: true,
      message: 'Feed refreshed',
      lastRefreshAt: settings?.lastRefreshAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('[Refresh] Error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/refresh
 * Returns when article data was last fetched by the pipeline
 */
export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' },
    })

    return NextResponse.json({
      lastRefreshAt: settings?.lastRefreshAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('[Refresh] Error checking status:', error)

    return NextResponse.json(
      {
        lastRefreshAt: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
