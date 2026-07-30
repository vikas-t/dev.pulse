import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug5', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.addInitScript(() => {
      // Simple override
      const origClipboard = navigator.clipboard;
      const clipboardMock = {
        writeText: async (text: string) => {
          console.log('MOCK writeText called with:', text)
          // Don't call original
          return
        },
        readText: async () => ''
      }
      // @ts-ignore
      navigator.clipboard = clipboardMock;
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
    
    await copyButton.click()
    await page.waitForTimeout(500)
    
    console.log('Label:', await copyButton.getAttribute('aria-label'))
    
    // Try evaluating copyToClipboard directly
    const evalResult = await page.evaluate(async () => {
      try {
        await navigator.clipboard.writeText('hello')
        return 'success'
      } catch (e: any) {
        return 'error: ' + e.message
      }
    })
    console.log('Direct clipboard call:', evalResult)
  })
})
