import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CodeBlock } from '@/components/CodeBlock'

// Mock the clipboard module
vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: vi.fn(),
}))

import { copyToClipboard } from '@/lib/clipboard'

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the code content', () => {
      render(<CodeBlock code="npm install" />)
      expect(screen.getByText('npm install')).toBeInTheDocument()
    })

    it('displays the language label', () => {
      render(<CodeBlock code="code" language="python" />)
      // CSS uppercase transforms text visually; DOM contains lowercase
      const langSpan = document.querySelector('.code-block-header span')
      expect(langSpan?.textContent?.toLowerCase()).toBe('python')
    })

    it('defaults language to bash when not specified', () => {
      render(<CodeBlock code="echo hello" />)
      const langSpan = document.querySelector('.code-block-header span')
      expect(langSpan?.textContent?.toLowerCase()).toBe('bash')
    })

    it('displays filename when provided', () => {
      render(<CodeBlock code="code" filename="app.ts" />)
      expect(screen.getByText('app.ts')).toBeInTheDocument()
    })

    it('does not show filename when not provided', () => {
      render(<CodeBlock code="code" />)
      // The dot separator should not be present without filename
      const dotElements = screen.queryByText('·')
      expect(dotElements).not.toBeInTheDocument()
    })

    it('shows copy button by default', () => {
      render(<CodeBlock code="code" />)
      expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
    })

    it('hides copy button when showCopy is false', () => {
      render(<CodeBlock code="code" showCopy={false} />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('renders the header bar', () => {
      render(<CodeBlock code="code" />)
      const langSpan = document.querySelector('.code-block-header span')
      expect(langSpan?.textContent?.toLowerCase()).toBe('bash')
      expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
    })
  })

  describe('line numbers', () => {
    it('shows line numbers for multi-line code by default', () => {
      render(<CodeBlock code={'line1\nline2\nline3'} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('does not show line numbers for single-line code', () => {
      render(<CodeBlock code="single line" />)
      // Line number span should not exist for single line
      const lineNumbers = document.querySelectorAll('.code-block-line-number')
      expect(lineNumbers.length).toBe(0)
    })

    it('hides line numbers when showLineNumbers is false', () => {
      render(<CodeBlock code={'line1\nline2'} showLineNumbers={false} />)
      const lineNumbers = document.querySelectorAll('.code-block-line-number')
      expect(lineNumbers.length).toBe(0)
    })

    it('shows line numbers for empty lines', () => {
      render(<CodeBlock code={'line1\n\nline3'} />)
      // Should have 3 line numbers
      const lineNumbers = document.querySelectorAll('.code-block-line-number')
      expect(lineNumbers.length).toBe(3)
      expect(lineNumbers[0].textContent).toBe('1')
      expect(lineNumbers[1].textContent).toBe('2')
      expect(lineNumbers[2].textContent).toBe('3')
    })
  })

  describe('copy functionality', () => {
    it('calls copyToClipboard when copy button is clicked', async () => {
      const mockCopy = vi.mocked(copyToClipboard)
      mockCopy.mockResolvedValue(true)

      render(<CodeBlock code="test code" />)
      const button = screen.getByRole('button', { name: 'Copy code' })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockCopy).toHaveBeenCalledWith('test code')
    })

    it('shows "Copied" feedback after successful copy', async () => {
      const mockCopy = vi.mocked(copyToClipboard)
      mockCopy.mockResolvedValue(true)

      render(<CodeBlock code="test code" />)
      const button = screen.getByRole('button', { name: 'Copy code' })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(screen.getByText('✓ Copied')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    })

    it('resets copy state after the timeout', async () => {
      vi.useFakeTimers()
      const mockCopy = vi.mocked(copyToClipboard)
      mockCopy.mockResolvedValue(true)

      render(<CodeBlock code="test code" />)
      const button = screen.getByRole('button', { name: 'Copy code' })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(screen.getByText('✓ Copied')).toBeInTheDocument()

      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      expect(screen.getByText('Copy')).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('does not change state if copy fails', async () => {
      const mockCopy = vi.mocked(copyToClipboard)
      mockCopy.mockResolvedValue(false)

      render(<CodeBlock code="test code" />)
      const button = screen.getByRole('button', { name: 'Copy code' })

      await act(async () => {
        fireEvent.click(button)
      })

      // Should still show "Copy" since copy failed
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies code-block class to root element', () => {
      render(<CodeBlock code="code" />)
      const block = document.querySelector('.code-block')
      expect(block).toBeInTheDocument()
    })

    it('applies code-block-header class to header', () => {
      render(<CodeBlock code="code" />)
      const header = document.querySelector('.code-block-header')
      expect(header).toBeInTheDocument()
    })

    it('applies code-block-copy class to copy button', () => {
      render(<CodeBlock code="code" />)
      const button = document.querySelector('.code-block-copy')
      expect(button).toBeInTheDocument()
    })

    it('uses maxHeight prop as style on code area', () => {
      render(<CodeBlock code="code" maxHeight="300px" />)
      const scrollDiv = document.querySelector('.overflow-auto')
      expect(scrollDiv).toHaveStyle({ maxHeight: '300px' })
    })

    it('defaults maxHeight to 400px', () => {
      render(<CodeBlock code="code" />)
      const scrollDiv = document.querySelector('.overflow-auto')
      expect(scrollDiv).toHaveStyle({ maxHeight: '400px' })
    })
  })
})
