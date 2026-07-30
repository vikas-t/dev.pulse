import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug6', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.clipboard = {
        writeText: async (text: string) => {
          console.log('MOCK writeText called with:', text)
          return
        },
        readText: async () => ''
      };
    })
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

  test('debug', async ({ page }) => {
    page.on('console', msg => console.log('PAGE:', msg.type(), msg.text()))
    
    const firstCard = page.locator('article').first()
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
    
    // Use force click
    await copyButton.click({ force: true })
    await page.waitForTimeout(500)
    
    console.log('Label:', await copyButton.getAttribute('aria-label'))
  })
})
