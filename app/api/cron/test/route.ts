import { NextResponse } from 'next/server'
import { runPipeline } from '@/lib/pipeline/orchestrator'

/**
 * Local testing endpoint
 * Use this to manually trigger the pipeline during development
 *
 * Usage: curl http://localhost:3000/api/cron/test
 *
 * NOTE: Only works in development mode
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    )
  }

  console.log('[Test] Manually triggering pipeline...')

  try {
    const result = await runPipeline()

    return NextResponse.json({
      success: result.success,
      message: 'Pipeline test completed',
      stats: {
        articlesProcessed: result.articlesProcessed,
        articlesSaved: result.articlesSaved,
        duration: `${(result.duration / 1000).toFixed(2)}s`,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Test] Pipeline failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Pipeline test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
