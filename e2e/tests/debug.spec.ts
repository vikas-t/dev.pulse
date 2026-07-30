import { test, expect } from '@playwright/test'
import { mockArticlesResponse, criticalArticle, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.addInitScript(() => {
      ;(window as any).__clipboardText = ''
      const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard)
      navigator.clipboard.writeText = async (text: string) => {
        console.log('CLIPBOARD WRITE CALLED WITH:', text)
        ;(window as any).__clipboardText = text
        return origWriteText(text)
      }
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

  test('debug click', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()))
    
    const firstCard = page.locator('article').first()
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
    
    // Check initial label
    console.log('Initial label:', await copyButton.getAttribute('aria-label'))
    
    await copyButton.click()
    await page.waitForTimeout(1000)
    
    console.log('After click label:', await copyButton.getAttribute('aria-label'))
    console.log('Clipboard text:', await page.evaluate(() => (window as any).__clipboardText))
    
    // Check if copyToClipboard returned true
    const success = await page.evaluate(async () => {
      try {
        await navigator.clipboard.writeText('test')
        return 'writeText worked'
      } catch (e: any) {
        return 'writeText failed: ' + e.message
      }
    })
    console.log('writeText test:', success)
  })
})
