import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug7', () => {
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
    
    // Click via DOM directly
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Copy to clipboard"]')
      if (btn) {
        console.log('Found button, clicking...')
        ;(btn as HTMLButtonElement).click()
        console.log('Clicked')
      } else {
        console.log('Button not found via querySelector')
      }
    })
    await page.waitForTimeout(500)
    
    console.log('Label:', await copyButton.getAttribute('aria-label'))
  })
})
