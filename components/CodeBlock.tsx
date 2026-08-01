'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

interface CodeBlockProps {
  code: string
  language?: string
  showCopy?: boolean
}

export function CodeBlock({ code, language = 'bash', showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative group">
      {/* Header bar showing language + copy button */}
      <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-t-lg px-4 py-1.5">
        <span className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/70" aria-hidden="true"></span>
          {language}
        </span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-300 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        )}
      </div>
      {/* Code body */}
      <pre className="bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono text-zinc-300">{code}</code>
      </pre>
    </div>
  )
}
