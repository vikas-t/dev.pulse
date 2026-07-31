import { test, expect } from '@playwright/test'
import {
  mockArticlesResponse,
  criticalArticle,
  noteworthyArticle1,
  refreshStatusCanRefresh,
} from '../fixtures/mock-data'

test.describe('Code Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/today*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticlesResponse),
      })
    })

    await page.route('**/api/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshStatusCanRefresh),
      })
    })

    await page.goto('/')
  })

  test('displays code blocks with header bar', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // The code block wrapper should have the code-block class
    const codeBlock = firstCard.locator('.code-block')
    await expect(codeBlock.first()).toBeVisible()

    // The header bar should show the language
    const header = codeBlock.first().locator('.code-block-header')
    await expect(header).toBeVisible()
    // Critical article has installCommand with codeLanguage='python'
    await expect(header.locator('span').first()).toContainText('python')
  })

  test('displays copy button in code block header', async ({ page }) => {
    const firstCard = page.locator('article').first()
    const codeBlock = firstCard.locator('.code-block').first()

    // Copy button should be visible (always visible, not just on hover)
    const copyButton = codeBlock.locator('.code-block-copy')
    await expect(copyButton).toBeVisible()
    await expect(copyButton).toContainText('Copy')
  })

  test('copy button shows feedback after clicking', async ({ page }) => {
    // Grant clipboard permissions so copy actually works
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const firstCard = page.locator('article').first()
    const codeBlock = firstCard.locator('.code-block').first()
    const copyButton = codeBlock.locator('.code-block-copy')

    // Click the copy button
    await copyButton.click()

    // Should show "Copied" feedback
    await expect(copyButton).toContainText('✓ Copied')

    // After 2 seconds, should revert to "Copy"
    await expect(copyButton).toContainText('Copy')
  })

  test('code block in expanded view has header and copy button', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand the card to see the code example
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // Find the expanded code block (Quick Start section)
    const quickStartSection = firstCard.locator('div').filter({ hasText: 'Quick Start' })
    const expandedCodeBlock = quickStartSection.locator('.code-block')
    await expect(expandedCodeBlock).toBeVisible()

    // Should have its own copy button
    const expandedCopyButton = expandedCodeBlock.locator('.code-block-copy')
    await expect(expandedCopyButton).toBeVisible()
  })

  test('displays line numbers for multi-line code', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand the card
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // The expanded code example has multiple lines (3 lines)
    const quickStartSection = firstCard.locator('div').filter({ hasText: 'Quick Start' })
    const codeBlock = quickStartSection.locator('.code-block')

    // Should have line number elements
    const lineNumbers = codeBlock.locator('.code-block-line-number')
    const count = await lineNumbers.count()
    expect(count).toBeGreaterThanOrEqual(2) // Multi-line code should have line numbers
  })

  test('line numbers are sequential', async ({ page }) => {
    const firstCard = page.locator('article').first()
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    const quickStartSection = firstCard.locator('div').filter({ hasText: 'Quick Start' })
    const lineNumbers = quickStartSection.locator('.code-block-line-number')

    const first = await lineNumbers.first().textContent()
    const second = await lineNumbers.nth(1).textContent()
    expect(first).toBe('1')
    expect(second).toBe('2')
  })

  test('single-line install command does not show line numbers', async ({ page }) => {
    // The install command (pip install torch) is a single line
    const firstCard = page.locator('article').first()
    const installCodeBlock = firstCard.locator('.code-block').first()

    // Single-line code should not have line numbers
    const lineNumbers = installCodeBlock.locator('.code-block-line-number')
    await expect(lineNumbers).toHaveCount(0)
  })

  test('code block has max height with scroll for long code', async ({ page }) => {
    const firstCard = page.locator('article').first()
    const codeBlock = firstCard.locator('.code-block').first()

    // The scrollable area should have max-height set
    const scrollArea = codeBlock.locator('.overflow-auto')
    await expect(scrollArea).toBeVisible()

    // Check that it has a max-height style (via CSS or inline)
    const style = await scrollArea.getAttribute('style')
    expect(style).toContain('max-height')
  })

  test('code block has distinct dark background styling', async ({ page }) => {
    const firstCard = page.locator('article').first()
    const codeBlock = firstCard.locator('.code-block').first()

    // Code block should stand out from card background with darker bg
    // The code block uses bg-[#0d1117] which is darker than card's bg-zinc-900
    await expect(codeBlock).toBeVisible()
    await expect(codeBlock).toHaveClass(/bg-/)
  })
})

test.describe('Code Block - Article with multi-line install command', () => {
  test('shows line numbers for multi-line install commands', async ({ page }) => {
    // Create an article with a multi-line install command
    const articleWithMultiLineInstall = {
      ...criticalArticle,
      installCommand: 'pip install torch>=2.2.0\npip install torchvision\npip install torchaudio',
    }
    const response = {
      success: true,
      articles: [articleWithMultiLineInstall],
      count: 1,
      total: 1,
      hasMore: false,
      cached: false,
      distribution: { critical: 1, major: 0, notable: 0, info: 0, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    })
    await page.route('**/api/refresh', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })

    await page.goto('/')

    const codeBlock = page.locator('article').first().locator('.code-block').first()

    // Multi-line install command should show line numbers
    const lineNumbers = codeBlock.locator('.code-block-line-number')
    await expect(lineNumbers.first()).toBeVisible()
    const count = await lineNumbers.count()
    expect(count).toBe(3)
  })
})
