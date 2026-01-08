import { FetchResult } from './types'

const USE_MOCK_DATA = true

/**
 * Fetch posts from AI/ML subreddits
 * TODO: Implement Reddit API integration
 */
export async function fetchRedditData(): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[Reddit] Mock data - returning empty (not implemented yet)')
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'reddit',
    }
  }

  throw new Error('Real Reddit API not implemented yet')
}
