import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug9', () => {
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
    
    // Try dispatching a native click event
    await copyButton.evaluate(el => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    await page.waitForTimeout(500)
    console.log('Label after native click:', await copyButton.getAttribute('aria-label'))
    
    // Try triggering React's synthetic event system directly
    await copyButton.evaluate(el => {
      // In React 19, event listeners might be stored on the root container
      // Let's try to find and call the handler
      const reactInternalKey = Object.keys(el).find(k => k.startsWith('__reactFiber$'))
      if (reactInternalKey) {
        const fiber = (el as any)[reactInternalKey]
        console.log('Found React fiber:', fiber?.tag, fiber?.memoizedProps?.onClick ? 'has onClick' : 'no onClick')
        if (fiber?.memoizedProps?.onClick) {
          fiber.memoizedProps.onClick()
          console.log('Called onClick from fiber')
        }
      }
    })
    await page.waitForTimeout(500)
    console.log('Label after fiber click:', await copyButton.getAttribute('aria-label'))
  })
})
