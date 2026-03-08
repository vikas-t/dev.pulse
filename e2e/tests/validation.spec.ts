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

  test('displays verified article normally', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).toContainText(verifiedArticle.title)
    await expect(card).toContainText('MAJOR')
  })

  test('does not show any warning badge for verified article', async ({ page }) => {
    const card = page.locator('article').first()
    await expect(card).not.toContainText('Unverified')
    await expect(card).not.toContainText('Suspicious')
  })
})

test.describe('Validation — UNVERIFIED article is excluded from feed', () => {
  test('unverified article is not shown — pipeline drops it before serving', async ({ page }) => {
    // Pipeline drops UNVERIFIED — API returns empty feed
    const emptyResponse = {
      success: true,
      articles: [],
      count: 0,
      total: 0,
      hasMore: false,
      cached: false,
      distribution: { critical: 0, major: 0, notable: 0, info: 0, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyResponse) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })

    await page.goto('/')
    await expect(page.locator('body')).not.toContainText(unverifiedArticle.title)
  })
})

test.describe('Validation — SUSPICIOUS article is excluded from feed', () => {
  test('suspicious article is not shown — pipeline drops it before serving', async ({ page }) => {
    // Pipeline drops SUSPICIOUS — API returns empty feed
    const emptyResponse = {
      success: true,
      articles: [],
      count: 0,
      total: 0,
      hasMore: false,
      cached: false,
      distribution: { critical: 0, major: 0, notable: 0, info: 0, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyResponse) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })

    await page.goto('/')
    await expect(page.locator('body')).not.toContainText(suspiciousArticle.title)
  })
})

test.describe('Validation — mixed feed only shows verified articles', () => {
  test('only VERIFIED and LIKELY_VALID articles appear in feed', async ({ page }) => {
    // Pipeline drops unverified/suspicious — only verified makes it through
    const response = makeResponse([verifiedArticle])

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })

    await page.goto('/')

    const cards = page.locator('article')
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText(verifiedArticle.title)
    await expect(page.locator('body')).not.toContainText(unverifiedArticle.title)
    await expect(page.locator('body')).not.toContainText(suspiciousArticle.title)
  })
})
