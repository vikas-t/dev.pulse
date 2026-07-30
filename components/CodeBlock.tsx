'use client'

import { useState, useCallback } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

interface CodeBlockProps {
  code: string
  language?: string
  showCopy?: boolean
}

export function CodeBlock({ code, language = 'bash', showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  return (
    <div className="relative group">
      <div className="absolute -top-3 left-3 px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400 font-mono">
        {language}
      </div>
      {showCopy && (
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
          className={`
            absolute top-2 right-2 p-1.5 rounded-md
            transition-all duration-150 ease-in-out
            hover:scale-110 active:scale-95
            ${copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80'
            }
          `}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      )}
      <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono text-zinc-300">{code}</code>
      </pre>
    </div>
  )
}
