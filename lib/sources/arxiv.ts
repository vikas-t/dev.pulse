import { XMLParser } from 'fast-xml-parser'
import { RawArticle, FetchResult } from './types'

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'

// arXiv API endpoint
const ARXIV_API_URL = 'http://export.arxiv.org/api/query'

// Categories most relevant to software developers
const ARXIV_CATEGORIES = ['cs.AI', 'cs.LG', 'cs.CL']

// Rate limiting: arXiv recommends 3-second delay between requests
const RATE_LIMIT_DELAY_MS = 3000

// Mock arXiv papers for testing
const MOCK_ARXIV_PAPERS: RawArticle[] = [
  {
    title: 'Attention Is All You Need: A Retrospective Analysis',
    url: 'https://arxiv.org/abs/2401.12345',
    source: 'arxiv',
    sourceId: '2401.12345',
    publishedAt: new Date('2024-01-10'),
    content:
      'We revisit the transformer architecture five years after its introduction. This paper analyzes the key design decisions that led to its widespread adoption and proposes minor improvements for modern LLM training. Our experiments show 15% faster convergence on standard benchmarks.',
    excerpt:
      'Retrospective analysis of transformer architecture with proposed improvements for modern LLM training.',
    author: 'Vaswani et al.',
    domain: 'arxiv.org',
  },
  {
    title: 'Efficient Fine-Tuning of Large Language Models with LoRA 2.0',
    url: 'https://arxiv.org/abs/2401.23456',
    source: 'arxiv',
    sourceId: '2401.23456',
    publishedAt: new Date('2024-01-09'),
    content:
      'We present LoRA 2.0, an improved low-rank adaptation method for fine-tuning large language models. Our approach reduces memory requirements by 40% while maintaining model quality. We provide an open-source implementation compatible with HuggingFace Transformers.',
    excerpt:
      'Improved LoRA method reducing memory by 40% with HuggingFace compatibility.',
    author: 'Hu et al.',
    domain: 'arxiv.org',
  },
  {
    title: 'Building Production RAG Systems: Lessons from Industry',
    url: 'https://arxiv.org/abs/2401.34567',
    source: 'arxiv',
    sourceId: '2401.34567',
    publishedAt: new Date('2024-01-08'),
    content:
      'This paper presents practical lessons learned from deploying Retrieval-Augmented Generation systems at scale. We discuss chunking strategies, embedding model selection, and hybrid search approaches. Code examples are provided using LangChain and LlamaIndex.',
    excerpt:
      'Practical guide to production RAG systems with LangChain and LlamaIndex examples.',
    author: 'Chen et al.',
    domain: 'arxiv.org',
  },
]

// XML Parser configuration
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => {
    // These elements can appear multiple times
    return ['entry', 'author', 'link', 'category'].includes(name)
  },
})

interface ArxivEntry {
  id: string
  title: string
  summary: string
  published: string
  updated: string
  author: { name: string }[] | { name: string }
  link: { '@_href': string; '@_rel'?: string; '@_type'?: string }[]
  category: { '@_term': string }[] | { '@_term': string }
  'arxiv:primary_category'?: { '@_term': string }
}

interface ArxivFeed {
  feed: {
    entry?: ArxivEntry[]
    'opensearch:totalResults'?: string
  }
}

/**
 * Sleep for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Extract arXiv ID from URL
 * e.g., "http://arxiv.org/abs/2401.12345v1" -> "2401.12345"
 */
function extractArxivId(url: string): string {
  const match = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/)
  return match ? match[1] : url
}

/**
 * Get first author name from author field
 */
function getFirstAuthor(
  author: { name: string }[] | { name: string } | undefined
): string {
  if (!author) return 'Unknown'
  if (Array.isArray(author)) {
    return author[0]?.name || 'Unknown'
  }
  return author.name || 'Unknown'
}

/**
 * Build arXiv API query URL
 */
function buildQueryUrl(maxResults: number = 20): string {
  // Query for papers in our target categories from the last 7 days
  const categoryQuery = ARXIV_CATEGORIES.map((cat) => `cat:${cat}`).join('+OR+')

  const params = new URLSearchParams({
    search_query: categoryQuery,
    start: '0',
    max_results: String(maxResults),
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  })

  return `${ARXIV_API_URL}?${params.toString()}`
}

/**
 * Parse arXiv Atom XML response into RawArticle array
 */
function parseArxivResponse(xmlData: string): RawArticle[] {
  try {
    const parsed = xmlParser.parse(xmlData) as ArxivFeed

    if (!parsed.feed?.entry) {
      console.log('[arXiv] No entries found in response')
      return []
    }

    const entries = Array.isArray(parsed.feed.entry)
      ? parsed.feed.entry
      : [parsed.feed.entry]

    const articles: RawArticle[] = entries.map((entry) => {
      // Find the abstract page URL (rel="alternate")
      const links = Array.isArray(entry.link) ? entry.link : [entry.link]
      const abstractLink = links.find(
        (l) => l['@_rel'] === 'alternate' && l['@_type'] === 'text/html'
      )
      const url = abstractLink?.['@_href'] || entry.id

      // Clean up title (remove newlines and extra whitespace)
      const title = entry.title.replace(/\s+/g, ' ').trim()

      // Clean up summary/abstract
      const summary = entry.summary.replace(/\s+/g, ' ').trim()

      return {
        title,
        url,
        source: 'arxiv' as const,
        sourceId: extractArxivId(entry.id),
        publishedAt: new Date(entry.published),
        content: summary,
        excerpt:
          summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
        author: getFirstAuthor(entry.author),
        domain: 'arxiv.org',
      }
    })

    return articles
  } catch (error) {
    console.error('[arXiv] Error parsing XML response:', error)
    return []
  }
}

/**
 * Fetch recent AI/ML papers from arXiv
 */
export async function fetchArxivPapers(
  maxResults: number = 20
): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[arXiv] Using mock data')
    return {
      articles: MOCK_ARXIV_PAPERS,
      fetchedAt: new Date(),
      source: 'arxiv',
    }
  }

  console.log(
    `[arXiv] Fetching recent papers from categories: ${ARXIV_CATEGORIES.join(', ')}...`
  )

  // Honor rate limit with 3-second delay before making request
  console.log(`[arXiv] Waiting ${RATE_LIMIT_DELAY_MS / 1000}s for rate limiting...`)
  await sleep(RATE_LIMIT_DELAY_MS)

  try {
    const url = buildQueryUrl(maxResults)
    console.log(`[arXiv] Querying: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DevPulse/1.0 (AI News Aggregator)',
      },
    })

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status} ${response.statusText}`)
    }

    const xmlData = await response.text()
    const articles = parseArxivResponse(xmlData)

    // Filter to only papers from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentArticles = articles.filter(
      (article) => article.publishedAt >= sevenDaysAgo
    )

    console.log(
      `[arXiv] Fetched ${articles.length} papers, ${recentArticles.length} from last 7 days`
    )

    return {
      articles: recentArticles,
      fetchedAt: new Date(),
      source: 'arxiv',
    }
  } catch (error) {
    console.error('[arXiv] Error fetching papers:', error)
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'arxiv',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Main export: Fetch all arXiv data
 */
export async function fetchArxivData(): Promise<FetchResult> {
  try {
    return await fetchArxivPapers(20)
  } catch (error) {
    console.error('[arXiv] Error fetching data:', error)
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'arxiv',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
