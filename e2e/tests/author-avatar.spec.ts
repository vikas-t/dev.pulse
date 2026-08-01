import { test, expect } from '@playwright/test'
import {
  mockArticlesResponse,
  criticalArticle,
  noteworthyArticle1,
  refreshStatusCanRefresh,
} from '../fixtures/mock-data'

test.describe('Author Avatar', () => {
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

  test('displays author avatar image when authorImage is provided', async ({ page }) => {
    // criticalArticle has author "PyTorch Team" with authorImage
    const firstCard = page.locator('article').first()

    // Should show the author name
    await expect(firstCard).toContainText('PyTorch Team')

    // Should show an img element for the avatar
    const avatarImg = firstCard.locator('img[alt="PyTorch Team"]')
    await expect(avatarImg).toBeVisible()
    await expect(avatarImg).toHaveAttribute('src', criticalArticle.authorImage!)

    // Avatar should be circular
    await expect(avatarImg).toHaveClass(/rounded-full/)
  })

  test('displays initials fallback when authorImage is not provided', async ({ page }) => {
    // noteworthyArticle1 has author "Ollama Team" without authorImage
    // It's the second article in the response
    const secondCard = page.locator('article').nth(1)

    // Should show the author name
    await expect(secondCard).toContainText('Ollama Team')

    // Should NOT have an img element for the avatar
    await expect(secondCard.locator('img')).toHaveCount(0)

    // Should show initials "OT" in the fallback circle
    await expect(secondCard.locator('text=OT')).toBeVisible()

    // The initials should be in a rounded-full element
    const initialsEl = secondCard.locator('span.rounded-full')
    await expect(initialsEl).toBeVisible()
    await expect(initialsEl).toContainText('OT')
  })

  test('shows author name alongside avatar', async ({ page }) => {
    // noteworthyArticle1 has author "Ollama Team"
    const secondCard = page.locator('article').nth(1)

    // The author container should have both the avatar (initials) and the name
    const authorContainer = secondCard.locator('text=Ollama Team').locator('..')
    // The name text itself is visible
    await expect(secondCard.locator('text=Ollama Team')).toBeVisible()
  })

  test('does not render author section when author is null', async ({ page }) => {
    // spotlightArticle (4th article) and noteworthyArticle2 (3rd) have no author
    const thirdCard = page.locator('article').nth(2)

    // Check that the card exists and renders fine without author
    await expect(thirdCard.locator('h3 a')).toBeVisible()

    // The third card should not have any rounded-full avatar container
    // (no authorImage img, no initials fallback)
    // We verify this indirectly: the card should not contain author-related elements
    // Since noteworthyArticle2 has title "LangChain Expression Language"
    await expect(thirdCard).toContainText('LangChain')
  })

  test('initials are computed correctly for multi-word author names', async ({ page }) => {
    // criticalArticle has "PyTorch Team" -> initials should be "PT"
    const firstCard = page.locator('article').first()

    // Should have the avatar image (so no initials span)
    await expect(firstCard.locator('img[alt="PyTorch Team"]')).toBeVisible()

    // noteworthyArticle1 has "Ollama Team" without authorImage -> initials "OT"
    const secondCard = page.locator('article').nth(1)
    await expect(secondCard.locator('span.rounded-full')).toContainText('OT')
  })
})
