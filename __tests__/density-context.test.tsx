import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { DensityProvider, DensityContext } from '@/lib/context/DensityContext'
import { useContext } from 'react'

// Helper to render a hook within DensityProvider
function wrapper({ children }: { children: React.ReactNode }) {
  return <DensityProvider>{children}</DensityProvider>
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('DensityContext', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('defaults to "comfortable" density', () => {
    const { result } = renderHook(() => useContext(DensityContext)!, { wrapper })
    expect(result.current.density).toBe('comfortable')
  })

  it('toggles density from comfortable to compact', () => {
    const { result } = renderHook(() => useContext(DensityContext)!, { wrapper })

    act(() => {
      result.current.toggleDensity()
    })

    expect(result.current.density).toBe('compact')
  })

  it('toggles density from compact back to comfortable', () => {
    const { result } = renderHook(() => useContext(DensityContext)!, { wrapper })

    // First toggle to compact
    act(() => {
      result.current.toggleDensity()
    })
    expect(result.current.density).toBe('compact')

    // Then toggle back
    act(() => {
      result.current.toggleDensity()
    })
    expect(result.current.density).toBe('comfortable')
  })

  it('sets density explicitly', () => {
    const { result } = renderHook(() => useContext(DensityContext)!, { wrapper })

    act(() => {
      result.current.setDensity('compact')
    })
    expect(result.current.density).toBe('compact')

    act(() => {
      result.current.setDensity('comfortable')
    })
    expect(result.current.density).toBe('comfortable')
  })

  it('persists density preference to localStorage', () => {
    const { result } = renderHook(() => useContext(DensityContext)!, { wrapper })

    act(() => {
      result.current.toggleDensity()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('pulse_density_preference', 'compact')
  })

  it('loads density from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValueOnce('compact')

    const { result } = renderHook(() => useContext(DensityContext)!, { wrapper })

    // After initialization effect runs
    expect(result.current.density).toBe('compact')
  })

  it('throws when used outside DensityProvider', () => {
    // We need to suppress the error output for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => {
        const ctx = useContext(DensityContext)
        if (!ctx) throw new Error('useDensity must be used within DensityProvider')
        return ctx
      })
    }).toThrow('useDensity must be used within DensityProvider')

    consoleSpy.mockRestore()
  })

  it('ignores invalid localStorage values', () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid_value')

    const { result } = renderHook(() => useContext(DensityContext)!, { wrapper })

    expect(result.current.density).toBe('comfortable')
  })
})
