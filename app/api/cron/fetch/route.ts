import { NextResponse } from 'next/server'
import { runPipeline } from '@/lib/pipeline/orchestrator'

/**
 * Production cron endpoint
 * This will be called by Vercel Cron every 2 hours
 *
 * To configure in vercel.json:
 * crons: [{ path: "/api/cron/fetch", schedule: "0 STAR/2 STAR STAR STAR" }]
 * (Replace STAR with asterisk)
 */
export async function GET(request: Request) {
  // Verify this is actually from Vercel Cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('[Cron] Starting scheduled pipeline run...')

  try {
    const result = await runPipeline()

    return NextResponse.json({
      success: result.success,
      message: 'Pipeline completed',
      stats: {
        articlesProcessed: result.articlesProcessed,
        articlesSaved: result.articlesSaved,
        duration: `${(result.duration / 1000).toFixed(2)}s`,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    console.error('[Cron] Pipeline failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Pipeline failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
