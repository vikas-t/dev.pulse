import { test, expect } from '@playwright/test'
import {
  mockArticlesResponse,
  refreshStatusCanRefresh,
  refreshStatusWithLastRefresh,
  refreshSuccessResponse,
  refreshErrorResponse,
} from '../fixtures/mock-data'

test.describe('Refresh Button', () => {
  test.describe('basic behavior', () => {
    test.beforeEach(async ({ page }) => {
      // Mock articles API
      await page.route('**/api/articles/today*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockArticlesResponse),
        })
      })

      // Mock refresh status
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

    test('refresh button is always enabled', async ({ page }) => {
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
      await refreshButton.click()

      // Wait for the POST to be called
      await page.waitForTimeout(1000)

      // Verify POST was called
      expect(postCalled).toBe(true)
    })
  })

  test.describe('last updated label', () => {
    test('shows last updated time when available', async ({ page }) => {
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
          body: JSON.stringify(refreshStatusWithLastRefresh),
        })
      })

      await page.goto('/')

      await expect(page.locator('text=Last updated:')).toBeVisible()
    })

    test('hides last updated label when no data fetch has happened', async ({ page }) => {
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

      await expect(page.locator('text=Last updated:')).not.toBeVisible()
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
