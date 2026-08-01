'use client'

import { useDensity } from '@/hooks/useDensity'

export function DensityToggle() {
  const { density, toggleDensity } = useDensity()

  return (
    <button
      onClick={toggleDensity}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors
        bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
      title={density === 'comfortable' ? 'Switch to compact view' : 'Switch to comfortable view'}
      aria-label={`Current density: ${density}. Click to switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} view`}
    >
      {density === 'comfortable' ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Comfortable</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
          <span>Compact</span>
        </>
      )}
    </button>
  )
}
