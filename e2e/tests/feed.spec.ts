import { test, expect } from '@playwright/test'
import {
  mockArticlesResponse,
  criticalArticle,
  noteworthyArticle1,
  spotlightArticle,
} from '../fixtures/mock-data'

test.describe('Main Feed', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response before navigating
    await page.route('**/api/articles/today*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticlesResponse),
      })
    })
  })

  test('displays header with app title', async ({ page }) => {
    await page.goto('/')

    // Check header
    await expect(page.locator('h1')).toContainText('dev.pulse')
    await expect(page.locator('header')).toContainText('AI Updates for Developers')
  })

  test('displays correct article count in header', async ({ page }) => {
    await page.goto('/')

    // Should show "Today's Top 4 AI Updates for Developers"
    await expect(page.locator('header')).toContainText('4')
  })

  test('displays Critical & Breaking section', async ({ page }) => {
    await page.goto('/')

    // Check Critical section exists
    const criticalSection = page.locator('section').filter({ hasText: 'Critical & Breaking' })
    await expect(criticalSection).toBeVisible()

    // Check critical article is displayed
    await expect(criticalSection).toContainText(criticalArticle.title)
  })

  test('displays New & Noteworthy section', async ({ page }) => {
    await page.goto('/')

    // Check Noteworthy section exists
    const noteworthySection = page.locator('section').filter({ hasText: 'New & Noteworthy' })
    await expect(noteworthySection).toBeVisible()

    // Check noteworthy articles are displayed
    await expect(noteworthySection).toContainText(noteworthyArticle1.title)
  })

  test('displays GitHub Spotlight section', async ({ page }) => {
    await page.goto('/')

    // Check Spotlight section exists
    const spotlightSection = page.locator('section').filter({ hasText: 'GitHub Spotlight' })
    await expect(spotlightSection).toBeVisible()

    // Check spotlight article is displayed
    await expect(spotlightSection).toContainText(spotlightArticle.title)
  })

  test('displays all article cards', async ({ page }) => {
    await page.goto('/')

    // Should have 4 article cards total
    const articleCards = page.locator('article')
    await expect(articleCards).toHaveCount(4)
  })

  test('displays footer', async ({ page }) => {
    await page.goto('/')

    // Check footer exists
    await expect(page.locator('footer')).toContainText('Built with Next.js')
  })
})
