import { test, expect } from '@playwright/test'
import { mockArticlesResponse, criticalArticle, noteworthyArticle1, noteworthyArticle2, refreshStatusCanRefresh } from '../fixtures/mock-data'

const STORAGE_KEY = 'pulse_saved_articles'

test.describe('Saved Articles — localStorage', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockArticlesResponse) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })
    await page.goto('/')
  })

  test('localStorage is empty on first visit', async ({ page }) => {
    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    // Either null (never set) or empty array
    if (stored !== null) {
      expect(JSON.parse(stored)).toEqual([])
    }
  })

  test('saving an article writes it to localStorage', async ({ page }) => {
    const firstCard = page.locator('article').first()
    await firstCard.locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    expect(stored).not.toBeNull()

    const parsed = JSON.parse(stored!)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(1)
    expect(parsed[0].id).toBe(criticalArticle.id)
    expect(parsed[0].title).toBe(criticalArticle.title)
    expect(parsed[0].url).toBe(criticalArticle.url)
    expect(parsed[0].savedAt).toBeTruthy()
  })

  test('saved article has all required fields in localStorage', async ({ page }) => {
    const firstCard = page.locator('article').first()
    await firstCard.locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    const parsed = JSON.parse(stored!)
    const saved = parsed[0]

    expect(saved.id).toBeTruthy()
    expect(saved.title).toBeTruthy()
    expect(saved.url).toBeTruthy()
    expect(saved.category).toBeTruthy()
    expect(saved.importanceLabel).toBeTruthy()
    expect(saved.source).toBeTruthy()
    expect(saved.publishedAt).toBeTruthy()
    expect(saved.savedAt).toBeTruthy()
  })

  test('unsaving an article removes it from localStorage', async ({ page }) => {
    // Save first
    const firstCard = page.locator('article').first()
    const saveBtn = firstCard.locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first()
    await saveBtn.click()

    // Verify it's saved
    const afterSave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)
    expect(afterSave.length).toBe(1)

    // Unsave (click again to toggle)
    await saveBtn.click()

    const afterUnsave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)
    expect(afterUnsave.length).toBe(0)
  })

  test('saving multiple articles stores all in localStorage', async ({ page }) => {
    const cards = page.locator('article')

    // Save first two articles
    await cards.nth(0).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()
    await cards.nth(1).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)
    expect(stored.length).toBe(2)
  })

  test('newest saved article is first in localStorage', async ({ page }) => {
    const cards = page.locator('article')

    await cards.nth(0).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()
    await cards.nth(1).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)

    // Second saved article should be first (most recently saved)
    expect(stored[0].id).toBe(noteworthyArticle1.id)
    expect(stored[1].id).toBe(criticalArticle.id)
  })

  test('saved articles persist across page reload', async ({ page }) => {
    // Save an article
    const firstCard = page.locator('article').first()
    await firstCard.locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check localStorage still has the article
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)
    expect(stored.length).toBe(1)
    expect(stored[0].id).toBe(criticalArticle.id)
  })

  test('pre-existing localStorage data is loaded on mount', async ({ page }) => {
    // Set localStorage before page loads
    await page.evaluate((args) => {
      localStorage.setItem(args.key, JSON.stringify([{
        id: args.article.id,
        title: args.article.title,
        url: args.article.url,
        category: args.article.category,
        importanceLabel: args.article.importanceLabel,
        source: args.article.source,
        publishedAt: args.article.publishedAt,
        savedAt: new Date().toISOString(),
      }]))
    }, { key: STORAGE_KEY, article: noteworthyArticle2 })

    // Reload so the context picks up existing localStorage
    await page.reload()
    await page.waitForLoadState('networkidle')

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)
    expect(stored.length).toBe(1)
    expect(stored[0].id).toBe(noteworthyArticle2.id)
  })

  test('invalid localStorage data is ignored on mount', async ({ page }) => {
    // Set corrupted data
    await page.evaluate((key) => localStorage.setItem(key, 'not-valid-json{{'), STORAGE_KEY)

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Page should load without crashing, localStorage cleared or reset
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible()
  })
})

