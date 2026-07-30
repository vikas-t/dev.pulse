import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

test.describe('Debug8', () => {
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
    
    // Take screenshot first
    await page.screenshot({ path: '/tmp/before-click.png' })
    
    const firstCard = page.locator('article').first()
    const copyButton = firstCard.locator('button[aria-label="Copy to clipboard"]')
    await expect(copyButton).toBeVisible()
    
    // Get button info
    const tagName = await copyButton.evaluate(el => el.tagName)
    const hasOnClick = await copyButton.evaluate(el => typeof (el as any).onclick)
    console.log('Tag:', tagName, 'hasOnClick:', hasOnClick)
    
    // Get all attributes
    const attrs = await copyButton.evaluate(el => {
      const result: Record<string, string> = {}
      for (const attr of el.attributes) {
        result[attr.name] = attr.value
      }
      return result
    })
    console.log('Attributes:', JSON.stringify(attrs))
    
    // Check for event listeners (React uses synthetic events)
    const reactProps = await copyButton.evaluate(el => {
      const keys = Object.keys(el).filter(k => k.startsWith('__reactProps'))
      return keys.map(k => (el as any)[k])
    })
    console.log('React props keys:', reactProps.length > 0 ? Object.keys(reactProps[0] || {}).join(', ') : 'none')
    
    await copyButton.screenshot({ path: '/tmp/button.png' })
  })
})
