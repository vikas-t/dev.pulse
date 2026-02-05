'use client'

import { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'

// Matches the Article interface from page.tsx
export interface SavedArticleData {
  id: string
  savedAt: string // ISO timestamp
  title: string
  url: string
  category: string
  importanceLabel: string
  source: string
  publishedAt: string // For sorting by article date
}

export interface SavedArticlesContextValue {
  savedArticles: SavedArticleData[]
  isSaved: (id: string) => boolean
  saveArticle: (article: {
    id: string
    title: string
    url: string
    category: string
    importanceLabel: string
    source: string
    publishedAt: Date | string
  }) => boolean // Returns false if at limit
  unsaveArticle: (id: string) => void
  savedCount: number
}

const MAX_SAVED_ARTICLES = 100
const STORAGE_KEY = 'pulse_saved_articles'

export const SavedArticlesContext = createContext<SavedArticlesContextValue | null>(null)

export function SavedArticlesProvider({ children }: { children: ReactNode }) {
  const [savedArticles, setSavedArticles] = useState<SavedArticleData[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Validate and filter out invalid entries
          const valid = parsed.filter(
            (item): item is SavedArticleData =>
              item &&
              typeof item.id === 'string' &&
              typeof item.title === 'string' &&
              typeof item.url === 'string'
          )
          setSavedArticles(valid)
        }
      }
    } catch {
      // Invalid localStorage data, start fresh
    }
    setIsInitialized(true)
  }, [])

  // Sync to localStorage when savedArticles changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedArticles))
    } catch {
      // localStorage write failed (quota exceeded or unavailable)
      // Data will be lost on reload but UI remains functional
    }
  }, [savedArticles, isInitialized])

  // Use Set for O(1) lookup
  const savedIdsSet = useMemo(
    () => new Set(savedArticles.map(a => a.id)),
    [savedArticles]
  )

  const isSaved = useCallback(
    (id: string) => savedIdsSet.has(id),
    [savedIdsSet]
  )

  const saveArticle = useCallback(
    (article: {
      id: string
      title: string
      url: string
      category: string
      importanceLabel: string
      source: string
      publishedAt: Date | string
    }): boolean => {
      // Check if already at limit (and not already saved)
      if (savedArticles.length >= MAX_SAVED_ARTICLES && !savedIdsSet.has(article.id)) {
        return false
      }

      const savedData: SavedArticleData = {
        id: article.id,
        savedAt: new Date().toISOString(),
        title: article.title,
        url: article.url,
        category: article.category,
        importanceLabel: article.importanceLabel,
        source: article.source,
        publishedAt: typeof article.publishedAt === 'string'
          ? article.publishedAt
          : article.publishedAt.toISOString(),
      }

      setSavedArticles(prev => {
        // Remove if already exists, then add to front
        const filtered = prev.filter(a => a.id !== article.id)
        return [savedData, ...filtered]
      })

      return true
    },
    [savedArticles.length, savedIdsSet]
  )

  const unsaveArticle = useCallback((id: string) => {
    setSavedArticles(prev => prev.filter(a => a.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      savedArticles,
      isSaved,
      saveArticle,
      unsaveArticle,
      savedCount: savedArticles.length,
    }),
    [savedArticles, isSaved, saveArticle, unsaveArticle]
  )

  return (
    <SavedArticlesContext.Provider value={value}>
      {children}
    </SavedArticlesContext.Provider>
  )
}
