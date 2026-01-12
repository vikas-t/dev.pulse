import { test, expect } from '@playwright/test'
import { emptyArticlesResponse, errorArticlesResponse } from '../fixtures/mock-data'

test.describe('Loading State', () => {
  test('shows loading skeleton initially', async ({ page }) => {
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

test.describe('Empty API Response Fallback', () => {
  // Note: The app falls back to built-in MOCK_ARTICLES when API returns empty
  // This tests that behavior - the "empty state" UI is not reachable in practice

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyArticlesResponse),
      })
    })
  })

  test('falls back to mock data when API returns empty', async ({ page }) => {
    await page.goto('/')

    // Should fall back to built-in mock data (3 articles) rather than showing empty state
    const articleCards = page.locator('article')
    await expect(articleCards).toHaveCount(3)
  })

  test('shows mock article content when API returns empty', async ({ page }) => {
    await page.goto('/')

    // Should show the built-in mock article titles
    await expect(page.locator('text=Transformers 4.36.0')).toBeVisible()
  })

  test('header displays correctly with fallback data', async ({ page }) => {
    await page.goto('/')

    // Header should show correct count from fallback data
    await expect(page.locator('h1')).toContainText('dev.pulse')
    await expect(page.locator('header')).toContainText('3') // 3 mock articles
  })
})

test.describe('Error State', () => {
  test('falls back to mock data on API error', async ({ page }) => {
    // Return error response
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(errorArticlesResponse),
      })
    })

    await page.goto('/')

    // Should fall back to built-in mock data (3 articles)
    // The app has MOCK_ARTICLES with 3 items that it uses as fallback
    const articleCards = page.locator('article')
    await expect(articleCards).toHaveCount(3)

    // Should show the mock article titles
    await expect(page.locator('text=Transformers 4.36.0')).toBeVisible()
  })

  test('falls back to mock data on network failure', async ({ page }) => {
    // Abort the request to simulate network failure
    await page.route('**/api/articles/today*', async route => {
      await route.abort('failed')
    })

    await page.goto('/')

    // Should fall back to built-in mock data
    const articleCards = page.locator('article')
    await expect(articleCards).toHaveCount(3)
  })

  test('header still displays with fallback data', async ({ page }) => {
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
