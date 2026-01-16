import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { runPipeline } from '@/lib/pipeline/orchestrator'
import { articlesCache } from '@/lib/cache/articles-cache'

const RATE_LIMIT_HOURS = 24

/**
 * POST /api/refresh
 * User-triggered refresh with global rate limiting
 *
 * Headers:
 * - x-admin-secret: bypasses rate limit for admin force refresh
 *
 * Rate Limiting:
 * - Global limit: once per 24 hours for all users
 * - Backend-controlled via SystemSettings table
 * - Tamper-proof: frontend cannot bypass
 */
export async function POST(request: Request) {
  try {
    const adminSecret = request.headers.get('x-admin-secret')
    const isAdmin = adminSecret && adminSecret === process.env.ADMIN_SECRET

    // Get or create system settings
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' },
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'system' },
      })
    }

    // Check rate limit (skip for admin)
    if (!isAdmin && settings.lastRefreshAt) {
      const hoursSinceLastRefresh =
        (Date.now() - settings.lastRefreshAt.getTime()) / (1000 * 60 * 60)

      if (hoursSinceLastRefresh < RATE_LIMIT_HOURS) {
        const nextRefreshAt = new Date(
          settings.lastRefreshAt.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000
        )

        return NextResponse.json({
          success: false,
          rateLimited: true,
          message: 'Already refreshed today',
          nextRefreshAt: nextRefreshAt.toISOString(),
        })
      }
    }

    console.log(`[Refresh] Starting ${isAdmin ? 'admin force' : 'user-triggered'} refresh...`)

    // Run the pipeline
    const result = await runPipeline()

    // Update last refresh time
    await prisma.systemSettings.update({
      where: { id: 'system' },
      data: { lastRefreshAt: new Date() },
    })

    // Invalidate article cache
    articlesCache.invalidate()
    console.log('[Cache] Invalidated after successful refresh')

    return NextResponse.json({
      success: result.success,
      message: isAdmin ? 'Admin force refresh complete' : 'Refresh complete',
      stats: {
        articlesProcessed: result.articlesProcessed,
        articlesSaved: result.articlesSaved,
        duration: `${(result.duration / 1000).toFixed(2)}s`,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
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
 * Check refresh status (when can user refresh next)
 */
export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' },
    })

    if (!settings?.lastRefreshAt) {
      return NextResponse.json({
        canRefresh: true,
        lastRefreshAt: null,
        nextRefreshAt: null,
      })
    }

    const hoursSinceLastRefresh =
      (Date.now() - settings.lastRefreshAt.getTime()) / (1000 * 60 * 60)

    const canRefresh = hoursSinceLastRefresh >= RATE_LIMIT_HOURS

    const nextRefreshAt = canRefresh
      ? null
      : new Date(
          settings.lastRefreshAt.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000
        )

    return NextResponse.json({
      canRefresh,
      lastRefreshAt: settings.lastRefreshAt.toISOString(),
      nextRefreshAt: nextRefreshAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('[Refresh] Error checking status:', error)

    return NextResponse.json(
      {
        canRefresh: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
