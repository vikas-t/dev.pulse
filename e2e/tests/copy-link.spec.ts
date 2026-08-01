import { test, expect } from '@playwright/test'
import { mockArticlesResponse, criticalArticle, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Copy Link Button', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

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

  test('shows "Copy link" label by default', async ({ page }) => {
    const copyButton = page.getByLabel('Copy article link').first()

    await expect(copyButton).toBeVisible()
    await expect(copyButton).toHaveText('Copy link')
  })

  test('copies article URL to clipboard on click', async ({ page }) => {
    const copyButton = page.getByLabel('Copy article link').first()

    await copyButton.click()

    // Verify clipboard contains the article URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(criticalArticle.url)
  })

  test('shows "Copied!" feedback after copying', async ({ page }) => {
    const copyButton = page.getByLabel('Copy article link').first()

    await copyButton.click()

    // Should immediately show "Copied!"
    await expect(copyButton).toHaveText('Copied!')
  })

  test('reverts to "Copy link" after feedback timeout', async ({ page }) => {
    const copyButton = page.getByLabel('Copy article link').first()

    await copyButton.click()

    // Wait for the 2-second timeout to revert
    await expect(copyButton).toHaveText('Copy link', { timeout: 5000 })
  })

  test('copy link button appears on every article card', async ({ page }) => {
    const cards = page.locator('article')
    const count = await cards.count()

    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      await expect(card.getByLabel('Copy article link')).toBeVisible()
    }
  })
})
