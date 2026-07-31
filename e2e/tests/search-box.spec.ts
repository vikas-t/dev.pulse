import { test, expect } from '@playwright/test'
import { mockArticlesResponse, refreshStatusCanRefresh } from '../fixtures/mock-data'

const searchBox = (page: any) => page.getByRole('searchbox', { name: 'Search articles' })

test.describe('Search box', () => {
  test.beforeEach(async ({ page }) => {
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
    await expect(page.getByRole('article').first()).toBeVisible()
  })

  test('shows a helpful placeholder hint', async ({ page }) => {
    await expect(searchBox(page)).toHaveAttribute('placeholder', 'Search articles…')
  })

  test('filters articles as the user types', async ({ page }) => {
    // 'langchain' appears in only one of the four mock articles.
    await searchBox(page).fill('langchain')

    const articles = page.getByRole('article')
    await expect(articles).toHaveCount(1)
    await expect(articles).toContainText('LangChain Expression Language (LCEL)')
    await expect(articles).not.toContainText('PyTorch 2.2')
  })

  test('shows a clear button when a query is active and clears on click', async ({ page }) => {
    await searchBox(page).fill('pytorch')

    const clearButton = page.getByRole('button', { name: 'Clear search' })
    await expect(clearButton).toBeVisible()

    await clearButton.click()

    // Query cleared, all articles visible again.
    await expect(searchBox(page)).toHaveValue('')
    await expect(page.getByRole('article')).toHaveCount(4)
  })

  test('keeps the typed query after blur/focus (no auto-clear)', async ({ page }) => {
    await searchBox(page).fill('ollama')

    // Blurring (e.g. pressing Esc or clicking away) must not clear the query.
    await searchBox(page).blur()
    await expect(searchBox(page)).toHaveValue('ollama')

    // Focus again — query still intact and results still filtered.
    await searchBox(page).focus()
    await expect(searchBox(page)).toHaveValue('ollama')
    await expect(page.getByText('Ollama 0.2: Multi-model Serving')).toBeVisible()
  })
})
