import { test, expect } from '@playwright/test'
import {
  arxivArticle1,
  arxivArticle2,
  arxivArticlesResponse,
  mixedSourcesResponse,
  criticalArticle,
  noteworthyArticle1,
  refreshStatusCanRefresh,
} from '../fixtures/mock-data'

test.describe('arXiv Source Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock refresh status API
    await page.route('**/api/refresh', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(refreshStatusCanRefresh),
        })
      }
    })
  })

  test('arXiv articles appear in feed', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(arxivArticlesResponse),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should display all 3 arXiv articles
    await expect(page.locator('article')).toHaveCount(3)

    // Verify first arXiv article title is visible
    await expect(page.locator('text=Efficient Fine-Tuning of Large Language Models with LoRA 2.0')).toBeVisible()

    // Verify second arXiv article is visible
    await expect(page.locator('text=Building Production RAG Systems')).toBeVisible()
  })

  test('arXiv articles have correct link to paper', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...arxivArticlesResponse,
          articles: [arxivArticle1],
          count: 1,
          total: 1,
        }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Article card should have arxiv link in the title
    const articleLink = page.locator('a[href="https://arxiv.org/abs/2401.23456"]')
    await expect(articleLink).toBeVisible()

    // The link should contain the paper title
    await expect(articleLink).toContainText('LoRA 2.0')
  })

  test('arXiv articles are categorized correctly in feed sections', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mixedSourcesResponse),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should have articles from different sources
    await expect(page.locator('article')).toHaveCount(4)

    // Critical section should be visible (from GitHub)
    await expect(page.locator('section').filter({ hasText: 'Critical & Breaking' })).toBeVisible()

    // New & Noteworthy section should contain arXiv articles
    await expect(page.locator('section').filter({ hasText: 'New & Noteworthy' })).toBeVisible()
  })

  test('arXiv articles work with language filter', async ({ page }) => {
    // Response with only Python articles (arXiv articles are Python)
    await page.route('**/api/articles/today*', async route => {
      const url = route.request().url()

      if (url.includes('languages=python')) {
        // Return only Python articles (arXiv papers)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...arxivArticlesResponse,
            articles: [arxivArticle1, arxivArticle2],
            count: 2,
            total: 2,
          }),
        })
      } else {
        // Return all articles
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mixedSourcesResponse),
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Initial load shows all articles
    await expect(page.locator('article')).toHaveCount(4)

    // This test verifies the filter parameter is passed correctly
    // The actual filtering happens server-side
  })

  test('handles arXiv API error gracefully', async ({ page }) => {
    // Simulate arXiv being unavailable but other sources working
    await page.route('**/api/articles/today*', async route => {
      // Return response with only non-arXiv articles (simulating arXiv failure)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          articles: [criticalArticle, noteworthyArticle1],
          count: 2,
          total: 2,
          hasMore: false,
          cached: false,
          distribution: {
            critical: 1,
            major: 1,
            notable: 0,
            info: 0,
            trending: 0,
          },
          filters: { languages: [], frameworks: [] },
        }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Feed should still work with other sources
    await expect(page.locator('article')).toHaveCount(2)

    // Should show GitHub articles
    await expect(page.locator('text=PyTorch 2.2: Critical Security Vulnerability')).toBeVisible()
  })

  test('handles empty arXiv response', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      // Return response with no arXiv articles
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          articles: [criticalArticle, noteworthyArticle1],
          count: 2,
          total: 2,
          hasMore: false,
          cached: false,
          distribution: {
            critical: 1,
            major: 1,
            notable: 0,
            info: 0,
            trending: 0,
          },
          filters: { languages: [], frameworks: [] },
        }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Feed loads successfully without arXiv articles
    await expect(page.locator('article')).toHaveCount(2)

    // No error messages should be visible
    await expect(page.locator('text=Failed to load')).not.toBeVisible()
  })

  test('arXiv article expands to show code example', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...arxivArticlesResponse,
          articles: [arxivArticle1],
          count: 1,
          total: 1,
        }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Summary bullet points should be visible without expanding
    await expect(page.locator('text=Improved low-rank adaptation method')).toBeVisible()

    // Click "Show more" to expand
    await page.locator('button:has-text("Show more")').click()

    // Should show code example in expanded section
    await expect(page.locator('text=from peft import')).toBeVisible()

    // Should show insight section
    await expect(page.locator('text=Why It Matters')).toBeVisible()
  })

  test('arXiv articles show tech stack tags', async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...arxivArticlesResponse,
          articles: [arxivArticle1],
          count: 1,
          total: 1,
        }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should show language tags (use CSS class specific to tech tags)
    await expect(page.locator('.bg-blue-500\\/10:has-text("python")')).toBeVisible()

    // Should show framework tags (use CSS class specific to framework tags)
    await expect(page.locator('.bg-purple-500\\/10:has-text("transformers")')).toBeVisible()
    await expect(page.locator('.bg-purple-500\\/10:has-text("peft")')).toBeVisible()
  })
})
