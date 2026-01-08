import { FetchResult } from './types'

const USE_MOCK_DATA = true

/**
 * Fetch developer tutorials from Dev.to
 * TODO: Implement Dev.to API integration
 */
export async function fetchDevToData(): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[Dev.to] Mock data - returning empty (not implemented yet)')
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'devto',
    }
  }

  throw new Error('Real Dev.to API not implemented yet')
}
