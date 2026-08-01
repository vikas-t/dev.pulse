'use client'

import { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'

export type DensityMode = 'comfortable' | 'compact'

export interface DensityContextValue {
  density: DensityMode
  toggleDensity: () => void
  setDensity: (mode: DensityMode) => void
}

const STORAGE_KEY = 'pulse_density_preference'

export const DensityContext = createContext<DensityContextValue | null>(null)

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<DensityMode>('comfortable')
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'compact' || stored === 'comfortable') {
        setDensityState(stored)
      }
    } catch {
      // Invalid localStorage data, use default
    }
    setIsInitialized(true)
  }, [])

  // Sync to localStorage when density changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return

    try {
      localStorage.setItem(STORAGE_KEY, density)
    } catch {
      // localStorage write failed
    }
  }, [density, isInitialized])

  const setDensity = useCallback((mode: DensityMode) => {
    setDensityState(mode)
  }, [])

  const toggleDensity = useCallback(() => {
    setDensityState(prev => (prev === 'comfortable' ? 'compact' : 'comfortable'))
  }, [])

  const value = useMemo(
    () => ({
      density,
      toggleDensity,
      setDensity,
    }),
    [density, toggleDensity, setDensity]
  )

  return (
    <DensityContext.Provider value={value}>
      {children}
    </DensityContext.Provider>
  )
}
