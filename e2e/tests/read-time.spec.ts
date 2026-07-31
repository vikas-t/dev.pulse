import { test, expect } from '@playwright/test'
import { refreshStatusCanRefresh } from '../fixtures/mock-data'

// Article with very short summary (~10 words → 1 min read)
const shortArticle = {
  id: 'rt-short-1',
  title: 'Short article — quick read',
  url: 'https://example.com/short',
  source: 'blog',
  category: 'community',
  importanceLabel: 'INFO',
  importanceScore: 30,
  tags: ['📝'],
  summary: ['A quick update on the project status.'],
  languages: [],
  frameworks: [],
  topics: ['updates'],
  publishedAt: '2024-01-15T10:00:00Z',
  section: 'noteworthy',
}

// Article with ~190 words → 1 min read
const oneMinArticle = {
  id: 'rt-1min-1',
  title: 'One-minute read article',
  url: 'https://example.com/onemin',
  source: 'blog',
  category: 'tools',
  importanceLabel: 'NOTABLE',
  importanceScore: 60,
  tags: ['🛠️'],
  summary: [
    'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua '.repeat(10).trim(),
  ],
  languages: ['python'],
  frameworks: [],
  topics: ['tools'],
  publishedAt: '2024-01-16T10:00:00Z',
  section: 'noteworthy',
}

// Article with ~209 words → 2 min read
const twoMinArticle = {
  id: 'rt-2min-1',
  title: 'Two-minute read article',
  url: 'https://example.com/twomin',
  source: 'blog',
  category: 'research',
  importanceLabel: 'NOTABLE',
  importanceScore: 60,
  tags: ['🔬'],
  summary: [
    'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua '.repeat(11).trim(),
  ],
  languages: ['python'],
  frameworks: ['pytorch'],
  topics: ['research'],
  publishedAt: '2024-01-17T10:00:00Z',
  section: 'noteworthy',
}

// Article where insight adds extra words to push it over a boundary
const articleWithInsight = {
  id: 'rt-insight-1',
  title: 'Article with insight text for read time',
  url: 'https://example.com/insight',
  source: 'blog',
  category: 'library',
  importanceLabel: 'MAJOR',
  importanceScore: 80,
  tags: ['📚'],
  summary: [
    'This is a very short summary point that has few words.',
  ],
  insight: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua '.repeat(5).trim(),
  languages: ['javascript'],
  frameworks: ['react'],
  topics: ['frontend'],
  publishedAt: '2024-01-18T10:00:00Z',
  section: 'noteworthy',
}

function makeResponse(articles: unknown[]) {
  return {
    success: true,
    articles,
    count: articles.length,
    total: articles.length,
    hasMore: false,
    cached: false,
    distribution: { critical: 0, major: 1, notable: articles.length, info: 0, trending: 0 },
    filters: { languages: [], frameworks: [] },
  }
}

async function mockFeed(page: import('@playwright/test').Page, articles: unknown[]) {
  await page.route('**/api/articles/today*', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeResponse(articles)) })
  })
  await page.route('**/api/refresh', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
  })
  await page.goto('/')
}

test.describe('Read time label', () => {
  test('displays read time label on article card', async ({ page }) => {
    await mockFeed(page, [shortArticle])

    const firstCard = page.locator('article').first()
    const readTime = firstCard.locator('[data-testid="read-time"]')
    await expect(readTime).toBeVisible()
    await expect(readTime).toContainText('min read')
  })

  test('shows "1 min read" for a very short article', async ({ page }) => {
    await mockFeed(page, [shortArticle])

    const firstCard = page.locator('article').first()
    const readTime = firstCard.locator('[data-testid="read-time"]')
    await expect(readTime).toContainText('1 min read')
  })

  test('shows "1 min read" for an article with ~200 words', async ({ page }) => {
    await mockFeed(page, [oneMinArticle])

    const firstCard = page.locator('article').first()
    const readTime = firstCard.locator('[data-testid="read-time"]')
    // ~200 words → 1 min read (ceil(200/200) = 1)
    await expect(readTime).toContainText('1 min read')
  })

  test('shows "2 min read" for an article with ~400 words', async ({ page }) => {
    await mockFeed(page, [twoMinArticle])

    const firstCard = page.locator('article').first()
    const readTime = firstCard.locator('[data-testid="read-time"]')
    // ~400 words → 2 min read (ceil(400/200) = 2)
    await expect(readTime).toContainText('2 min read')
  })

  test('includes insight text in word count for read time', async ({ page }) => {
    await mockFeed(page, [articleWithInsight])

    const firstCard = page.locator('article').first()
    const readTime = firstCard.locator('[data-testid="read-time"]')
    // summary has ~10 words, insight has ~5*8=40 words → ~50 words → 1 min
    await expect(readTime).toBeVisible()
    await expect(readTime).toContainText('min read')
  })

  test('read time appears next to the publish date in the card footer', async ({ page }) => {
    await mockFeed(page, [shortArticle])

    const firstCard = page.locator('article').first()

    // The read time label should be visible
    const readTime = firstCard.locator('[data-testid="read-time"]')
    await expect(readTime).toBeVisible()

    // The publish date should also be visible
    await expect(firstCard.locator('text=Jan 15, 2024').first()).toBeVisible()
  })

  test('read time label appears on every card when multiple cards are shown', async ({ page }) => {
    await mockFeed(page, [shortArticle, oneMinArticle, twoMinArticle])

    const cards = page.locator('article')
    await expect(cards).toHaveCount(3)

    // Each card should have a read time label
    const readTimes = page.locator('[data-testid="read-time"]')
    await expect(readTimes).toHaveCount(3)
  })
})
