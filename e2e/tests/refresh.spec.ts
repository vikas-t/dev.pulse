import { test, expect } from '@playwright/test'
import {
  mockArticlesResponse,
  refreshStatusCanRefresh,
  refreshStatusRateLimited,
  refreshSuccessResponse,
  refreshRateLimitedResponse,
  refreshErrorResponse,
} from '../fixtures/mock-data'

test.describe('Refresh Button', () => {
  test.describe('when refresh is available', () => {
    test.beforeEach(async ({ page }) => {
      // Mock articles API
      await page.route('**/api/articles/today*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockArticlesResponse),
        })
      })

      // Mock refresh status - can refresh
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

    test('displays refresh button in header', async ({ page }) => {
      await page.goto('/')

      const refreshButton = page.locator('button', { hasText: 'Refresh' })
      await expect(refreshButton).toBeVisible()
    })

    test('refresh button is enabled when refresh is available', async ({ page }) => {
      await page.goto('/')

      const refreshButton = page.locator('button', { hasText: 'Refresh' })
      await expect(refreshButton).toBeEnabled()
    })

    test('shows loading state when refresh is clicked', async ({ page }) => {
      // Mock POST to take some time
      await page.route('**/api/refresh', async route => {
        if (route.request().method() === 'POST') {
          // Delay response to see loading state
          await new Promise(resolve => setTimeout(resolve, 500))
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(refreshSuccessResponse),
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

      const refreshButton = page.locator('button', { hasText: 'Refresh' })
      await refreshButton.click()

      // Should show "Refreshing..." text
      await expect(page.locator('button', { hasText: 'Refreshing...' })).toBeVisible()
    })

    test('calls refresh API when button is clicked', async ({ page }) => {
      let postCalled = false

      await page.route('**/api/refresh', async route => {
        if (route.request().method() === 'POST') {
          postCalled = true
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(refreshSuccessResponse),
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

      const refreshButton = page.locator('button', { hasText: 'Refresh' })

      // Override the reload behavior for testing
      await page.evaluate(() => {
        window.location.reload = () => {}
      })

      await refreshButton.click()

      // Wait for the POST to be called
      await page.waitForTimeout(1000)

      // Verify POST was called
      expect(postCalled).toBe(true)
    })
  })

  test.describe('when rate limited', () => {
    test.beforeEach(async ({ page }) => {
      // Mock articles API
      await page.route('**/api/articles/today*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockArticlesResponse),
        })
      })

      // Mock refresh status - rate limited
      await page.route('**/api/refresh', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(refreshStatusRateLimited),
          })
        } else if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(refreshRateLimitedResponse),
          })
        }
      })
    })

    test('refresh button is disabled when rate limited', async ({ page }) => {
      await page.goto('/')

      const refreshButton = page.locator('button', { hasText: 'Refresh' })
      await expect(refreshButton).toBeDisabled()
    })

    test('shows next refresh time when rate limited', async ({ page }) => {
      await page.goto('/')

      // Should show "Next refresh:" text
      await expect(page.locator('text=Next refresh:')).toBeVisible()
    })
  })

  test.describe('error handling', () => {
    test('shows error message when refresh fails', async ({ page }) => {
      // Mock articles API
      await page.route('**/api/articles/today*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockArticlesResponse),
        })
      })

      // Mock refresh - success on GET, error on POST
      await page.route('**/api/refresh', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(refreshStatusCanRefresh),
          })
        } else if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify(refreshErrorResponse),
          })
        }
      })

      await page.goto('/')

      const refreshButton = page.locator('button', { hasText: 'Refresh' })
      await refreshButton.click()

      // Should show error message
      await expect(page.locator('text=Refresh failed')).toBeVisible({ timeout: 5000 })
    })

    test('shows rate limit message when already refreshed', async ({ page }) => {
      // Mock articles API
      await page.route('**/api/articles/today*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockArticlesResponse),
        })
      })

      let getCount = 0

      // Mock refresh - first GET returns canRefresh, POST returns rateLimited
      await page.route('**/api/refresh', async route => {
        if (route.request().method() === 'GET') {
          getCount++
          // First GET: can refresh, subsequent: rate limited
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(getCount === 1 ? refreshStatusCanRefresh : refreshStatusRateLimited),
          })
        } else if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(refreshRateLimitedResponse),
          })
        }
      })

      await page.goto('/')

      const refreshButton = page.locator('button', { hasText: 'Refresh' })
      await refreshButton.click()

      // Should show rate limit message
      await expect(page.locator('text=Already refreshed today')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('refresh button styling', () => {
    test('has sync icon', async ({ page }) => {
      await page.route('**/api/articles/today*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockArticlesResponse),
        })
      })

      await page.route('**/api/refresh', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(refreshStatusCanRefresh),
        })
      })

      await page.goto('/')

      // Check that the refresh button contains an SVG icon
      const refreshButton = page.locator('button', { hasText: 'Refresh' })
      const svg = refreshButton.locator('svg')
      await expect(svg).toBeVisible()
    })
  })
})
