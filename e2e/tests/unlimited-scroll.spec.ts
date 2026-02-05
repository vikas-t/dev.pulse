import { test, expect } from '@playwright/test'
import {
  criticalArticle,
  noteworthyArticle1,
  noteworthyArticle2,
  lastRecentPageResponse,
  firstHistoricalPageResponse,
  lastHistoricalPageResponse,
  refreshStatusCanRefresh,
} from '../fixtures/mock-data'

test.describe('Unlimited Scroll with Historical Data', () => {
  test.beforeEach(async ({ page }) => {
    // Mock refresh status API
    await page.route('**/api/refresh', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(refreshStatusCanRefresh),
        })
      }
    })
  })

  test('transitions to historical mode when recent data is exhausted', async ({ page }) => {
    let historicalCalled = false

    // Single route handler with conditional logic
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        historicalCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstHistoricalPageResponse),
        })
      } else if (offset === '10') {
        // Last page of recent data - triggers historical mode
        // Use noteworthyArticle2 (different URL) to avoid deduplication
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [noteworthyArticle2],
            hasMore: false,
          }),
        })
      } else {
        // Initial load (offset=0 or no offset)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 1, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial load - 2 articles
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // Scroll to end of recent data (noteworthyArticle2 will be added)
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 3,
      { timeout: 5000 }
    )

    // Should now transition and fetch historical
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(1000)

    // Historical API should have been called
    expect(historicalCalled).toBe(true)
  })

  test('shows "Earlier Articles" section header for historical data', async ({ page }) => {
    // Single route handler
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstHistoricalPageResponse),
        })
      } else if (offset === '10') {
        // Second page - exhausts recent data, triggers historical mode
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [],
            count: 0,
            hasMore: false,
          }),
        })
      } else {
        // Initial load - return 2 articles so sentinel isn't immediately visible
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial: 2 articles (IntersectionObserver may have already triggered next load)
    // Wait for initial articles first
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First __loadMore exhausts recent data (empty response, triggers historical mode)
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second __loadMore fetches from historical
    await page.evaluate(() => (window as any).__loadMore())

    // Wait for historical articles to appear
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 4,
      { timeout: 10000 }
    )

    // Should show "Earlier Articles" section
    await expect(page.locator('text=Earlier Articles')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Older articles sorted by importance')).toBeVisible()
  })

  test('shows different loading text when loading historical data', async ({ page }) => {
    // Single route handler with delay for historical
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        // Delay to see loading state
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstHistoricalPageResponse),
        })
      } else if (offset === '10') {
        // Second page exhausts recent data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [],
            count: 0,
            hasMore: false,
          }),
        })
      } else {
        // Initial load - 2 articles
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for initial articles
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First __loadMore exhausts recent data and transitions to historical mode
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second __loadMore fetches historical (with delay)
    await page.evaluate(() => (window as any).__loadMore())

    // Should show historical loading text
    await expect(page.locator('text=Loading from archive...')).toBeVisible({ timeout: 3000 })
  })

  test('updates header with oldest date when showing historical data', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstHistoricalPageResponse),
        })
      } else if (offset === '10') {
        // Second page exhausts recent data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [],
            count: 0,
            hasMore: false,
          }),
        })
      } else {
        // Initial load - 2 articles
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial header shows "AI Updates"
    await expect(page.locator('header')).toContainText('AI Updates')
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First loadMore exhausts recent data
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second loadMore triggers historical fetch
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 4,
      { timeout: 5000 }
    )

    // Header should now include the oldest date ("through")
    await expect(page.locator('header')).toContainText('through')
  })

  test('shows end of archive message when historical data is exhausted', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(lastHistoricalPageResponse),
        })
      } else if (offset === '10') {
        // Second page exhausts recent
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [],
            count: 0,
            hasMore: false,
          }),
        })
      } else {
        // Initial load - 2 articles
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for initial articles
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First __loadMore exhausts recent data
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second __loadMore fetches historical (which is last page)
    await page.evaluate(() => (window as any).__loadMore())

    // Wait for historical articles to load
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 3,
      { timeout: 10000 }
    )

    // Should show end of archive message (hasMore is false from lastHistoricalPageResponse)
    await expect(page.locator("text=You've reached the end of our archive!")).toBeVisible({ timeout: 5000 })
  })

  test('deduplicates articles at cache/historical boundary', async ({ page }) => {
    // Historical response contains an article with same URL as recent
    const duplicateHistoricalResponse = {
      ...firstHistoricalPageResponse,
      articles: [
        { ...noteworthyArticle1, id: 'dup-1', section: 'historical' }, // Duplicate URL
        firstHistoricalPageResponse.articles[0],
      ],
      hasMore: false,
    }

    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(duplicateHistoricalResponse),
        })
      } else if (offset === '10') {
        // Second page exhausts recent (returns empty)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [],
            count: 0,
            total: 2,
            hasMore: false,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      } else {
        // Initial load
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 2,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial: 2 articles
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First __loadMore exhausts recent data (returns empty, triggers historical mode)
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second __loadMore fetches historical
    await page.evaluate(() => (window as any).__loadMore())

    // Wait for historical data to load (should be 3 total - 2 original + 1 unique historical)
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 3,
      { timeout: 10000 }
    )

    // Should have 3 articles (2 recent + 1 unique historical, duplicate filtered out)
    // Not 4 because one historical article has same URL as noteworthyArticle1
    await expect(page.locator('article')).toHaveCount(3)
  })

  test('resets historical state on refresh', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstHistoricalPageResponse),
        })
      } else if (offset === '10') {
        // Second page - exhausts recent data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [],
            count: 0,
            hasMore: false,
          }),
        })
      } else {
        // Initial load - 2 articles
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.route('**/api/refresh', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Refresh complete',
            stats: { articlesProcessed: 10, articlesSaved: 5, duration: '5s' },
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(refreshStatusCanRefresh),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial load - 2 articles
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First loadMore exhausts recent data
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second loadMore fetches historical
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 4,
      { timeout: 5000 }
    )

    // Earlier Articles section should be visible
    await expect(page.locator('text=Earlier Articles')).toBeVisible({ timeout: 5000 })

    // Click refresh
    await page.locator('button:has-text("Refresh")').click()
    await page.waitForTimeout(1500)

    // Historical section should be gone after refresh
    await expect(page.locator('text=Earlier Articles')).not.toBeVisible()
  })

  test('handles errors in historical data gracefully', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Database error' }),
        })
      } else if (offset === '10') {
        // Second page exhausts recent data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [],
            count: 0,
            hasMore: false,
          }),
        })
      } else {
        // Initial load - 2 articles
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial articles visible
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First loadMore exhausts recent data
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second loadMore tries to load historical - should fail
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(1000)

    // Should show error message (partial match for "Failed to load more")
    await expect(page.locator('text=/Failed to load more/')).toBeVisible({ timeout: 5000 })

    // Retry button should be visible
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()

    // Articles from recent data should still be visible
    await expect(page.locator('article')).toHaveCount(2)
  })

  test('continues pagination within historical data', async ({ page }) => {
    let historicalOffset = -1

    // Create a unique article for the second historical page to avoid deduplication
    const uniqueHistoricalArticle = {
      ...firstHistoricalPageResponse.articles[0],
      id: 'unique-historical-1',
      url: 'https://example.com/unique-historical-article',
      title: 'Unique Historical Article',
      section: 'historical',
    }

    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()
      const urlObj = new URL(url)
      const offset = urlObj.searchParams.get('offset')
      const older = urlObj.searchParams.get('older')

      if (older === 'true') {
        historicalOffset = offset ? parseInt(offset) : 0

        if (historicalOffset === 0) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(firstHistoricalPageResponse),
          })
        } else {
          // Second page of historical - use unique article to avoid deduplication
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...lastHistoricalPageResponse,
              articles: [uniqueHistoricalArticle],
            }),
          })
        }
      } else if (offset === '10') {
        // Second page of recent - exhausts recent data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...lastRecentPageResponse,
            articles: [],
            count: 0,
            hasMore: false,
          }),
        })
      } else {
        // Initial load - 2 articles
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            articles: [criticalArticle, noteworthyArticle1],
            count: 2,
            total: 3,
            hasMore: true,
            cached: true,
            source: 'cache',
            oldestDate: '2024-01-09T14:00:00Z',
            distribution: { critical: 1, major: 1, notable: 0, info: 0, trending: 0 },
            filters: { languages: [], frameworks: [] },
          }),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial: 2 articles
    await expect(page.locator('article')).toHaveCount(2, { timeout: 5000 })

    // First loadMore exhausts recent data
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Second loadMore fetches first historical page (adds 2 articles)
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 4,
      { timeout: 5000 }
    )
    expect(historicalOffset).toBe(0)

    // Third loadMore fetches second historical page (adds 1 unique article)
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 5,
      { timeout: 5000 }
    )

    // Should have incremented offset
    expect(historicalOffset).toBeGreaterThan(0)
  })
})
