/**
 * Copy text to clipboard using the modern Clipboard API.
 * Falls back to the legacy execCommand approach when the Clipboard API
 * is unavailable (e.g. non-HTTPS, iframe without permissions, older browsers).
 * Returns true if successful, false otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try the modern Clipboard API first (secure context)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Clipboard API rejected — fall through to legacy fallback
    }
  }

  // Legacy fallback: create a temporary textarea and execCommand('copy')
  return legacyCopy(text)
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

interface ClipboardResult {
  success: boolean
  message: string
}

/**
 * Copy text to clipboard with user-facing feedback messages.
 * Returns an object with `success` and `message` for displaying to the user.
 */
export async function copyToClipboardWithFeedback(text: string): Promise<ClipboardResult> {
  const success = await copyToClipboard(text)

  return {
    success,
    message: success
      ? 'Copied to clipboard'
      : 'Failed to copy. Please copy manually.',
  }
}
