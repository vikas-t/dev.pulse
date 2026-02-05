'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

export function useToast(duration: number = 2000) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'success') => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setToast({ message, type })

      // Auto-dismiss after duration
      timeoutRef.current = setTimeout(() => {
        setToast(null)
      }, duration)
    },
    [duration]
  )

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setToast(null)
  }, [])

  return { toast, showToast, hideToast }
}
