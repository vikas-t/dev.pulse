import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug3', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.addInitScript(() => {
      // Replace the ENTIRE navigator.clipboard object
      const clipboardMock = {
        writeText: async (text: string) => {
          console.log('MOCK writeText called with:', text)
          return Promise.resolve()
        },
        readText: async () => ''
      }
      Object.defineProperty(navigator, 'clipboard', {
        get: () => clipboardMock,
        configurable: true,
      });
      (window as any).__clipboardMock = clipboardMock
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
    // Capture console messages from the page
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push('ERROR: ' + msg.text())
      }
    })
    
    const firstCard = page.locator('article').first()
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
    
    // Check navigator.clipboard from page context
    const clipCheck = await page.evaluate(() => {
      return typeof navigator.clipboard.writeText
    })
    console.log('navigator.clipboard.writeText type:', clipCheck)
    
    // Also test calling copyToClipboard directly
    const result = await page.evaluate(async () => {
      const { copyToClipboard } = await import('@/lib/clipboard')
      return copyToClipboard('test-from-direct-call')
    })
    console.log('Direct copyToClipboard result:', result)
    
    // Check if mock is still in place
    const mockCheck = await page.evaluate(() => {
      return typeof (window as any).__clipboardMock
    })
    console.log('Mock exists:', mockCheck)
    
    await copyButton.click()
    await page.waitForTimeout(1000)
    
    console.log('Logs:', logs)
    console.log('Label:', await copyButton.getAttribute('aria-label'))
  })
})
