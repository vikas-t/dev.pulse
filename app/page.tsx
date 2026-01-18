'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { DevArticleCard } from '@/components/DevArticleCard'

interface RefreshStatus {
  canRefresh: boolean
  lastRefreshAt: string | null
  nextRefreshAt: string | null
}

interface RefreshResult {
  success: boolean
  rateLimited?: boolean
  message: string
  nextRefreshAt?: string
  stats?: {
    articlesProcessed: number
    articlesSaved: number
    duration: string
  }
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
  section?: 'critical' | 'noteworthy' | 'spotlight'
}

// Mock data for development (when database is empty)
const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Transformers 4.36.0: New LLM Support and Breaking Changes',
    url: 'https://github.com/huggingface/transformers/releases/tag/v4.36.0',
    source: 'github',
    category: 'breaking',
    importanceLabel: 'BREAKING',
    importanceScore: 95,
    tags: ['🔴'],
    summary: [
      'Added support for Phi-2 and Mixtral models',
      'BREAKING: Removed deprecated AutoModelWithLMHead class',
      'Performance improvements for inference',
    ],
    insight: 'If you\'re using AutoModelWithLMHead in production, you\'ll need to migrate to AutoModelForCausalLM. This affects all LLM-based applications using older Transformers patterns.',
    codeExample: `from transformers import AutoModelForCausalLM, AutoTokenizer

# Load model and tokenizer
model = AutoModelForCausalLM.from_pretrained("microsoft/phi-2")
tokenizer = AutoTokenizer.from_pretrained("microsoft/phi-2")

# Generate text
inputs = tokenizer("Hello, I am", return_tensors="pt")
outputs = model.generate(**inputs, max_length=50)
print(tokenizer.decode(outputs[0]))`,
    codeLanguage: 'python',
    installCommand: 'pip install transformers==4.36.0',
    migrationGuide: `# Old (deprecated)
from transformers import AutoModelWithLMHead
model = AutoModelWithLMHead.from_pretrained("gpt2")

# New (v4.36.0+)
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained("gpt2")`,
    languages: ['python'],
    frameworks: ['transformers', 'pytorch'],
    topics: ['llm', 'fine-tuning'],
    githubRepo: 'huggingface/transformers',
    githubStars: 125000,
    githubLanguage: 'Python',
    publishedAt: new Date('2024-01-07'),
  },
  {
    id: '2',
    title: 'LangChain 0.1.0: Stable API Release',
    url: 'https://github.com/langchain-ai/langchain/releases/tag/v0.36.0',
    source: 'github',
    category: 'breaking',
    importanceLabel: 'MAJOR',
    importanceScore: 88,
    tags: ['🚀', '🔴'],
    summary: [
      'First stable release with breaking changes to LCEL syntax',
      'New streaming API for real-time responses',
      'Improved RAG support with better vector store integrations',
    ],
    insight: 'LCEL chain syntax has changed. If you have production LangChain apps, review the migration guide to avoid runtime errors.',
    codeExample: `from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

# New LCEL syntax
prompt = ChatPromptTemplate.from_template("Tell me a joke about {topic}")
model = ChatOpenAI()
chain = prompt | model | StrOutputParser()

result = chain.invoke({"topic": "AI"})
print(result)`,
    codeLanguage: 'python',
    installCommand: 'pip install langchain==0.1.0 langchain-openai',
    languages: ['python'],
    frameworks: ['langchain', 'openai'],
    topics: ['llm', 'rag', 'agents'],
    githubRepo: 'langchain-ai/langchain',
    githubStars: 75000,
    githubLanguage: 'Python',
    publishedAt: new Date('2024-01-06'),
  },
  {
    id: '3',
    title: 'Ollama: Run Llama 2, Code Llama locally',
    url: 'https://github.com/ollama/ollama',
    source: 'github',
    category: 'library',
    importanceLabel: 'MAJOR',
    importanceScore: 82,
    tags: ['⭐', '🛠️'],
    summary: [
      'Run LLMs locally on macOS, Linux, and Windows',
      'Optimized inference with GPU acceleration',
      'Simple API compatible with OpenAI client libraries',
    ],
    insight: 'Perfect for local development and testing LLM features without API costs. Drop-in replacement for OpenAI API calls during development.',
    codeExample: `# Using Ollama with OpenAI-compatible API
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"  # required but unused
)

response = client.chat.completions.create(
    model="llama2",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
    codeLanguage: 'python',
    installCommand: 'curl https://ollama.ai/install.sh | sh',
    languages: ['go', 'python', 'javascript'],
    frameworks: ['ollama'],
    topics: ['llm', 'local-llm'],
    githubRepo: 'ollama/ollama',
    githubStars: 45000,
    githubLanguage: 'Go',
    publishedAt: new Date('2024-01-05'),
  },
]

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalArticles, setTotalArticles] = useState(0)

  // Refresh state
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  // Ref for IntersectionObserver sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Refs to avoid stale closures in IntersectionObserver
  const offsetRef = useRef(offset)
  const hasMoreRef = useRef(hasMore)
  const loadingMoreRef = useRef(loadingMore)
  const isRefreshingRef = useRef(isRefreshing)

  // Keep refs in sync with state
  useEffect(() => {
    offsetRef.current = offset
    hasMoreRef.current = hasMore
    loadingMoreRef.current = loadingMore
    isRefreshingRef.current = isRefreshing
  }, [offset, hasMore, loadingMore, isRefreshing])

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

  // Fetch articles with pagination support
  const fetchArticles = useCallback(async (newOffset: number, append: boolean = false) => {
    try {
      const loadingState = newOffset === 0 ? setLoading : setLoadingMore
      loadingState(true)

      const response = await fetch(`/api/articles/today?limit=10&offset=${newOffset}`)

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && (data.articles.length > 0 || newOffset > 0)) {
        // Use API data if we have articles, or if this is not the first page
        setArticles(prev => append ? [...prev, ...data.articles] : data.articles)
        setHasMore(data.hasMore ?? false)
        setTotalArticles(data.total ?? data.articles.length)
        setOffset(newOffset)
      } else if (newOffset === 0) {
        // Use mock data on initial load when API returns empty or fails
        console.log('Using mock data (database empty or error)')
        setArticles(MOCK_ARTICLES)
        setHasMore(false)
        setTotalArticles(MOCK_ARTICLES.length)
      }
    } catch (err) {
      console.error('Error fetching articles:', err)
      if (newOffset === 0) {
        // Fallback to mock data on initial load error
        setArticles(MOCK_ARTICLES)
        setHasMore(false)
        setTotalArticles(MOCK_ARTICLES.length)
      } else {
        // Show error for pagination failures
        setArticles(prev => {
          setTotalArticles(currentTotal => {
            setError(`Failed to load more. Showing ${prev.length} of ${currentTotal}+ articles.`)
            return currentTotal
          })
          return prev
        })
      }
    } finally {
      const loadingState = newOffset === 0 ? setLoading : setLoadingMore
      loadingState(false)
    }
  }, [])

  // Handle refresh button click
  const handleRefresh = async () => {
    if (isRefreshing || !refreshStatus?.canRefresh) return

    setIsRefreshing(true)
    setRefreshMessage(null)

    try {
      const response = await fetch('/api/refresh', { method: 'POST' })
      const data: RefreshResult = await response.json()

      if (data.rateLimited) {
        setRefreshMessage('Already refreshed today. Try again tomorrow.')
      } else if (data.success) {
        setRefreshMessage(`Refreshed! ${data.stats?.articlesSaved || 0} articles updated.`)
        // Reset pagination and scroll to top
        setArticles([])
        setOffset(0)
        setHasMore(true)
        setTotalArticles(0)
        window.scrollTo(0, 0)
        // Re-fetch first page
        await fetchArticles(0, false)
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

  useEffect(() => {
    fetchRefreshStatus()
  }, [fetchRefreshStatus])

  // Initial load
  useEffect(() => {
    fetchArticles(0, false)
  }, [fetchArticles])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Use refs to avoid stale closure
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingMoreRef.current &&
          !isRefreshingRef.current
        ) {
          const currentOffset = offsetRef.current
          console.log(`[Scroll] Triggered load more, current offset=${currentOffset}`)
          fetchArticles(currentOffset + 10, true)
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [fetchArticles])

  // Expose load more function for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__loadMore = () => {
        // Use refs to get current values
        if (hasMoreRef.current && !loadingMoreRef.current && !isRefreshingRef.current) {
          fetchArticles(offsetRef.current + 10, true)
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
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">
                dev.pulse
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                {totalArticles > 0
                  ? `${articles.length} of ${totalArticles} AI Updates (Last 3 Days)`
                  : `Today's Top ${articles.length} AI Updates for Developers`
                }
              </p>
            </div>

            {/* Refresh Button */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || !refreshStatus?.canRefresh}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isRefreshing
                    ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                    : refreshStatus?.canRefresh
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-zinc-100'
                      : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                  }
                `}
                title={
                  refreshStatus?.canRefresh
                    ? 'Fetch latest articles'
                    : refreshStatus?.nextRefreshAt
                      ? `Next refresh available at ${new Date(refreshStatus.nextRefreshAt).toLocaleTimeString()}`
                      : 'Refresh unavailable'
                }
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
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {refreshMessage && (
                <p className={`text-xs ${refreshMessage.includes('failed') || refreshMessage.includes('Already') ? 'text-amber-400' : 'text-green-400'}`}>
                  {refreshMessage}
                </p>
              )}

              {!refreshStatus?.canRefresh && refreshStatus?.nextRefreshAt && (
                <p className="text-xs text-zinc-500">
                  Next refresh: {new Date(refreshStatus.nextRefreshAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg mb-2">No articles yet</p>
            <p className="text-zinc-600 text-sm">
              Run the pipeline to fetch and process articles
            </p>
            <p className="text-zinc-600 text-xs mt-4 font-mono">
              curl http://localhost:3000/api/cron/test
            </p>
          </div>
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
                      <DevArticleCard key={article.id} article={article} index={index} />
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
                      <DevArticleCard key={article.id} article={article} index={index} />
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
                      <DevArticleCard key={article.id} article={article} index={index} />
                    ))}
                </div>
              </section>
            )}

            {/* Sentinel for infinite scroll */}
            <div ref={loadMoreRef} className="h-20" />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-3 text-zinc-400">Loading more articles...</span>
              </div>
            )}

            {/* End of feed message */}
            {!hasMore && articles.length > 0 && !loadingMore && (
              <div className="text-center py-8 text-zinc-500 border-t border-zinc-800 mt-8">
                <p className="text-sm">That's all for the last 3 days!</p>
                <p className="text-xs mt-2">Showing {articles.length} of {totalArticles} articles</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="text-center py-8">
                <p className="text-amber-400 text-sm">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    fetchArticles(offset + 10, true)
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
  )
}
