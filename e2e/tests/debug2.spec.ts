import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug2', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.addInitScript(() => {
      ;(window as any).__clipboardText = ''
      navigator.clipboard.writeText = async (text: string) => {
        ;(window as any).__clipboardText = text
        return Promise.resolve()
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

  test('debug click and check DOM state', async ({ page }) => {
    const firstCard = page.locator('article').first()
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
    
    // Use dispatchEvent to simulate click properly
    await copyButton.dispatchEvent('click')
    await page.waitForTimeout(500)
    
    // Check if React state changed
    const label = await copyButton.getAttribute('aria-label')
    console.log('Label after dispatchEvent click:', label)
    
    // Try real click
    await copyButton.click()
    await page.waitForTimeout(500)
    
    const label2 = await copyButton.getAttribute('aria-label')
    console.log('Label after real click:', label2)
    
    // Check clipboard text
    const text = await page.evaluate(() => (window as any).__clipboardText)
    console.log('Clipboard text:', text)
    
    // Check if handleCopy is being triggered at all by checking the innerHTML
    const innerHtml = await copyButton.innerHTML()
    console.log('Button inner HTML:', innerHtml.substring(0, 100))
  })
})
