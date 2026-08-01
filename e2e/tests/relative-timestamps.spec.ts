import { test, expect } from '@playwright/test'
import { refreshStatusCanRefresh } from '../fixtures/mock-data'

/**
 * E2E tests for relative timestamp display on article cards.
 *
 * Creates mock articles with recent publish dates so that formatArticleDate
 * produces relative labels like "3 hours ago" instead of absolute dates.
 */

function makeRecentArticle(minutesAgo: number) {
  const publishedAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
  return {
    id: `recent-${minutesAgo}m`,
    title: `Recent Test Article (${minutesAgo}m)`,
    url: `https://example.com/recent-${minutesAgo}`,
    source: 'test',
    category: 'community',
    importanceLabel: 'NOTABLE',
    importanceScore: 60,
    tags: ['💬'],
    summary: ['A recently published article for timestamp testing'],
    languages: ['typescript'],
    frameworks: [],
    topics: ['testing'],
    publishedAt,
    section: 'noteworthy',
  }
}

function makeRecentArticleHoursAgo(hoursAgo: number) {
  const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
  return {
    id: `recent-${hoursAgo}h`,
    title: `Recent Test Article (${hoursAgo}h)`,
    url: `https://example.com/recent-${hoursAgo}h`,
    source: 'test',
    category: 'community',
    importanceLabel: 'NOTABLE',
    importanceScore: 60,
    tags: ['💬'],
    summary: ['A recently published article for timestamp testing'],
    languages: ['typescript'],
    frameworks: [],
    topics: ['testing'],
    publishedAt,
    section: 'noteworthy',
  }
}

test.describe('Relative Timestamps on Cards', () => {
  test('shows relative timestamp for a recent article (hours ago)', async ({ page }) => {
    const article = makeRecentArticleHoursAgo(3)

    const mockResponse = {
      success: true,
      articles: [article],
      count: 1,
      total: 1,
      hasMore: false,
      cached: false,
      distribution: { critical: 0, major: 0, notable: 1, info: 0, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
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

    // The date display should contain "hours ago" (relative timestamp)
    const card = page.locator('article').first()
    const dateText = card.locator('text=/\\d+ hours? ago/')
    await expect(dateText).toBeVisible()
  })

  test('shows relative timestamp for a very recent article (minutes ago)', async ({ page }) => {
    const article = makeRecentArticle(25)

    const mockResponse = {
      success: true,
      articles: [article],
      count: 1,
      total: 1,
      hasMore: false,
      cached: false,
      distribution: { critical: 0, major: 0, notable: 1, info: 0, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
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

    // The date display should contain "minutes ago"
    const card = page.locator('article').first()
    const dateText = card.locator('text=/\\d+ minutes? ago/')
    await expect(dateText).toBeVisible()
  })

  test('shows absolute date for older articles', async ({ page }) => {
    // An article from months ago should show an absolute date like "Jan 15, 2024"
    const oldArticle = {
      id: 'old-1',
      title: 'Old Article',
      url: 'https://example.com/old',
      source: 'test',
      category: 'community',
      importanceLabel: 'INFO',
      importanceScore: 45,
      tags: [],
      summary: ['An old article'],
      languages: ['javascript'],
      frameworks: [],
      topics: ['testing'],
      publishedAt: '2024-01-15T10:00:00Z',
      section: 'noteworthy',
    }

    const mockResponse = {
      success: true,
      articles: [oldArticle],
      count: 1,
      total: 1,
      hasMore: false,
      cached: false,
      distribution: { critical: 0, major: 0, notable: 0, info: 1, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
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

    // Should show an absolute date like "Jan 15, 2024"
    const card = page.locator('article').first()
    await expect(card).toContainText('Jan 15, 2024')
  })

  test('shows "just now" for an article published seconds ago', async ({ page }) => {
    const article = makeRecentArticle(0) // 0 minutes ago = now

    const mockResponse = {
      success: true,
      articles: [article],
      count: 1,
      total: 1,
      hasMore: false,
      cached: false,
      distribution: { critical: 0, major: 0, notable: 1, info: 0, trending: 0 },
      filters: { languages: [], frameworks: [] },
    }

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
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

    // Should show "just now"
    const card = page.locator('article').first()
    await expect(card).toContainText('just now')
  })
})
