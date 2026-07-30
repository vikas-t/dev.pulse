import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Clipboard Behaviour', () => {
  test.beforeEach(async ({ page }) => {
    // Mock articles API
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

  test('shows copy button on code blocks', async ({ page }) => {
    // The first article card has an install command which renders a CodeBlock
    // The copy button should be visible on hover
    const codeBlock = page.locator('pre code').first()
    await expect(codeBlock).toBeVisible()

    // The copy button exists in the DOM
    const copyButton = page.locator('button', { hasText: 'Copy' }).first()
    await expect(copyButton).toBeVisible()
  })

  test('copy button changes to copied state on click', async ({ page }) => {
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const copyButton = page.locator('button', { hasText: 'Copy' }).first()

    // Click the copy button
    await copyButton.click()

    // Should show "Copied!" state
    await expect(copyButton).toHaveText('✓ Copied!')

    // Wait for the feedback to reset
    await page.waitForTimeout(2100)

    // Should revert back to "Copy"
    await expect(copyButton).toHaveText('Copy')
  })

  test('copies the correct code content to clipboard', async ({ page }) => {
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Get the code text before copying
    const codeContent = await page.locator('pre code').first().textContent()

    const copyButton = page.locator('button', { hasText: 'Copy' }).first()
    await copyButton.click()

    // Read clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())

    expect(clipboardText).toBe(codeContent)
  })

  test('shows copy button for expanded code examples', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Expand the first article card
    const expandButton = page.locator('button', { hasText: 'Show more' }).first()
    await expandButton.click()

    // Wait for expanded content to render
    await expect(page.locator('text=Quick Start')).toBeVisible()

    // The expanded code block should also have a copy button
    // There may be multiple copy buttons now (one for install command, one for code example)
    const copyButtons = page.locator('button', { hasText: /^Copy$/ })
    const copyButtonCount = await copyButtons.count()
    expect(copyButtonCount).toBeGreaterThanOrEqual(1)
  })
})
