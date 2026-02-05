import { test, expect } from '@playwright/test'
import {
  firstPageResponse,
  secondPageResponse,
  lastPageResponse,
  emptyPageResponse,
  refreshStatusCanRefresh,
} from '../fixtures/mock-data'

test.describe('Infinite Scroll Pagination', () => {
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

  test('loads first page on initial mount', async ({ page }) => {
    // Mock first page
    await page.route('**/api/articles/today?limit=10&offset=0', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firstPageResponse),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should display articles from first page
    await expect(page.locator('article')).toHaveCount(2)

    // Should show correct count in header
    await expect(page.locator('header')).toContainText('2 of 25')
  })

  test('loads next page when triggered', async ({ page }) => {
    let requestCount = 0

    // Mock paginated responses
    await page.route('**/api/articles/today**', async route => {
      const url = route.request().url()

      if (url.includes('offset=0')) {
        requestCount++
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstPageResponse),
        })
      } else if (url.includes('offset=10')) {
        requestCount++
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(secondPageResponse),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial load
    await expect(page.locator('article')).toHaveCount(2)
    expect(requestCount).toBe(1)

    // Trigger load more using test utility
    await page.evaluate(() => (window as any).__loadMore())

    // Wait for second page to load
    await page.waitForFunction(
      () => document.querySelectorAll('article').length >= 4,
      { timeout: 5000 }
    )
    await expect(page.locator('article')).toHaveCount(4)
    expect(requestCount).toBe(2)

    // Header should update
    await expect(page.locator('header')).toContainText('4 of 25')
  })

  test('shows loading indicator while fetching next page', async ({ page }) => {
    // Mock with delay
    await page.route('**/api/articles/today?limit=10&offset=0', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firstPageResponse),
      })
    })

    await page.route('**/api/articles/today?limit=10&offset=10', async route => {
      // Delay to see loading state
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(secondPageResponse),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Trigger next page
    await page.evaluate(() => (window as any).__loadMore())

    // Should show loading indicator
    await expect(page.locator('text=Loading more articles...')).toBeVisible({ timeout: 1000 })

    // Wait for loading to complete
    await expect(page.locator('text=Loading more articles...')).not.toBeVisible({ timeout: 5000 })
  })

  test('shows end of feed message when no more articles', async ({ page }) => {
    // Mock last page response (recent data exhausted)
    await page.route('**/api/articles/today?limit=10&offset=0', async route => {
      const url = route.request().url()
      // Check if this is a historical data request
      if (url.includes('older=true')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, articles: [], hasMore: false }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(lastPageResponse),
        })
      }
    })

    // Also mock historical data endpoint (no older articles)
    await page.route('**/api/articles/today?limit=10&offset=0&older=true', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, articles: [], hasMore: false }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // After recent data exhausted + historical returns empty, should show archive end message
    await expect(page.locator('text=You\'ve reached the end of our archive!')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Showing 1 articles')).toBeVisible()
  })

  test('does not load more when already at end', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/articles/today**', async route => {
      requestCount++
      const url = route.request().url()
      if (url.includes('older=true')) {
        // Historical request returns empty - truly at end
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, articles: [], hasMore: false }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(lastPageResponse),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for historical fetch to also complete
    await page.waitForTimeout(500)
    const countAfterLoad = requestCount
    // Initial load (1) + automatic historical fetch (1) = 2
    expect(countAfterLoad).toBe(2)

    // Try to load more multiple times
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(300)
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(300)

    // Should not make additional requests (historical hasMore is false)
    expect(requestCount).toBe(countAfterLoad)
  })

  test('handles empty page responses gracefully', async ({ page }) => {
    await page.route('**/api/articles/today?limit=10&offset=0', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyPageResponse),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should fall back to mock data (per fallback logic)
    await expect(page.locator('article')).toHaveCount(3)
  })

  test('handles network errors during pagination', async ({ page }) => {
    // First page succeeds
    await page.route('**/api/articles/today?limit=10&offset=0', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firstPageResponse),
      })
    })

    // Second page fails
    await page.route('**/api/articles/today?limit=10&offset=10', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should have first page articles
    await expect(page.locator('article')).toHaveCount(2)

    // Trigger next page
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(1000)

    // Should show error message
    await expect(page.locator('text=Failed to load more')).toBeVisible()

    // Should show retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()

    // First page articles should still be visible
    await expect(page.locator('article')).toHaveCount(2)
  })

  test('retry button works after error', async ({ page }) => {
    let failCount = 0

    await page.route('**/api/articles/today?limit=10&offset=0', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firstPageResponse),
      })
    })

    await page.route('**/api/articles/today?limit=10&offset=10', async route => {
      failCount++
      if (failCount === 1) {
        // First attempt fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        })
      } else {
        // Retry succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(secondPageResponse),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Trigger error
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)
    await expect(page.locator('text=Failed to load more')).toBeVisible()

    // Click retry
    await page.locator('button:has-text("Retry")').click()
    await page.waitForTimeout(1000)

    // Should now have 4 articles
    await expect(page.locator('article')).toHaveCount(4)
    await expect(page.locator('text=Failed to load more')).not.toBeVisible()
  })

  test('resets pagination on refresh', async ({ page }) => {
    let refreshCalled = false

    await page.route('**/api/articles/today**', async route => {
      const url = route.request().url()

      if (url.includes('offset=0')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstPageResponse),
        })
      } else if (url.includes('offset=10')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(secondPageResponse),
        })
      }
    })

    await page.route('**/api/refresh', async route => {
      if (route.request().method() === 'POST') {
        refreshCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Refresh complete',
            stats: {
              articlesProcessed: 25,
              articlesSaved: 20,
              duration: '15.32s',
            },
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

    // Load second page
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForFunction(() => document.querySelectorAll('article').length >= 4, { timeout: 5000 })
    await expect(page.locator('article')).toHaveCount(4)

    // Click refresh - it calls window.location.reload()
    const navigationPromise = page.waitForURL(page.url())
    await page.locator('button:has-text("Refresh")').click()
    await navigationPromise
    await page.waitForLoadState('networkidle')

    expect(refreshCalled).toBe(true)

    // Should reload first page
    await expect(page.locator('article')).toHaveCount(2)
  })

  test('does not load more while refreshing', async ({ page }) => {
    let pageFetchCount = 0

    await page.route('**/api/articles/today**', async route => {
      const url = route.request().url()
      if (!url.includes('limit=10&offset=0')) {
        pageFetchCount++
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(firstPageResponse),
      })
    })

    await page.route('**/api/refresh', async route => {
      if (route.request().method() === 'POST') {
        // Long refresh
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Refresh complete',
            stats: { articlesProcessed: 25, articlesSaved: 20, duration: '15s' },
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
    pageFetchCount = 0 // Reset after initial load

    // Start refresh (don't wait for navigation since we're not testing the reload)
    await page.locator('button:has-text("Refresh")').click()
    await page.waitForTimeout(200)

    // Try to load more while refreshing
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForTimeout(500)

    // Should not have triggered additional page loads (isRefreshing blocks it)
    expect(pageFetchCount).toBe(0)
  })

  test('preserves sections across pagination', async ({ page }) => {
    await page.route('**/api/articles/today**', async route => {
      const url = route.request().url()

      if (url.includes('offset=0')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(firstPageResponse),
        })
      } else if (url.includes('offset=10')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(secondPageResponse),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // First page should have sections
    await expect(page.locator('section').filter({ hasText: 'Critical & Breaking' })).toBeVisible()

    // Load second page
    await page.evaluate(() => (window as any).__loadMore())
    await page.waitForFunction(() => document.querySelectorAll('article').length >= 4, { timeout: 5000 })

    // Should still have correct sections
    await expect(page.locator('section').filter({ hasText: 'Critical & Breaking' })).toBeVisible()
    await expect(page.locator('section').filter({ hasText: 'New & Noteworthy' })).toBeVisible()
  })
})
