import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('copyToClipboard', () => {
  let clipboardWriteTextSpy: ReturnType<typeof vi.fn>
  let execCommandSpy: ReturnType<typeof vi.fn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset the DOM
    document.body.innerHTML = ''

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // jsdom does not have navigator.clipboard, so we define it
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    })

    clipboardWriteTextSpy = navigator.clipboard.writeText as ReturnType<typeof vi.fn>
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Clipboard API available (secure context)', () => {
    it('should copy text successfully using Clipboard API', async () => {
      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('hello world')

      expect(result).toBe(true)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('hello world')
    })

    it('should handle empty string', async () => {
      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('')

      expect(result).toBe(true)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('')
    })

    it('should handle special characters', async () => {
      const { copyToClipboard } = await import('../lib/clipboard')

      const specialText = 'const x = "hello 🎉";\nconsole.log(x);'
      const result = await copyToClipboard(specialText)

      expect(result).toBe(true)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith(specialText)
    })

    it('should return false when Clipboard API throws and fallback also fails', async () => {
      // Make Clipboard API fail
      clipboardWriteTextSpy.mockRejectedValue(new Error('Permission denied'))

      // Make execCommand fail too
      execCommandSpy = vi.fn().mockReturnValue(false)
      document.execCommand = execCommandSpy as any

      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('hello')

      expect(result).toBe(false)
      // The Clipboard API error is caught silently; no console.error for graceful fallback
    })

    it('should fall back to execCommand when Clipboard API fails', async () => {
      clipboardWriteTextSpy.mockRejectedValue(new Error('Not allowed'))

      execCommandSpy = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandSpy as any

      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('fallback test')

      expect(result).toBe(true)
      expect(execCommandSpy).toHaveBeenCalledWith('copy')
    })
  })

  describe('Clipboard API unavailable', () => {
    beforeEach(() => {
      // Remove Clipboard API entirely
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })
    })

    it('should fall back to legacy execCommand when Clipboard API is missing', async () => {
      execCommandSpy = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandSpy as any

      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('fallback test')

      expect(result).toBe(true)
      expect(execCommandSpy).toHaveBeenCalledWith('copy')
    })

    it('should create and remove a textarea element with correct attributes', async () => {
      execCommandSpy = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandSpy as any

      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      const { copyToClipboard } = await import('../lib/clipboard')

      await copyToClipboard('element test')

      expect(appendChildSpy).toHaveBeenCalledTimes(1)
      expect(removeChildSpy).toHaveBeenCalledTimes(1)

      const textarea = appendChildSpy.mock.calls[0][0] as HTMLTextAreaElement
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea.value).toBe('element test')
      expect(textarea.readOnly).toBe(true)
      expect(textarea.style.position).toBe('fixed')
      expect(textarea.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('copyToClipboardWithFeedback', () => {
    it('should return success message when copy succeeds', async () => {
      const { copyToClipboardWithFeedback } = await import('../lib/clipboard')

      const result = await copyToClipboardWithFeedback('test')

      expect(result).toEqual({
        success: true,
        message: 'Copied to clipboard',
      })
    })

    it('should return failure message when copy fails', async () => {
      clipboardWriteTextSpy.mockRejectedValue(new Error('fail'))
      execCommandSpy = vi.fn().mockReturnValue(false)
      document.execCommand = execCommandSpy as any

      const { copyToClipboardWithFeedback } = await import('../lib/clipboard')

      const result = await copyToClipboardWithFeedback('test')

      expect(result).toEqual({
        success: false,
        message: 'Failed to copy. Please copy manually.',
      })
    })

    it('should return success when Clipboard API fails but execCommand fallback succeeds', async () => {
      clipboardWriteTextSpy.mockRejectedValue(new Error('fail'))
      execCommandSpy = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandSpy as any

      const { copyToClipboardWithFeedback } = await import('../lib/clipboard')

      const result = await copyToClipboardWithFeedback('test')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Copied to clipboard')
    })

    it('should pass options through to copyToClipboard', async () => {
      clipboardWriteTextSpy.mockResolvedValue(undefined)

      const { copyToClipboardWithFeedback } = await import('../lib/clipboard')

      // Passing preferLegacy shouldn't affect the feedback result shape
      const result = await copyToClipboardWithFeedback('  spaced text  ', { trim: true })

      expect(result.success).toBe(true)
      expect(result.message).toBe('Copied to clipboard')
      // Clipboard API should have been called with the trimmed version
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('spaced text')
    })
  })

  describe('CopyOptions', () => {
    beforeEach(() => {
      // Ensure Clipboard API is available for most tests
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        configurable: true,
        writable: true,
      })
      clipboardWriteTextSpy = navigator.clipboard.writeText as ReturnType<typeof vi.fn>
    })

    it('should trim whitespace when trim option is true', async () => {
      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('  hello world  ', { trim: true })

      expect(result).toBe(true)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('hello world')
    })

    it('should not trim when trim option is false', async () => {
      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('  spaced  ', { trim: false })

      expect(result).toBe(true)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('  spaced  ')
    })

    it('should not trim when trim option is not set', async () => {
      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('  no trim  ')

      expect(result).toBe(true)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('  no trim  ')
    })

    it('should skip Clipboard API and go straight to fallback when preferLegacy is true', async () => {
      // execCommand should succeed
      execCommandSpy = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandSpy as any

      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('legacy only', { preferLegacy: true })

      expect(result).toBe(true)
      // Clipboard API should NOT have been called
      expect(clipboardWriteTextSpy).not.toHaveBeenCalled()
      // execCommand should have been used instead
      expect(execCommandSpy).toHaveBeenCalledWith('copy')
    })

    it('should respect timeout option and fall back on timeout', async () => {
      // Make Clipboard API hang indefinitely
      clipboardWriteTextSpy.mockImplementation(() => new Promise(() => {}))

      // Make execCommand succeed as fallback
      execCommandSpy = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandSpy as any

      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('timeout test', { timeout: 50 })

      expect(result).toBe(true)
      // Should have fallen back to execCommand
      expect(execCommandSpy).toHaveBeenCalledWith('copy')
    })

    it('should fail overall when both Clipboard API (timeout) and fallback fail', async () => {
      // Make Clipboard API hang indefinitely
      clipboardWriteTextSpy.mockImplementation(() => new Promise(() => {}))

      // Make execCommand fail too
      execCommandSpy = vi.fn().mockReturnValue(false)
      document.execCommand = execCommandSpy as any

      const { copyToClipboard } = await import('../lib/clipboard')

      const result = await copyToClipboard('timeout fail', { timeout: 50 })

      expect(result).toBe(false)
      expect(execCommandSpy).toHaveBeenCalledWith('copy')
    })
  })
})
