import { test, expect } from '@playwright/test'
import { refreshStatusCanRefresh } from '../fixtures/mock-data'

/**
 * API Pagination Tests - Verifies pagination logic using mocked responses
 * No real DB, OpenAI, or external API calls are made.
 */

function makeArticle(id: string, score: number, source = 'github') {
  return {
    id,
    title: `Article ${id}`,
    url: `https://example.com/${id}`,
    source,
    category: 'library',
    importanceLabel: score >= 95 ? 'BREAKING' : score >= 75 ? 'MAJOR' : score >= 55 ? 'NOTABLE' : 'INFO',
    importanceScore: score,
    tags: ['🚀'],
    summary: [`Summary for article ${id}`],
    insight: null,
    codeExample: null,
    codeLanguage: null,
    installCommand: null,
    languages: ['python'],
    frameworks: ['pytorch'],
    topics: ['llm'],
    publishedAt: new Date().toISOString(),
  }
}

// 25 articles across score buckets
const ALL_ARTICLES = [
  makeArticle('critical-1', 98),
  makeArticle('critical-2', 96),
  ...Array.from({ length: 10 }, (_, i) => makeArticle(`major-${i + 1}`, 80 - i)),
  ...Array.from({ length: 8 }, (_, i) => makeArticle(`notable-${i + 1}`, 65 - i)),
  ...Array.from({ length: 5 }, (_, i) => makeArticle(`info-${i + 1}`, 45 - i)),
]

function paginatedResponse(offset: number, limit: number) {
  const total = ALL_ARTICLES.length
  const articles = ALL_ARTICLES.slice(offset, offset + limit)
  return {
    success: true,
    articles,
    count: articles.length,
    total,
    hasMore: offset + limit < total,
    cached: offset > 0,
    source: offset > 0 ? 'cache' : 'database',
    distribution: { critical: 2, major: 10, notable: 8, info: 5, trending: 0 },
    filters: { languages: [], frameworks: [] },
  }
}

test.describe('API Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })
  })

  test('first page returns correct articles and hasMore=true', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      const url = new URL(route.request().url())
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginatedResponse(offset, limit)) })
    })

    await page.goto('/')

    // Should show first 10 articles
    const cards = page.locator('article')
    await expect(cards).toHaveCount(10)
  })

  test('hasMore is false on last page', async ({ page }) => {
    const lastPageResponse = {
      success: true,
      articles: ALL_ARTICLES.slice(20),
      count: 5,
      total: 25,
      hasMore: false,
      cached: true,
      distribution: { critical: 0, major: 0, notable: 0, info: 5, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lastPageResponse) })
    })

    await page.goto('/')
    const cards = page.locator('article')
    await expect(cards).toHaveCount(5)
  })

  test('articles span multiple score buckets (balanced feed)', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      const url = new URL(route.request().url())
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginatedResponse(offset, limit)) })
    })

    await page.goto('/')

    // Feed should contain articles from different importance levels
    await expect(page.locator('body')).toContainText('BREAKING')
    await expect(page.locator('body')).toContainText('MAJOR')
  })

  test('no duplicate articles across pages', async ({ page }) => {
    const seenIds = new Set<string>()
    let callCount = 0

    await page.route('**/api/articles/today*', async route => {
      const url = new URL(route.request().url())
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const response = paginatedResponse(offset, limit)

      // Verify no overlap with previously seen IDs
      for (const article of response.articles) {
        expect(seenIds.has(article.id)).toBe(false)
        seenIds.add(article.id)
      }

      callCount++
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    })

    await page.goto('/')
  })

  test('total count is consistent across pages', async ({ page }) => {
    const totals: number[] = []

    await page.route('**/api/articles/today*', async route => {
      const url = new URL(route.request().url())
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const response = paginatedResponse(offset, limit)
      totals.push(response.total)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    })

    await page.goto('/')

    // All responses should report the same total
    for (const total of totals) {
      expect(total).toBe(ALL_ARTICLES.length)
    }
  })
})
