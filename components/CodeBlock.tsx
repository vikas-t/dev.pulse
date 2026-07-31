'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showCopy?: boolean
  showLineNumbers?: boolean
  maxHeight?: string
}

export function CodeBlock({
  code,
  language = 'bash',
  filename,
  showCopy = true,
  showLineNumbers = true,
  maxHeight = '400px',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const lines = code.split('\n')
  const hasMultipleLines = lines.length > 1
  const shouldShowLineNumbers = showLineNumbers && hasMultipleLines

  const handleCopy = async () => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="code-block rounded-lg border border-zinc-700/60 overflow-hidden bg-[#0d1117]">
      {/* Header bar */}
      <div className="code-block-header flex items-center justify-between px-4 py-2 bg-zinc-800/70 border-b border-zinc-700/40">
        <div className="flex items-center gap-3 min-w-0">
          {/* Language badge */}
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0">
            {language}
          </span>
          {/* Filename */}
          {filename && (
            <>
              <span className="text-zinc-600 shrink-0">·</span>
              <span
                className="text-xs text-zinc-500 font-mono truncate"
                title={filename}
              >
                {filename}
              </span>
            </>
          )}
        </div>
        {showCopy && (
          <button
            onClick={handleCopy}
            className={`code-block-copy shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 ${
              copied
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 hover:text-zinc-100'
            }`}
            aria-label={copied ? 'Copied' : 'Copy code'}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* Code area */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <pre className="code-block-pre p-4 m-0 text-sm leading-relaxed overflow-x-auto">
          <code className="font-mono text-zinc-200">
            {lines.map((line, i) => (
              <span key={i} className="code-block-line flex leading-6">
                {shouldShowLineNumbers && (
                  <span className="code-block-line-number flex-shrink-0 w-10 pr-4 text-right select-none text-zinc-600 text-xs leading-6">
                    {i + 1}
                  </span>
                )}
                <span className="whitespace-pre-wrap flex-1">{line || ' '}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
