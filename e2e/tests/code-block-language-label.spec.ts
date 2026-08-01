import { test, expect } from '@playwright/test'
import { mockArticlesResponse, criticalArticle, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('CodeBlock — language label', () => {
  test.beforeEach(async ({ page }) => {
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
  })

  test('shows language label on install command code block', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // The critical article has an install command with codeLanguage 'python'
    // The code block header bar should show 'python'
    const codeBlockHeader = firstCard.locator('.flex.items-center.justify-between.bg-zinc-800', { hasText: 'python' })
    await expect(codeBlockHeader).toBeVisible()

    // The language label should be inside the header bar
    const langLabel = codeBlockHeader.locator('span.text-xs.text-zinc-400.font-mono')
    await expect(langLabel).toContainText('python')
  })

  test('shows language label on expanded code example', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand the card to reveal code example
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // The Quick Start heading should be visible
    const quickStartHeading = firstCard.locator('h4', { hasText: 'Quick Start' })
    await expect(quickStartHeading).toBeVisible()

    // There are now two code blocks in this card (install command + code example),
    // both with language 'python'. The second one is the expanded Quick Start one.
    const codeBlockHeaders = firstCard.locator('.flex.items-center.justify-between.bg-zinc-800', { hasText: 'python' })
    await expect(codeBlockHeaders).toHaveCount(2)
    // The second header belongs to the expanded code example
    await expect(codeBlockHeaders.nth(1)).toBeVisible()
  })

  test('copy button is visible in code block header', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // The install command code block should have a Copy button in its header
    const codeBlockHeader = firstCard.locator('.flex.items-center.justify-between.bg-zinc-800').first()
    const copyButton = codeBlockHeader.locator('button', { hasText: 'Copy' })
    await expect(copyButton).toBeVisible()
  })

  test('copy button shows "Copied!" after click', async ({ page }) => {
    // Grant clipboard write permission for headless browser
    await page.context().grantPermissions(['clipboard-write'])

    const firstCard = page.locator('article').first()

    const copyButton = firstCard.locator('button', { hasText: 'Copy' }).first()
    await copyButton.click()

    // Should show "Copied!" briefly after successful copy
    await expect(firstCard.locator('button', { hasText: 'Copied!' })).toBeVisible({ timeout: 5000 })
  })

  test('language label uses default "bash" when no codeLanguage is provided', async ({ page }) => {
    // criticalArticle with codeLanguage set to null and installCommand provided
    // The CodeBlock should fall back to the default 'bash' language label
    const articleWithoutCodeLanguage = {
      ...criticalArticle,
      id: 'test-no-lang',
      codeLanguage: null,
      installCommand: 'npm install some-package',
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          articles: [articleWithoutCodeLanguage],
          count: 1,
          total: 1,
          hasMore: false,
          cached: false,
          distribution: { critical: 1, major: 0, notable: 0, info: 0, trending: 0 },
          filters: { languages: [], frameworks: [] },
        }),
      })
    })

    await page.goto('/')

    // Should default to 'bash' label
    const codeBlockHeader = page.locator('.flex.items-center.justify-between.bg-zinc-800', { hasText: 'bash' })
    await expect(codeBlockHeader).toBeVisible()
  })
})
