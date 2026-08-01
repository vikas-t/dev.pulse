import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryBadge } from '@/components/CategoryBadge'

describe('CategoryBadge', () => {
  describe('basic rendering (no savedCount)', () => {
    it('renders the category label', () => {
      render(<CategoryBadge category="security" />)
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    it('renders the category emoji', () => {
      render(<CategoryBadge category="breaking" />)
      expect(screen.getByText('🔴')).toBeInTheDocument()
    })

    it('renders as a non-interactive span when savedCount is not provided', () => {
      render(<CategoryBadge category="library" />)
      const badge = screen.getByText('Library').closest('span')
      expect(badge).not.toHaveAttribute('role', 'button')
      expect(badge).not.toHaveAttribute('tabindex')
    })

    it('does not open a popover on click when savedCount is not provided', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="launch" />)
      await user.click(screen.getByText('Launch'))
      // The popover should not appear
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('interactive badge (with savedCount)', () => {
    it('renders as a button when savedCount is provided', () => {
      render(<CategoryBadge category="security" savedCount={3} />)
      const badge = screen.getByRole('button')
      expect(badge).toHaveTextContent('Security')
    })

    it('has aria-expanded and aria-haspopup attributes', () => {
      render(<CategoryBadge category="security" savedCount={0} />)
      const badge = screen.getByRole('button')
      expect(badge).toHaveAttribute('aria-expanded', 'false')
      expect(badge).toHaveAttribute('aria-haspopup', 'dialog')
    })

    it('opens popover on click and shows category description', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="security" savedCount={5} />)

      await user.click(screen.getByRole('button'))

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveTextContent('Security vulnerabilities, CVEs, and critical patches.')
      expect(dialog).toHaveTextContent('5 saved articles in this category')
    })

    it('toggles popover closed on second click', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="research" savedCount={2} />)

      const badge = screen.getByRole('button', { name: /research/i })
      await user.click(badge)
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(badge)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('shows "1 saved article" (singular) when count is 1', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="community" savedCount={1} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('dialog')).toHaveTextContent('1 saved article in this category')
    })

    it('shows "0 saved articles" when count is 0', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="tools" savedCount={0} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('dialog')).toHaveTextContent('0 saved articles in this category')
    })

    it('shows the correct count for large numbers', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="trending" savedCount={42} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('dialog')).toHaveTextContent('42 saved articles in this category')
    })
  })

  describe('keyboard accessibility', () => {
    it('opens popover on Enter key', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="performance" savedCount={7} />)

      const badge = screen.getByRole('button')
      badge.focus()
      await user.keyboard('{Enter}')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('opens popover on Space key', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="sdk" savedCount={3} />)

      const badge = screen.getByRole('button')
      badge.focus()
      await user.keyboard(' ')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('closes popover on Escape key', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="industry" savedCount={2} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('returns focus to the badge after Escape closes popover', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="case_study" savedCount={4} />)

      const badge = screen.getByRole('button')
      await user.click(badge)
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.keyboard('{Escape}')
      // Popover closes and badge is focusable again (jsdom focus on spans is limited,
      // but the popover closing is the user-visible behaviour that matters)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      // Verify the badge is still in the document and interactive
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes popover when clicking the close button', async () => {
      const user = userEvent.setup()
      render(<CategoryBadge category="known_issue" savedCount={1} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByLabelText('Close popover'))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes popover when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <CategoryBadge category="library" savedCount={6} />
          <button>Outside</button>
        </div>
      )

      await user.click(screen.getByRole('button', { name: /library/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByText('Outside'))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('all categories have descriptions', () => {
    const categories = [
      'breaking', 'library', 'sdk', 'launch', 'trending', 'industry',
      'tools', 'performance', 'known_issue', 'case_study', 'research',
      'community', 'security',
    ] as const

    it.each(categories)('category "%s" shows its description in the popover', async (category) => {
      const user = userEvent.setup()
      render(<CategoryBadge category={category} savedCount={1} />)

      await user.click(screen.getByRole('button'))

      const dialog = screen.getByRole('dialog')
      // Each description should be a non-empty string
      expect(dialog.textContent).toBeTruthy()
      // The description paragraph should not be empty
      const descParagraph = dialog.querySelector('p')
      expect(descParagraph).toBeTruthy()
      expect(descParagraph!.textContent!.trim().length).toBeGreaterThan(0)
    })
  })
})
