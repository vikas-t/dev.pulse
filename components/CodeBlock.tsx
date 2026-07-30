'use client'

import { useState } from 'react'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'

interface CodeBlockProps {
  code: string
  language?: string
  showCopy?: boolean
}

export function CodeBlock({ code, language = 'bash', showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const result = await copyToClipboardWithFeedback(code, { trim: true })
    if (result.success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      // Brief flash of the error so the user knows what happened
      setCopied(false)
    }
  }

  return (
    <div className="relative group">
      <div className="absolute -top-3 left-3 px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400 font-mono">
        {language}
      </div>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      )}
      <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono text-zinc-300">{code}</code>
      </pre>
    </div>
  )
}
