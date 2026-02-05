'use client'

interface SaveButtonProps {
  isSaved: boolean
  onToggle: () => void
  className?: string
  size?: 'sm' | 'md'
}

export function SaveButton({ isSaved, onToggle, className = '', size = 'md' }: SaveButtonProps) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isSaved ? 'Remove from saved' : 'Save article'}
      className={`
        p-1.5 rounded transition-all duration-150
        hover:scale-110 active:scale-95
        ${isSaved
          ? 'text-amber-400 hover:text-amber-300'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }
        ${className}
      `}
    >
      {isSaved ? (
        // Filled star
        <svg className={sizeClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        // Outline star
        <svg className={sizeClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      )}
    </button>
  )
}
