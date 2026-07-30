import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug4', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])
    await page.addInitScript(() => {
      // Full replacement of clipboard
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
    const logs: string[] = []
    page.on('console', msg => logs.push(msg.type() + ': ' + msg.text()))
    
    const firstCard = page.locator('article').first()
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
    
    await copyButton.click()
    await page.waitForTimeout(500)
    
    console.log('Logs:', logs.join('\n'))
    console.log('Label:', await copyButton.getAttribute('aria-label'))
    
    // Check mouse event properties
    const btnType = await copyButton.getAttribute('type')
    console.log('Button type attr:', btnType)
  })
})
