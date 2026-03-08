import { test, expect } from '@playwright/test'
import {
  verifiedArticle,
  unverifiedArticle,
  suspiciousArticle,
  refreshStatusCanRefresh,
} from '../fixtures/mock-data'

function makeResponse(articles: typeof verifiedArticle[]) {
  return {
    success: true,
    articles,
    count: articles.length,
    total: articles.length,
    hasMore: false,
    cached: false,
    distribution: { critical: 0, major: 1, notable: articles.length - 1, info: 0, trending: 0 },
    filters: { languages: [], frameworks: [] },
  }
}

test.describe('Validation — VERIFIED article', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeResponse([verifiedArticle])) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })
    await page.goto('/')
  })

  test('does not show warning badge for verified article', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).not.toContainText('Unverified')
    await expect(card).not.toContainText('Suspicious')
    await expect(card).not.toContainText('⚠️')
  })

  test('displays article normally', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).toContainText(verifiedArticle.title)
    await expect(card).toContainText('MAJOR')
  })
})

test.describe('Validation — UNVERIFIED article', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeResponse([unverifiedArticle])) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })
    await page.goto('/')
  })

  test('shows Unverified warning badge', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).toContainText('⚠️')
    await expect(card).toContainText('Unverified')
  })

  test('does not show Suspicious badge', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).not.toContainText('Suspicious')
  })

  test('still displays article title and content', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).toContainText(unverifiedArticle.title)
  })
})

test.describe('Validation — SUSPICIOUS article', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeResponse([suspiciousArticle])) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })
    await page.goto('/')
  })

  test('shows Suspicious warning badge', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).toContainText('⚠️')
    await expect(card).toContainText('Suspicious')
  })

  test('does not show Unverified badge for suspicious article', async ({ page }) => {
    const card = page.locator('article').first()
    // Check the badge element specifically — the word "Unverified" may appear in summary bullets
    await expect(card.locator('span', { hasText: '⚠️ Unverified' })).toHaveCount(0)
  })

  test('still displays article title', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).toContainText(suspiciousArticle.title)
  })
})

test.describe('Validation — mixed feed', () => {
  test('shows warning only on unverified/suspicious articles in mixed feed', async ({ page }) => {
    const response = {
      success: true,
      articles: [verifiedArticle, unverifiedArticle, suspiciousArticle],
      count: 3,
      total: 3,
      hasMore: false,
      cached: false,
      distribution: { critical: 0, major: 1, notable: 2, info: 0, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })

    await page.goto('/')

    const cards = page.locator('article')
    await expect(cards).toHaveCount(3)

    // First card (verified) — no warning
    await expect(cards.nth(0)).not.toContainText('Unverified')
    await expect(cards.nth(0)).not.toContainText('Suspicious')

    // Second card (unverified) — shows Unverified
    await expect(cards.nth(1)).toContainText('Unverified')

    // Third card (suspicious) — shows Suspicious
    await expect(cards.nth(2)).toContainText('Suspicious')
  })
})
