'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { DevArticleCard } from '@/components/DevArticleCard'
import { SavedArticlesPanel } from '@/components/SavedArticlesPanel'
import { Toast } from '@/components/Toast'
import { useSavedArticles } from '@/hooks/useSavedArticles'
import { useToast } from '@/hooks/useToast'
import { formatArticleDate } from '@/lib/utils/formatDate'

interface RefreshStatus {
  lastRefreshAt: string | null
}

interface RefreshResult {
  success: boolean
  message: string
  lastRefreshAt?: string | null
}

interface Article {
  id: string
  title: string
  url: string
  source: string
  category: 'breaking' | 'library' | 'sdk' | 'launch' | 'trending' | 'industry' | 'tools' | 'performance' | 'known_issue' | 'case_study' | 'research' | 'community' | 'security'
  importanceLabel: 'BREAKING' | 'MAJOR' | 'NOTABLE' | 'INFO' | 'NOISE'
  importanceScore: number
  tags: string[]
  summary: string[]
  insight?: string | null
  codeExample?: string | null
  codeLanguage?: string | null
  installCommand?: string | null
  migrationGuide?: string | null
  languages: string[]
  frameworks: string[]
  topics: string[]
  githubRepo?: string | null
  githubStars?: number | null
  githubLanguage?: string | null
  author?: string | null
  publishedAt: Date | string
  hnDiscussionUrl?: string | null
  section?: 'critical' | 'noteworthy' | 'spotlight' | 'historical'
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalArticles, setTotalArticles] = useState(0)

  // Historical data state (for unlimited scroll)
  const [inHistoricalMode, setInHistoricalMode] = useState(false)
  const [historicalOffset, setHistoricalOffset] = useState(0)
  const [oldestDate, setOldestDate] = useState<string | null>(null)

  // Refresh state
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  // Saved articles panel state (collapsed by default)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true)
  const { savedArticles, isSaved, saveArticle, unsaveArticle, savedCount } = useSavedArticles()
  const { toast, showToast, hideToast } = useToast()

  // Ref for IntersectionObserver sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Refs to avoid stale closures in IntersectionObserver
  const offsetRef = useRef(offset)
  const hasMoreRef = useRef(hasMore)
  const loadingMoreRef = useRef(loadingMore)
  const isRefreshingRef = useRef(isRefreshing)
  const inHistoricalModeRef = useRef(inHistoricalMode)
  const historicalOffsetRef = useRef(historicalOffset)

  // Keep refs in sync with state
  useEffect(() => {
    offsetRef.current = offset
    hasMoreRef.current = hasMore
    loadingMoreRef.current = loadingMore
    isRefreshingRef.current = isRefreshing
    inHistoricalModeRef.current = inHistoricalMode
    historicalOffsetRef.current = historicalOffset
  }, [offset, hasMore, loadingMore, isRefreshing, inHistoricalMode, historicalOffset])

  // Fetch refresh status
  const fetchRefreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/refresh')
      const data = await response.json()
      setRefreshStatus(data)
    } catch (err) {
      console.error('Error fetching refresh status:', err)
    }
  }, [])

  // Fetch articles with pagination support (including historical data)
  const fetchArticles = useCallback(async (newOffset: number, append: boolean = false, fetchHistorical: boolean = false) => {
    try {
      const loadingState = newOffset === 0 && !fetchHistorical ? setLoading : setLoadingMore
      loadingState(true)

      // Build URL based on whether we're fetching historical data
      const url = fetchHistorical
        ? `/api/articles/today?limit=10&offset=${newOffset}&older=true`
        : `/api/articles/today?limit=10&offset=${newOffset}`

      console.log(`[Fetch] ${fetchHistorical ? 'Historical' : 'Recent'} data, offset=${newOffset}`)

      const response = await fetch(url)

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch articles')
      }

      // Use API data - deduplication happens inside setArticles to use current state
      setArticles(prev => {
        if (!append) {
          return data.articles
        }
        // Deduplicate articles when appending (especially important at cache/historical boundary)
        const existingUrls = new Set(prev.map(a => a.url))
        const newArticles = data.articles.filter((a: Article) => !existingUrls.has(a.url))
        return [...prev, ...newArticles]
      })
      setHasMore(data.hasMore ?? false)

      // Update oldest date if provided
      if (data.oldestDate) {
        setOldestDate(data.oldestDate)
      }

      // Track offsets based on mode
      if (fetchHistorical) {
        // Update historical offset to next position
        const nextHistoricalOffset = newOffset + data.articles.length
        setHistoricalOffset(nextHistoricalOffset)
        // Sync ref immediately to avoid stale closure issues
        historicalOffsetRef.current = nextHistoricalOffset
      } else {
        setTotalArticles(data.total ?? data.articles.length)
        setOffset(newOffset)

        // Transition to historical mode when recent data is exhausted
        // This can happen on initial load (append=false) if very few recent articles exist,
        // or during infinite scroll (append=true) when we reach the end of recent data
        if (!data.hasMore) {
          console.log('[Scroll] Recent data exhausted, entering historical mode')
          setInHistoricalMode(true)
          inHistoricalModeRef.current = true
          setHasMore(true) // Reset hasMore - there may be historical data
          hasMoreRef.current = true
          setHistoricalOffset(0)
          historicalOffsetRef.current = 0
        }
      }
    } catch (err) {
      console.error('Error fetching articles:', err)
      if (newOffset === 0 && !fetchHistorical) {
        // Initial load failed — show error state with retry
        setError('Could not load articles. Please check your connection and try again.')
      } else {
        // Show error for pagination failures
        setArticles(prev => {
          setError(`Failed to load more articles. Showing ${prev.length} articles.`)
          return prev
        })
      }
    } finally {
      const loadingState = newOffset === 0 && !fetchHistorical ? setLoading : setLoadingMore
      loadingState(false)
    }
  }, [])

  // Handle refresh button click — refetches the latest feed
  // (data freshness comes from the scheduled pipeline, not this button)
  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    setRefreshMessage(null)

    try {
      const response = await fetch('/api/refresh', { method: 'POST' })
      const data: RefreshResult = await response.json()

      if (data.success) {
        // Reset pagination and scroll to top (including historical state)
        setArticles([])
        setOffset(0)
        setHasMore(true)
        setTotalArticles(0)
        setInHistoricalMode(false)
        setHistoricalOffset(0)
        setOldestDate(null)
        window.scrollTo(0, 0)
        // Re-fetch first page
        await fetchArticles(0, false)
        setRefreshMessage('Feed updated')
      } else {
        setRefreshMessage('Refresh failed. Please try again later.')
      }

      // Update refresh status
      await fetchRefreshStatus()
    } catch (err) {
      console.error('Error refreshing:', err)
      setRefreshMessage('Refresh failed. Please try again later.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle toggling save state for an article
  const handleToggleSave = useCallback((article: Article) => {
    if (isSaved(article.id)) {
      unsaveArticle(article.id)
      showToast('Removed from saved')
    } else {
      const success = saveArticle(article)
      if (success) {
        showToast('Article saved')
      } else {
        showToast('Maximum 100 articles saved', 'error')
      }
    }
  }, [isSaved, saveArticle, unsaveArticle, showToast])

  useEffect(() => {
    fetchRefreshStatus()
  }, [fetchRefreshStatus])

  // Initial load
  useEffect(() => {
    fetchArticles(0, false)
  }, [fetchArticles])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current) {
      console.log('[Scroll] Sentinel ref not available yet')
      return
    }

    // Don't set up observer if no articles loaded yet
    if (articles.length === 0) {
      console.log('[Scroll] No articles yet, skipping observer setup')
      return
    }

    console.log('[Scroll] Setting up IntersectionObserver', {
      hasMore: hasMoreRef.current,
      offset: offsetRef.current,
      historicalOffset: historicalOffsetRef.current,
      inHistoricalMode: inHistoricalModeRef.current,
      loadingMore: loadingMoreRef.current,
      isRefreshing: isRefreshingRef.current,
      articlesCount: articles.length
    })

    const observer = new IntersectionObserver(
      (entries) => {
        console.log('[Scroll] Observer callback triggered', {
          isIntersecting: entries[0].isIntersecting,
          hasMore: hasMoreRef.current,
          loadingMore: loadingMoreRef.current,
          isRefreshing: isRefreshingRef.current,
          inHistoricalMode: inHistoricalModeRef.current,
          offset: offsetRef.current,
          historicalOffset: historicalOffsetRef.current
        })

        // Use refs to avoid stale closure
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingMoreRef.current &&
          !isRefreshingRef.current
        ) {
          // Determine which offset to use based on mode
          // Note: historicalOffsetRef tracks the NEXT offset to fetch, offsetRef tracks CURRENT
          if (inHistoricalModeRef.current) {
            const nextHistoricalOffset = historicalOffsetRef.current
            console.log(`[Scroll] ✅ Loading historical articles, offset=${nextHistoricalOffset}`)
            fetchArticles(nextHistoricalOffset, true, true)
          } else {
            const currentOffset = offsetRef.current
            console.log(`[Scroll] ✅ Loading recent articles, offset=${currentOffset + 10}`)
            fetchArticles(currentOffset + 10, true, false)
          }
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(loadMoreRef.current)
    console.log('[Scroll] Observer attached to sentinel')

    return () => {
      console.log('[Scroll] Cleaning up observer')
      observer.disconnect()
    }
  }, [fetchArticles, articles.length])

  // Expose load more function for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__loadMore = () => {
        // Use refs to get current values
        if (hasMoreRef.current && !loadingMoreRef.current && !isRefreshingRef.current) {
          if (inHistoricalModeRef.current) {
            // historicalOffsetRef already tracks NEXT offset to fetch
            fetchArticles(historicalOffsetRef.current, true, true)
          } else {
            fetchArticles(offsetRef.current + 10, true, false)
          }
        }
      }
    }
  }, [fetchArticles])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 rounded w-64 mb-2"></div>
            <div className="h-4 bg-zinc-800 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-zinc-900 rounded-lg border border-zinc-800"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Persistent Saved Articles Sidebar */}
      <SavedArticlesPanel
        isCollapsed={isPanelCollapsed}
        onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
        savedArticles={savedArticles}
        onUnsave={(id) => {
          unsaveArticle(id)
          showToast('Removed from saved')
        }}
      />

      {/* Main content wrapper - shifts right when panel is expanded */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isPanelCollapsed ? 'sm:ml-12' : 'sm:ml-80'}
        `}
      >
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              {/* Left side: Mobile hamburger + Title */}
              <div className="flex items-center gap-3">
                {/* Mobile hamburger menu - only visible on mobile */}
                <button
                  onClick={() => setIsPanelCollapsed(false)}
                  className="sm:hidden p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Open saved articles panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div>
                  <h1 className="text-2xl font-bold text-zinc-100">
                    dev.pulse
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1 hidden sm:block">
                    {oldestDate
                      ? `${articles.length} AI Updates (through ${new Date(oldestDate).toLocaleDateString()})`
                      : totalArticles > 0
                        ? `${articles.length} of ${totalArticles} AI Updates (Last 3 Days)`
                        : `Today's Top ${articles.length} AI Updates for Developers`
                    }
                  </p>
                </div>
              </div>

              {/* Right side: Refresh button */}
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isRefreshing
                      ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-zinc-100'
                    }
                  `}
                  title="Reload the latest articles"
                >
                  <svg
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                {refreshMessage && (
                  <p className={`text-xs hidden sm:block ${refreshMessage.includes('failed') || refreshMessage.includes('Already') ? 'text-amber-400' : 'text-green-400'}`}>
                    {refreshMessage}
                  </p>
                )}

                {refreshStatus?.lastRefreshAt && (
                  <p className="text-xs text-zinc-500 hidden sm:block">
                    Last updated: {formatArticleDate(refreshStatus.lastRefreshAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {articles.length === 0 ? (
          error ? (
            <div className="text-center py-16">
              <p className="text-amber-400 text-lg mb-2">Couldn&apos;t load articles</p>
              <p className="text-zinc-500 text-sm mb-6">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  fetchArticles(0, false)
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-zinc-400 text-lg mb-2">No articles yet</p>
              <p className="text-zinc-600 text-sm">
                New articles arrive with the next scheduled fetch — check back soon
              </p>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {/* Critical Section */}
            {articles.filter(a => a.section === 'critical').length > 0 && (
              <section>
                <div className="mb-4 pb-2 border-b border-red-900/30">
                  <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <span>🔴</span>
                    <span>Critical & Breaking</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Breaking changes, security updates, critical bugs
                  </p>
                </div>
                <div className="space-y-6">
                  {articles
                    .filter(a => a.section === 'critical')
                    .map((article, index) => (
                      <DevArticleCard
                        key={article.id}
                        article={article}
                        index={index}
                        isSaved={isSaved(article.id)}
                        onToggleSave={() => handleToggleSave(article)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Noteworthy Section */}
            {articles.filter(a => a.section === 'noteworthy' || !a.section).length > 0 && (
              <section>
                <div className="mb-4 pb-2 border-b border-green-900/30">
                  <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                    <span>🟢</span>
                    <span>New & Noteworthy</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Launches, tools, trending projects, performance insights
                  </p>
                </div>
                <div className="space-y-6">
                  {articles
                    .filter(a => a.section === 'noteworthy' || !a.section)
                    .map((article, index) => (
                      <DevArticleCard
                        key={article.id}
                        article={article}
                        index={index}
                        isSaved={isSaved(article.id)}
                        onToggleSave={() => handleToggleSave(article)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* GitHub Spotlight Section */}
            {articles.filter(a => a.section === 'spotlight').length > 0 && (
              <section>
                <div className="mb-4 pb-2 border-b border-purple-900/30">
                  <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <span>⭐</span>
                    <span>GitHub Spotlight</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Fastest-growing AI/ML repositories
                  </p>
                </div>
                <div className="space-y-6">
                  {articles
                    .filter(a => a.section === 'spotlight')
                    .map((article, index) => (
                      <DevArticleCard
                        key={article.id}
                        article={article}
                        index={index}
                        isSaved={isSaved(article.id)}
                        onToggleSave={() => handleToggleSave(article)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Earlier Articles Section (Historical Data) */}
            {articles.filter(a => a.section === 'historical').length > 0 && (
              <section className="mt-8">
                <div className="mb-4 pb-2 border-b border-amber-900/30">
                  <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span>📚</span>
                    <span>Earlier Articles</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Older articles sorted by importance
                  </p>
                </div>
                <div className="space-y-6">
                  {articles
                    .filter(a => a.section === 'historical')
                    .map((article, index) => (
                      <DevArticleCard
                        key={article.id}
                        article={article}
                        index={index}
                        isSaved={isSaved(article.id)}
                        onToggleSave={() => handleToggleSave(article)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Sentinel for infinite scroll */}
            <div ref={loadMoreRef} className="h-20" />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex flex-col items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="mt-3 text-zinc-400">
                  {inHistoricalMode ? 'Loading from archive...' : 'Loading more articles...'}
                </span>
                {inHistoricalMode && (
                  <span className="text-xs text-zinc-500 mt-1">
                    Searching historical data
                  </span>
                )}
              </div>
            )}

            {/* End of feed message */}
            {!hasMore && articles.length > 0 && !loadingMore && (
              <div className="text-center py-8 text-zinc-500 border-t border-zinc-800 mt-8">
                <p className="text-sm">
                  {inHistoricalMode
                    ? "You've reached the end of our archive!"
                    : "That's all for the last 3 days!"
                  }
                </p>
                <p className="text-xs mt-2">
                  Showing {articles.length} articles
                  {oldestDate && ` (oldest from ${new Date(oldestDate).toLocaleDateString()})`}
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="text-center py-8">
                <p className="text-amber-400 text-sm">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    if (inHistoricalMode) {
                      // historicalOffset already tracks NEXT offset to fetch
                      fetchArticles(historicalOffset, true, true)
                    } else {
                      fetchArticles(offset + 10, true, false)
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 mt-16">
          <div className="mx-auto max-w-4xl px-6 py-8 text-center text-zinc-600 text-sm">
            <p>Built with Next.js, Tailwind, and Claude Code</p>
          </div>
        </footer>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  )
}
