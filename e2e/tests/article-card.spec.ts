import { test, expect } from '@playwright/test'
import { mockArticlesResponse, criticalArticle, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Article Card', () => {
  test.beforeEach(async ({ page }) => {
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

  test('displays article title as link', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Title should be visible and be a link
    const titleLink = firstCard.locator('h3 a')
    await expect(titleLink).toBeVisible()
    await expect(titleLink).toHaveAttribute('href', criticalArticle.url)
    await expect(titleLink).toHaveAttribute('target', '_blank')
  })

  test('displays category badge', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Should show category badge (Security for critical article)
    await expect(firstCard).toContainText('Security')
  })

  test('displays importance label', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Should show BREAKING label
    await expect(firstCard).toContainText('BREAKING')
  })

  test('displays emoji tags', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Should show emoji tags (critical article has 🔴 and 🔒)
    // Use .first() since 🔒 appears both in tags and category badge
    await expect(firstCard.locator('text=🔴').first()).toBeVisible()
    await expect(firstCard.locator('text=🔒').first()).toBeVisible()
  })

  test('displays summary bullets', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Should show summary points
    await expect(firstCard).toContainText(criticalArticle.summary[0])
  })

  test('displays tech stack tags', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Should show language tags (python)
    await expect(firstCard).toContainText('python')

    // Should show framework tags (pytorch)
    await expect(firstCard).toContainText('pytorch')
  })

  test('displays GitHub stars', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Should show GitHub repo and stars
    await expect(firstCard).toContainText('pytorch/pytorch')
    await expect(firstCard).toContainText('78,000')
  })

  test('expands card on "Show more" click', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Initially collapsed - should show "Show more"
    const expandButton = firstCard.locator('button', { hasText: 'Show more' })
    await expect(expandButton).toBeVisible()

    // Click to expand
    await expandButton.click()

    // Should now show "Show less"
    await expect(firstCard.locator('button', { hasText: 'Show less' })).toBeVisible()

    // Should show expanded content (code example)
    await expect(firstCard).toContainText('Quick Start')
  })

  test('collapses card on "Show less" click', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand first
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // Now collapse
    await firstCard.locator('button', { hasText: 'Show less' }).click()

    // Should be back to collapsed state
    await expect(firstCard.locator('button', { hasText: 'Show more' })).toBeVisible()
  })

  test('displays install command when available', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Install command should be visible (critical article has one)
    await expect(firstCard).toContainText('pip install torch>=2.2.0')
  })

  test('displays insight when expanded', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand the card
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // Should show insight section
    await expect(firstCard).toContainText('Why It Matters')
    await expect(firstCard).toContainText(criticalArticle.insight!)
  })

  test('displays View Source link when expanded', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand the card
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // Should have View Source link
    const viewSourceLink = firstCard.locator('a', { hasText: 'View Source' })
    await expect(viewSourceLink).toBeVisible()
    await expect(viewSourceLink).toHaveAttribute('href', criticalArticle.url)
  })

  test('displays GitHub link when repo is available', async ({ page }) => {
    const firstCard = page.locator('article').first()

    // Expand the card
    await firstCard.locator('button', { hasText: 'Show more' }).click()

    // Should have GitHub link
    const githubLink = firstCard.locator('a', { hasText: 'GitHub' })
    await expect(githubLink).toBeVisible()
    await expect(githubLink).toHaveAttribute('href', `https://github.com/${criticalArticle.githubRepo}`)
  })
})
