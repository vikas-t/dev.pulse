'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Category = 'breaking' | 'library' | 'sdk' | 'launch' | 'trending' | 'industry' | 'tools' | 'performance' | 'known_issue' | 'case_study' | 'research' | 'community' | 'security'

interface CategoryBadgeProps {
  category: Category
  /** Number of saved articles in this category. When provided, the badge becomes clickable with a popover. */
  savedCount?: number
}

const categoryConfig: Record<Category, { label: string; color: string; emoji: string; description: string }> = {
  breaking: { label: 'Breaking', color: 'bg-red-500/10 text-red-400 border-red-500/20', emoji: '🔴', description: 'Breaking changes and critical updates that require immediate attention.' },
  library: { label: 'Library', color: 'bg-green-500/10 text-green-400 border-green-500/20', emoji: '📚', description: 'Library releases, major version bumps, and new package announcements.' },
  sdk: { label: 'SDK', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', emoji: '🔧', description: 'SDK releases, API changes, and developer tooling updates.' },
  launch: { label: 'Launch', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', emoji: '🚀', description: 'Product launches, new service announcements, and platform releases.' },
  trending: { label: 'Trending', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', emoji: '⭐', description: 'Trending repositories and projects gaining rapid community attention.' },
  industry: { label: 'Industry', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', emoji: '📰', description: 'Industry news, company announcements, and market analysis.' },
  tools: { label: 'Tools', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', emoji: '🛠️', description: 'Developer tools, utilities, and productivity enhancers.' },
  performance: { label: 'Performance', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', emoji: '⚡', description: 'Performance benchmarks, optimization techniques, and speed improvements.' },
  known_issue: { label: 'Known Issue', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', emoji: '🐛', description: 'Known bugs, regressions, and important warnings from maintainers.' },
  case_study: { label: 'Case Study', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', emoji: '🏭', description: 'Real-world production stories, migration experiences, and architecture deep-dives.' },
  research: { label: 'Research', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', emoji: '🔬', description: 'Research papers, technical reports, and academic findings.' },
  community: { label: 'Community', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', emoji: '💬', description: 'Community discussions, best practices, and shared knowledge.' },
  security: { label: 'Security', color: 'bg-red-700/10 text-red-300 border-red-700/20', emoji: '🔒', description: 'Security vulnerabilities, CVEs, and critical patches.' },
}

export function CategoryBadge({ category, savedCount }: CategoryBadgeProps) {
  const config = categoryConfig[category]
  const [isOpen, setIsOpen] = useState(false)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const isClickable = savedCount !== undefined

  const close = useCallback(() => {
    setIsOpen(false)
    badgeRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }

    // Use a small delay to avoid the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, close])

  const handleClick = () => {
    if (!isClickable) return
    setIsOpen(prev => !prev)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isClickable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(prev => !prev)
    }
  }

  const badge = (
    <span
      ref={badgeRef}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-expanded={isClickable ? isOpen : undefined}
      aria-haspopup={isClickable ? 'dialog' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.color} ${isClickable ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500/50' : ''}`}
    >
      <span aria-hidden="true">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  )

  if (!isClickable || !isOpen) {
    return badge
  }

  return (
    <span className="relative inline-flex">
      {badge}
      <div
        ref={popoverRef}
        role="dialog"
        aria-label={`${config.label} category information`}
        className="absolute z-50 top-full mt-2 left-0 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true" className="text-lg">{config.emoji}</span>
          <span className={`text-sm font-semibold ${config.color.split(' ')[1]}`}>{config.label}</span>
        </div>
        <p className="text-sm text-zinc-300 mb-3">{config.description}</p>
        <div className="pt-2 border-t border-zinc-700">
          <p className="text-xs text-zinc-400">
            <span className="font-semibold text-zinc-200">{savedCount}</span>{' '}
            {savedCount === 1 ? 'saved article' : 'saved articles'} in this category
          </p>
        </div>
        <button
          onClick={close}
          aria-label="Close popover"
          className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </span>
  )
}
