'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'pulse_theme'
const HTML_CLASS = 'dark'

const ThemeContext = createContext<ThemeContextValue | null>(null)

const prefersDarkQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

/** Read the persisted theme, falling back to the OS preference. */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    // Server render defaults to light; the client-only provider corrects it
    // right after hydration via the inline script + effect before paint.
    return 'light'
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch {
    // localStorage unavailable — fall through to OS preference
  }

  return prefersDarkQuery?.matches ? 'dark' : 'light'
}

/** Applies the theme to the document root, keeping `data-theme` and the class in sync. */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle(HTML_CLASS, theme === 'dark')
  root.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'light' : getInitialTheme()
  )

  // Apply the theme to the DOM and mark that transitions may animate.
  useEffect(() => {
    applyTheme(theme)
    // Enable smooth transitions on the initial hydration paint as well, so toggling
    // feels polished. The FOUC-prevention inline script in the layout already set the
    // final theme before this runs, so this effect does not cause a visible flash.
    requestAnimationFrame(() => {
      document.body.classList.add('theme-transition')
    })
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore persistence failures; the theme still applies for the session.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Ignore persistence failures.
      }
      return next
    })
  }, [])

  // React to OS theme changes, but only when the user hasn't chosen a theme themselves.
  useEffect(() => {
    if (!prefersDarkQuery) return

    const onChange = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'light' || stored === 'dark') {
          // A user preference exists — don't override it.
          return
        }
      } catch {
        // Fall through to preview the OS preference.
      }
      setThemeState(prefersDarkQuery.matches ? 'dark' : 'light')
    }

    prefersDarkQuery.addEventListener('change', onChange)
    return () => prefersDarkQuery.removeEventListener('change', onChange)
  }, [])

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}

/** Used by the exported pure helpers (e.g. tests) without a React tree. */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = getInitialTheme()
  return stored
}
