'use client'

import { SavedArticleData } from '@/lib/context/SavedArticlesContext'
import { CategoryBadge } from './CategoryBadge'
import { formatArticleDate } from '@/lib/utils/formatDate'

interface SavedArticlesPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  savedArticles: SavedArticleData[]
  onUnsave: (id: string) => void
}

// Category type for CategoryBadge
type Category = 'breaking' | 'library' | 'sdk' | 'launch' | 'trending' | 'industry' | 'tools' | 'performance' | 'known_issue' | 'case_study' | 'research' | 'community' | 'security'

function isValidCategory(category: string): category is Category {
  return [
    'breaking', 'library', 'sdk', 'launch', 'trending', 'industry',
    'tools', 'performance', 'known_issue', 'case_study', 'research',
    'community', 'security'
  ].includes(category)
}

export function SavedArticlesPanel({
  isCollapsed,
  onToggleCollapse,
  savedArticles,
  onUnsave,
}: SavedArticlesPanelProps) {
  // Sort articles by publishedAt date (newest first)
  const sortedArticles = [...savedArticles].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime()
    const dateB = new Date(b.publishedAt).getTime()
    return dateB - dateA
  })

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full
        bg-zinc-900 border-r border-zinc-800 z-40
        transition-all duration-300 ease-in-out
        flex flex-col
        ${isCollapsed ? 'w-0 sm:w-12' : 'w-full sm:w-80'}
      `}
    >
      {/* Collapsed state - just show hamburger */}
      {isCollapsed && (
        <div className="hidden sm:flex h-full flex-col items-center pt-4">
          <button
            onClick={onToggleCollapse}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Expand saved articles panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Star icon with count when collapsed */}
          {savedArticles.length > 0 && (
            <div className="mt-4 flex flex-col items-center">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-xs text-zinc-400 mt-1">{savedArticles.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Expanded state */}
      <div className={`flex flex-col h-full ${isCollapsed ? 'hidden sm:hidden' : ''}`}>
        {/* Panel Header - Sticky */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Collapse saved articles panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Saved
              </h2>
              <p className="text-xs text-zinc-500">
                {savedArticles.length} {savedArticles.length === 1 ? 'article' : 'articles'}
              </p>
            </div>
          </div>
        </div>

        {/* Panel Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedArticles.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="w-12 h-12 text-zinc-700 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
              <p className="text-zinc-400 text-sm mb-1">No saved articles</p>
              <p className="text-xs text-zinc-500 max-w-[180px]">
                Click the star icon on any article to save it
              </p>
            </div>
          ) : (
            /* Saved Articles List */
            <div className="space-y-2">
              {sortedArticles.map(article => (
                <SavedArticleItem
                  key={article.id}
                  article={article}
                  onUnsave={() => onUnsave(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// Inline SavedArticleItem component
interface SavedArticleItemProps {
  article: SavedArticleData
  onUnsave: () => void
}

function SavedArticleItem({ article, onUnsave }: SavedArticleItemProps) {
  const handleClick = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  const handleUnsave = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUnsave()
  }

  return (
    <div
      className="bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors cursor-pointer group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isValidCategory(article.category) && (
            <CategoryBadge category={article.category} />
          )}
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              article.importanceLabel === 'BREAKING'
                ? 'bg-red-500/20 text-red-400'
                : article.importanceLabel === 'MAJOR'
                ? 'bg-blue-500/20 text-blue-400'
                : article.importanceLabel === 'NOTABLE'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-zinc-500/20 text-zinc-400'
            }`}
          >
            {article.importanceLabel}
          </span>
        </div>

        <button
          onClick={handleUnsave}
          className="text-amber-400 hover:text-amber-300 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove from saved"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      </div>

      <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 mb-1.5">
        {article.title}
      </h3>

      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <span>{article.source}</span>
        <span>•</span>
        <span>{formatArticleDate(article.publishedAt)}</span>
      </div>
    </div>
  )
}
