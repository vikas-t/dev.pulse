/**
 * Copy text to clipboard using the modern Clipboard API.
 * Falls back to the legacy execCommand approach when the Clipboard API
 * is unavailable (e.g. non-HTTPS, iframe without permissions, older browsers).
 * Returns true if successful, false otherwise.
 */

export interface CopyOptions {
  /**
   * Timeout in ms for the Clipboard API write operation (default: no timeout).
   */
  timeout?: number
  /**
   * If true, trims leading/trailing whitespace before copying.
   */
  trim?: boolean
  /**
   * Prefer the legacy execCommand fallback even if Clipboard API is available.
   */
  preferLegacy?: boolean
}

export async function copyToClipboard(text: string, options?: CopyOptions): Promise<boolean> {
  let resolvedText = text

  if (options?.trim) {
    resolvedText = text.trim()
  }

  // Try the modern Clipboard API first (secure context)
  if (!options?.preferLegacy && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      if (options?.timeout && options.timeout > 0) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), options.timeout)
        await Promise.race([
          navigator.clipboard.writeText(resolvedText),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('Clipboard write timed out')))
          }),
        ])
        clearTimeout(timeoutId)
      } else {
        await navigator.clipboard.writeText(resolvedText)
      }
      return true
    } catch {
      // Clipboard API rejected — fall through to legacy fallback
    }
  }

  // Legacy fallback: create a temporary textarea and execCommand('copy')
  return legacyCopy(resolvedText)
}

/**
 * Legacy copy fallback using document.execCommand('copy').
 * Creates a temporary off-screen textarea, focuses it, executes copy,
 * then removes the element.
 */
function legacyCopy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.readOnly = true
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.setAttribute('aria-hidden', 'true')
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}

export interface ClipboardResult {
  success: boolean
  message: string
}

/**
 * Copy text to clipboard with user-facing feedback messages.
 * Returns an object with `success` and `message` for displaying to the user.
 */
export async function copyToClipboardWithFeedback(
  text: string,
  options?: CopyOptions
): Promise<ClipboardResult> {
  const success = await copyToClipboard(text, options)

  if (success) {
    return {
      success: true,
      message: 'Copied to clipboard',
    }
  }

  return {
    success: false,
    message: 'Failed to copy. Please copy manually.',
  }
}
