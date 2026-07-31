import { test, expect } from '@playwright/test'
import { refreshStatusCanRefresh } from '../fixtures/mock-data'

const githubArticle = {
  id: 'info-source-1',
  title: 'Source badge test — GitHub article',
  url: 'https://github.com/example/repo',
  source: 'github',
  category: 'library',
  importanceLabel: 'MAJOR',
  importanceScore: 82,
  tags: ['🚀'],
  summary: ['First summary point for the source test'],
  insight: 'An insight.',
  languages: ['python'],
  frameworks: ['pytorch'],
  topics: ['ml', 'training'],
  githubRepo: 'example/repo',
  githubStars: 1200,
  publishedAt: '2024-02-01T10:00:00Z',
  section: 'noteworthy',
}

const blogArticle = {
  id: 'info-source-2',
  title: 'Source badge test — blog article',
  url: 'https://example.com/post',
  source: 'blog',
  category: 'community',
  importanceLabel: 'NOTABLE',
  importanceScore: 60,
  tags: ['📝'],
  summary: ['First summary point for the blog test'],
  languages: [],
  frameworks: [],
  topics: ['api'],
  author: 'Ada Lovelace',
  publishedAt: '2024-02-02T12:00:00Z',
  section: 'noteworthy',
}

const verifiedArticle = {
  id: 'info-verified-1',
  title: 'Verified badge test article',
  url: 'https://github.com/pytorch/pytorch/releases/tag/v2.3.0',
  source: 'github',
  category: 'launch',
  importanceLabel: 'MAJOR',
  importanceScore: 85,
  tags: ['🚀'],
  summary: ['Verified summary point'],
  languages: ['python'],
  frameworks: ['pytorch'],
  topics: ['ml'],
  validationLabel: 'VERIFIED',
  validationScore: 95,
  publishedAt: '2024-02-03T09:00:00Z',
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
    distribution: { critical: 0, major: 2, notable: articles.length - 1, info: 0, trending: 0 },
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

test.describe('Article card — informative metadata', () => {
  test('displays a source badge with a human-readable label', async ({ page }) => {
    await mockFeed(page, [githubArticle])

    const firstCard = page.locator('article').first()
    const sourceBadge = firstCard.locator('[data-testid="source-badge"]')
    await expect(sourceBadge).toBeVisible()
    await expect(sourceBadge).toContainText('GitHub')
    await expect(sourceBadge).toHaveAttribute('title', 'Source: GitHub')
  })

  test('shows the blog source label for blog articles', async ({ page }) => {
    await mockFeed(page, [blogArticle])

    const firstCard = page.locator('article').first()
    const sourceBadge = firstCard.locator('[data-testid="source-badge"]')
    await expect(sourceBadge).toContainText('Blog')
  })

  test('shows the author when present', async ({ page }) => {
    await mockFeed(page, [blogArticle])

    const firstCard = page.locator('article').first()
    const author = firstCard.locator('[data-testid="article-author"]')
    await expect(author).toBeVisible()
    await expect(author).toContainText('by Ada Lovelace')
  })

  test('does not show an author when none is present', async ({ page }) => {
    await mockFeed(page, [githubArticle])

    const firstCard = page.locator('article').first()
    await expect(firstCard.locator('[data-testid="article-author"]')).toHaveCount(0)
  })

  test('renders topic tags when present', async ({ page }) => {
    await mockFeed(page, [githubArticle])

    const firstCard = page.locator('article').first()
    const topicTags = firstCard.locator('[data-testid="topic-tags"]')
    await expect(topicTags).toBeVisible()
    await expect(topicTags).toContainText('#ml')
    await expect(topicTags).toContainText('#training')
  })

  test('shows a verified badge for VERIFIED articles', async ({ page }) => {
    await mockFeed(page, [verifiedArticle])

    const firstCard = page.locator('article').first()
    const verified = firstCard.locator('[data-testid="verified-badge"]')
    await expect(verified).toBeVisible()
    await expect(verified).toContainText('Verified')
  })

  test('does not show a verified badge for unvalidated articles', async ({ page }) => {
    await mockFeed(page, [blogArticle])

    const firstCard = page.locator('article').first()
    await expect(firstCard.locator('[data-testid="verified-badge"]')).toHaveCount(0)
  })
})
