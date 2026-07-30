import { test, expect } from '@playwright/test'
import { mockArticlesResponse, criticalArticle, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Copy Button', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions so navigator.clipboard.writeText works
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])

    // Intercept clipboard API to track what gets copied — we DON'T call the real
    // writeText because it can fail in headless Playwright (no focused window).
    // Instead we fully mock it so copyToClipboard() returns true.
    await page.addInitScript(() => {
      // Store clipboard text globally for verification
      ;(window as any).__clipboardText = ''
      // Override writeText completely — don't call original since it may fail
      // in headless mode (no focused document for clipboard API)
      navigator.clipboard.writeText = async (text: string) => {
        ;(window as any).__clipboardText = text
        return Promise.resolve()
      }
    })

    // Mock the articles API
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticlesResponse),
      })
    })

    // Mock refresh status API
    await page.route('**/api/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshStatusCanRefresh),
      })
    })

    await page.goto('/')
  })

  test('shows copy button on install command code block', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Find the copy button inside the install command CodeBlock
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
  })

  test('copy button has accessible label', async ({ page }) => {
    const firstCard = page.locator('article').first()

    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
    await expect(copyButton).toHaveAttribute('aria-label', 'Copy to clipboard')
  })

  test('copy button shows checkmark after clicking', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Get the copy button
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()

    await copyButton.click()

    // After clicking, label changes to "Copied to clipboard"
    await expect(copyButton).toHaveAttribute('aria-label', 'Copied to clipboard')
  })

  test('copy button copies the correct code to clipboard', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Click copy
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await copyButton.click()

    // Retrieve what was copied
    const text = await page.evaluate(() => (window as any).__clipboardText)
    expect(text).toBe(criticalArticle.installCommand)
  })

  test('copy button returns to default state after timeout', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Click copy
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await copyButton.click()

    // Wait for checkmark state
    await expect(copyButton).toHaveAttribute('aria-label', 'Copied to clipboard')

    // Wait for the 2 second timeout to reset (with a small buffer)
    await page.waitForTimeout(2500)

    // Should be back to default
    await expect(copyButton).toHaveAttribute('aria-label', 'Copy to clipboard')
  })

  test('copy button appears on code example in expanded card', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand the card to see code example
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // When expanded there are two copy buttons (install command + code example)
    // Use .first() to avoid strict mode violation
    const copyButtons = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButtons.first()).toBeVisible()
    await expect(copyButtons).toHaveCount(2)
  })

  test('copy button has smooth CSS transitions', async ({ page }) => {
    const firstCard = page.locator('article').first()

    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')

    // Verify the button has transition classes applied
    await expect(copyButton).toHaveClass(/transition-all/)
    await expect(copyButton).toHaveClass(/duration-150/)
  })
})
