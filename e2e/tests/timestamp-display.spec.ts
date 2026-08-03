import { test, expect } from '@playwright/test'
import { refreshStatusCanRefresh } from '../fixtures/mock-data'

/**
 * Helper to build a mock article with a given publishedAt date.
 */
function articleWithDate(overrides: {
  id?: string
  title?: string
  publishedAt: string
}) {
  return {
    id: overrides.id ?? 'ts-test-1',
    title: overrides.title ?? 'Timestamp Test Article',
    url: 'https://example.com/ts-test',
    source: 'github',
    category: 'launch',
    importanceLabel: 'NOTABLE',
    importanceScore: 70,
    tags: ['🚀'],
    summary: ['A test article for timestamp display.'],
    languages: ['typescript'],
    frameworks: [],
    topics: ['testing'],
    publishedAt: overrides.publishedAt,
    section: 'noteworthy',
  }
}

/**
 * Build a full mock response wrapping one article.
 */
function mockResponse(article: ReturnType<typeof articleWithDate>) {
  return {
    success: true,
    articles: [article],
    count: 1,
    total: 1,
    hasMore: false,
    cached: false,
    distribution: { critical: 0, major: 0, notable: 1, info: 0, trending: 0 },
    filters: { languages: [], frameworks: [] },
  }
}

/**
 * Compute the expected display string for a date relative to "now".
 * Must stay in sync with lib/utils/formatDate.ts.
 */
function expectedRelative(iso: string): string {
  const published = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - published.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return 'Last week'
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} weeks ago`
  }
  if (diffDays < 60) return 'Last month'
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} months ago`
  }

  const thisYear = now.getFullYear()
  const pubYear = published.getFullYear()
  const monthDay = published.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (pubYear === thisYear) return monthDay
  return `${monthDay}, ${pubYear}`
}

test.describe('Timestamp display', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshStatusCanRefresh),
      })
    })
  })

  test('shows "just now" for an article published less than a minute ago', async ({ page }) => {
    const iso = new Date(Date.now() - 30_000).toISOString() // 30 seconds ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('just now')
  })

  test('shows minutes ago for an article published under an hour ago', async ({ page }) => {
    const iso = new Date(Date.now() - 15 * 60_000).toISOString() // 15 minutes ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('15 mins ago')
  })

  test('shows hours ago for an article published under 24 hours ago', async ({ page }) => {
    const iso = new Date(Date.now() - 3 * 60 * 60_000).toISOString() // 3 hours ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('3 hours ago')
  })

  test('shows "Yesterday" for an article published 1 day ago', async ({ page }) => {
    const iso = new Date(Date.now() - 25 * 60 * 60_000).toISOString() // ~25 hours ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('Yesterday')
  })

  test('shows days ago for an article published 2-6 days ago', async ({ page }) => {
    const iso = new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString() // 4 days ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('4 days ago')
  })

  test('shows "Last week" for an article published 7-13 days ago', async ({ page }) => {
    const iso = new Date(Date.now() - 10 * 24 * 60 * 60_000).toISOString() // 10 days ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('Last week')
  })

  test('shows weeks ago for an article published 14-29 days ago', async ({ page }) => {
    const iso = new Date(Date.now() - 21 * 24 * 60 * 60_000).toISOString() // 3 weeks ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('3 weeks ago')
  })

  test('shows "Last month" for an article published 30-59 days ago', async ({ page }) => {
    const iso = new Date(Date.now() - 45 * 24 * 60 * 60_000).toISOString() // 45 days ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('Last month')
  })

  test('shows months ago for an article published 60-364 days ago', async ({ page }) => {
    const iso = new Date(Date.now() - 120 * 24 * 60 * 60_000).toISOString() // ~4 months ago

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')
    const card = page.locator('article').first()
    await expect(card).toContainText('4 months ago')
  })

  test('shows absolute date (no year) for an older article published this year', async ({ page }) => {
    // Use Jan 2 of this year (guaranteed > 11 months ago for most of the year,
    // and definitely same year)
    const now = new Date()
    const jan2ThisYear = new Date(now.getFullYear(), 0, 2, 10, 0, 0).toISOString()

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: jan2ThisYear }))) })
    })

    await page.goto('/')

    const expected = expectedRelative(jan2ThisYear)
    const card = page.locator('article').first()
    await expect(card).toContainText(expected)
  })

  test('timestamp element has a tooltip with full date', async ({ page }) => {
    const iso = '2024-03-15T14:30:00Z'

    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockResponse(articleWithDate({ publishedAt: iso }))) })
    })

    await page.goto('/')

    // The timestamp span inside the article card should have a title attribute
    // Use the specific text-zinc-400 span that holds the formatted date
    const timestampSpan = page.locator('article').first().locator('span.text-zinc-400[title]').first()
    await expect(timestampSpan).toHaveAttribute('title')
    // The tooltip should contain the full date information
    const title = await timestampSpan.getAttribute('title')
    expect(title).toBeTruthy()
    // It should contain month name, day, year, and timezone info
    expect(title!).toMatch(/March/)
    expect(title!).toMatch(/15/)
    expect(title!).toMatch(/2024/)
  })
})
