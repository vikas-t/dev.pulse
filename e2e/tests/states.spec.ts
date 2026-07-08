import { test, expect } from '@playwright/test'
import { emptyArticlesResponse, errorArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

// Helper to mock refresh API
const mockRefreshApi = async (page: any) => {
  await page.route('**/api/refresh', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(refreshStatusCanRefresh),
    })
  })
}

test.describe('Loading State', () => {
  test('shows loading skeleton initially', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    // Delay the API response to see loading state
    await page.route('**/api/articles/today*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, articles: [], count: 0 }),
      })
    })

    await page.goto('/')

    // Should show loading skeleton with animate-pulse class
    const loadingSkeleton = page.locator('.animate-pulse')
    await expect(loadingSkeleton).toBeVisible()

    // Should show placeholder cards
    const placeholderCards = page.locator('.animate-pulse .bg-zinc-900')
    await expect(placeholderCards.first()).toBeVisible()
  })

  test('loading skeleton disappears after load', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, articles: [], count: 0 }),
      })
    })

    await page.goto('/')

    // Wait for loading to complete
    await page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 5000 })

    // Loading skeleton should be gone
    await expect(page.locator('.animate-pulse')).not.toBeVisible()
  })
})

test.describe('Empty State', () => {
  test.beforeEach(async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyArticlesResponse),
      })
    })
  })

  test('shows empty state when API returns no articles', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('text=No articles yet')).toBeVisible()

    // No article cards rendered
    const articleCards = page.locator('article')
    await expect(articleCards).toHaveCount(0)
  })

  test('header displays correctly with empty feed', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toContainText('dev.pulse')
  })
})

test.describe('Error State', () => {
  test('shows error state with retry on API error', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    // Return error response
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(errorArticlesResponse),
      })
    })

    await page.goto('/')

    // Should show error state instead of fake content
    await expect(page.locator("text=Couldn't load articles")).toBeVisible()
    await expect(page.locator('button', { hasText: 'Retry' })).toBeVisible()

    const articleCards = page.locator('article')
    await expect(articleCards).toHaveCount(0)
  })

  test('shows error state on network failure', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    // Abort the request to simulate network failure
    await page.route('**/api/articles/today*', async route => {
      await route.abort('failed')
    })

    await page.goto('/')

    await expect(page.locator("text=Couldn't load articles")).toBeVisible()
  })

  test('retry button refetches articles after failure', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    let requestCount = 0
    await page.route('**/api/articles/today*', async route => {
      requestCount++
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify(errorArticlesResponse),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(emptyArticlesResponse),
        })
      }
    })

    await page.goto('/')

    await expect(page.locator("text=Couldn't load articles")).toBeVisible()
    await page.locator('button', { hasText: 'Retry' }).click()

    // After retry, error is gone and empty state shows
    await expect(page.locator('text=No articles yet')).toBeVisible()
  })

  test('header still displays on error', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(errorArticlesResponse),
      })
    })

    await page.goto('/')

    // Header should still be visible
    await expect(page.locator('h1')).toContainText('dev.pulse')
  })
})

test.describe('Section Visibility', () => {
  test('hides Critical section when no critical articles', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          articles: [
            {
              id: '1',
              title: 'Test Article',
              url: 'https://example.com',
              source: 'blog',
              category: 'library',
              importanceLabel: 'MAJOR',
              importanceScore: 75,
              tags: [],
              summary: ['Test summary'],
              languages: [],
              frameworks: [],
              topics: [],
              publishedAt: '2024-01-10T10:00:00Z',
              section: 'noteworthy',
            },
          ],
          count: 1,
        }),
      })
    })

    await page.goto('/')

    // Critical section should not be visible
    await expect(page.locator('text=Critical & Breaking')).not.toBeVisible()

    // Noteworthy section should be visible
    await expect(page.locator('text=New & Noteworthy')).toBeVisible()
  })

  test('hides Spotlight section when no trending articles', async ({ page }) => {
    // Mock refresh API
    await mockRefreshApi(page)

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          articles: [
            {
              id: '1',
              title: 'Test Article',
              url: 'https://example.com',
              source: 'blog',
              category: 'library',
              importanceLabel: 'BREAKING',
              importanceScore: 98,
              tags: [],
              summary: ['Test summary'],
              languages: [],
              frameworks: [],
              topics: [],
              publishedAt: '2024-01-10T10:00:00Z',
              section: 'critical',
            },
          ],
          count: 1,
        }),
      })
    })

    await page.goto('/')

    // Spotlight section should not be visible
    await expect(page.locator('text=GitHub Spotlight')).not.toBeVisible()

    // Critical section should be visible
    await expect(page.locator('text=Critical & Breaking')).toBeVisible()
  })
})
