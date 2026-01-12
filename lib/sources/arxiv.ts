import { FetchResult } from './types'

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'

/**
 * Fetch recent AI/ML papers from arXiv
 * TODO: Implement arXiv API integration with code repo detection
 */
export async function fetchArxivData(): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[arXiv] Mock data - returning empty (not implemented yet)')
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'arxiv',
    }
  }

  // Real arXiv API not implemented yet - return empty for now
  console.log('[arXiv] Real API not implemented yet, returning empty')
  return {
    articles: [],
    fetchedAt: new Date(),
    source: 'arxiv',
  }
}