test.describe('Saved Articles Panel — UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockArticlesResponse) })
    })
    await page.route('**/api/refresh', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshStatusCanRefresh) })
    })
    await page.goto('/')
    await expect(page.locator('article').first()).toBeVisible()
  })

  async function saveFirstArticle(page: import('@playwright/test').Page) {
    const firstCard = page.locator('article').first()
    await firstCard.locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()
  }

  test('saved article appears and is sorted in the panel', async ({ page }) => {
    // Save the two newest articles from the feed
    const cards = page.locator('article')
    await cards.nth(0).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()
    await cards.nth(1).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    // Open the panel
    await page.getByRole('button', { name: 'Expand saved articles panel' }).click()

    // Panel header reflects the count
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()
    await expect(page.getByText(/2 articles/)).toBeVisible()

    // Solidstar buttons for both saved articles are visible in the panel
    const panel = page.locator('aside').first()
    await expect(panel.getByRole('button', { name: 'Remove from saved' })).toHaveCount(2)
  })

  test('panel shows empty state when no articles are saved', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand saved articles panel' }).click()
    await expect(page.getByText('No saved articles')).toBeVisible()
    await expect(page.getByText('Click the star icon on any article to save it')).toBeVisible()
  })

  test('newest saved article is listed first in the panel', async ({ page }) => {
    // Save critical (Jan 10) then noteworthyArticle1 (Jan 9) then noteworthyArticle2 (Jan 8)
    const cards = page.locator('article')
    await cards.locator('a', { hasText: criticalArticle.title }).first().locator('xpath=ancestor::article').locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()
    await cards.locator('a', { hasText: noteworthyArticle1.title }).first().locator('xpath=ancestor::article').locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()
    await cards.locator('a', { hasText: noteworthyArticle2.title }).first().locator('xpath=ancestor::article').locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    await page.getByRole('button', { name: 'Expand saved articles panel' }).click()

    const panel = page.locator('aside').first()
    const titles = panel.locator('h3')
    await expect(titles.nth(0)).toContainText(criticalArticle.title)
    await expect(titles.nth(1)).toContainText(noteworthyArticle1.title)
    await expect(titles.nth(2)).toContainText(noteworthyArticle2.title)
  })

  test('unsave button in panel removes the article without opening it', async ({ page }) => {
    await saveFirstArticle(page)
    await page.getByRole('button', { name: 'Expand saved articles panel' }).click()

    const panel = page.locator('aside').first()
    await expect(panel.getByRole('button', { name: 'Remove from saved' })).toHaveCount(1)

    // Unsave — should remove from panel and localStorage
    await panel.getByRole('button', { name: 'Remove from saved' }).first().click()
    await expect(panel.getByText('No saved articles')).toBeVisible()

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)
    expect(stored.length).toBe(0)
  })

  test('clear all button empties the saved list', async ({ page }) => {
    const cards = page.locator('article')
    await cards.nth(0).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()
    await cards.nth(1).locator('button[title*="Save"], button[aria-label*="save"], button[aria-label*="Save"]').first().click()

    await page.getByRole('button', { name: 'Expand saved articles panel' }).click()
    await expect(page.locator('aside').first().getByRole('button', { name: 'Remove from saved' })).toHaveCount(2)

    await page.locator('aside').first().getByRole('button', { name: 'Clear all saved articles' }).click()

    await expect(page.locator('aside').first().getByText('No saved articles')).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY)
    expect(stored.length).toBe(0)
  })

  test('Escape key closes the expanded panel', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand saved articles panel' }).click()

    // Panel is open
    const panel = page.locator('aside').first()
    await expect(panel.getByRole('heading', { name: 'Saved' })).toBeVisible()

    // Press Escape to collapse
    await page.keyboard.press('Escape')

    // Collapse button is available again (hamburger)
    await expect(page.getByRole('button', { name: 'Expand saved articles panel' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Saved' })).not.toBeVisible()
  })

  test('saved-at relative hint is shown for saved articles', async ({ page }) => {
    // Pre-load a saved article so savedAt is set now
    await page.evaluate((args) => {
      localStorage.setItem(args.key, JSON.stringify([{
        id: args.article.id,
        title: args.article.title,
        url: args.article.url,
        category: args.article.category,
        importanceLabel: args.article.importanceLabel,
        source: args.article.source,
        publishedAt: args.article.publishedAt,
        savedAt: new Date().toISOString(),
      }]))
    }, { key: STORAGE_KEY, article: noteworthyArticle2 })

    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Expand saved articles panel' }).click()
    const panel = page.locator('aside').first()
    // Freshly saved entries show a relative hint like "just now"
    await expect(panel.getByText('just now')).toBeVisible()
  })
})
