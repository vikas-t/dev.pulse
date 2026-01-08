import { FetchResult } from './types'

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'

/**
 * Fetch from AI company blogs via RSS
 * TODO: Implement RSS parser for OpenAI, Anthropic, Google AI, etc.
 */
export async function fetchRSSData(): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[RSS] Mock data - returning empty (not implemented yet)')
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'blog',
    }
  }

  throw new Error('Real RSS feed parser not implemented yet')
}
