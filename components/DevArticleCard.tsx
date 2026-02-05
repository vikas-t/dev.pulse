'use client'

import { useState } from 'react'
import { CategoryBadge } from './CategoryBadge'
import { CodeBlock } from './CodeBlock'
import { SaveButton } from './SaveButton'
import { formatArticleDate } from '@/lib/utils/formatDate'

interface Article {
  id: string
  title: string
  url: string
  source: string
  category: 'breaking' | 'library' | 'sdk' | 'launch' | 'trending' | 'industry' | 'tools' | 'performance' | 'known_issue' | 'case_study' | 'research' | 'community' | 'security'
  importanceLabel: 'BREAKING' | 'MAJOR' | 'NOTABLE' | 'INFO' | 'NOISE'
  importanceScore: number
  tags: string[]  // Emoji tags for visual scanning

  // Content
  summary: string[]
  insight?: string | null
  codeExample?: string | null
  codeLanguage?: string | null
  installCommand?: string | null
  migrationGuide?: string | null

  // Tech stack
  languages: string[]
  frameworks: string[]
  topics: string[]

  // GitHub
  githubRepo?: string | null
  githubStars?: number | null
  githubLanguage?: string | null

  // Metadata
  author?: string | null
  publishedAt: Date | string
  hnDiscussionUrl?: string | null
}

interface DevArticleCardProps {
  article: Article
  index?: number
  isSaved?: boolean
  onToggleSave?: () => void
}

// Helper to get tooltip text for emoji tags
function getTagTooltip(tag: string): string {
  const tooltips: Record<string, string> = {
    '🔴': 'BREAKING - Breaking changes',
    '🐛': 'KNOWN ISSUE - Bugs/warnings',
    '🚀': 'LAUNCH - Product launches',
    '⭐': 'TRENDING - GitHub fast-growers',
    '⚡': 'PERFORMANCE - Speed/benchmarks',
    '🛠️': 'TOOLS - Developer tools',
    '🏭': 'CASE STUDY - Production stories',
    '📰': 'INDUSTRY - Company news',
    '🔒': 'SECURITY - CVEs/vulnerabilities',
  }
  return tooltips[tag] || tag
}

export function DevArticleCard({ article, index, isSaved = false, onToggleSave }: DevArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Smart Emoji Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {article.tags.map((tag, i) => (
                <span key={i} className="text-base" title={getTagTooltip(tag)}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <CategoryBadge category={article.category} />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            article.importanceLabel === 'BREAKING' ? 'bg-red-500/20 text-red-400' :
            article.importanceLabel === 'MAJOR' ? 'bg-blue-500/20 text-blue-400' :
            article.importanceLabel === 'NOTABLE' ? 'bg-green-500/20 text-green-400' :
            article.importanceLabel === 'INFO' ? 'bg-zinc-500/20 text-zinc-400' :
            'bg-zinc-600/20 text-zinc-500'  // NOISE
          }`}>
            {article.importanceLabel}
          </span>
          {index !== undefined && (
            <span className="text-xs text-zinc-600 font-mono">{index + 1}</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {article.githubRepo && (
            <>
              <span className="font-mono">{article.githubRepo}</span>
              {article.githubStars && (
                <span className="flex items-center gap-1">
                  ⭐ {article.githubStars.toLocaleString()}
                </span>
              )}
              <span>•</span>
            </>
          )}
          <span className="text-zinc-400">{formatArticleDate(article.publishedAt)}</span>
          {onToggleSave && (
            <SaveButton isSaved={isSaved} onToggle={onToggleSave} size="sm" />
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-zinc-100 mb-3 hover:text-blue-400 cursor-pointer">
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          {article.title}
        </a>
      </h3>

      {/* Installation Command (if available) */}
      {article.installCommand && (
        <div className="mb-4">
          <CodeBlock
            code={article.installCommand}
            language={article.codeLanguage || 'bash'}
            showCopy={true}
          />
        </div>
      )}

      {/* Summary Bullets (always visible) */}
      <ul className="space-y-1 mb-4 text-sm text-zinc-300">
        {article.summary.slice(0, 3).map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Tech Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {article.languages.map(lang => (
          <span key={lang} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
            {lang}
          </span>
        ))}
        {article.frameworks.map(fw => (
          <span key={fw} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/20">
            {fw}
          </span>
        ))}
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-400 hover:text-blue-300 font-medium"
      >
        {isExpanded ? '↑ Show less' : '↓ Show more'}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-zinc-800 space-y-6">
          {/* Code Example */}
          {article.codeExample && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-400 mb-2">Quick Start</h4>
              <CodeBlock code={article.codeExample} language={article.codeLanguage || 'python'} />
            </div>
          )}

          {/* Insight */}
          {article.insight && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-400 mb-2">Why It Matters for Your Code</h4>
              <p className="text-sm text-zinc-300 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                {article.insight}
              </p>
            </div>
          )}

          {/* Migration Guide */}
          {article.migrationGuide && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-400 mb-2">Migration Guide</h4>
              <CodeBlock code={article.migrationGuide} language={article.codeLanguage || 'python'} />
            </div>
          )}

          {/* Discussion Links */}
          <div className="flex gap-4 text-sm">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View Source →
            </a>
            {article.hnDiscussionUrl && (
              <a
                href={article.hnDiscussionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300"
              >
                HN Discussion →
              </a>
            )}
            {article.githubRepo && (
              <a
                href={`https://github.com/${article.githubRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                GitHub →
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
