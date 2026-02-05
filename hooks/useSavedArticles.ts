'use client'

import { useContext } from 'react'
import { SavedArticlesContext, SavedArticlesContextValue } from '@/lib/context/SavedArticlesContext'

export function useSavedArticles(): SavedArticlesContextValue {
  const context = useContext(SavedArticlesContext)
  if (!context) {
    throw new Error('useSavedArticles must be used within SavedArticlesProvider')
  }
  return context
}
