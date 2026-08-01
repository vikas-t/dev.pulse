'use client'

import { useContext } from 'react'
import { DensityContext, DensityContextValue } from '@/lib/context/DensityContext'

export function useDensity(): DensityContextValue {
  const context = useContext(DensityContext)
  if (!context) {
    throw new Error('useDensity must be used within DensityProvider')
  }
  return context
}
