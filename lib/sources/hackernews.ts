import { RawArticle, FetchResult } from './types'

const USE_MOCK_DATA = true // Toggle this to switch to real API

// Mock Hacker News stories
const MOCK_HN_STORIES: RawArticle[] = [
  {
    title: 'Show HN: I built a local RAG system with Ollama and ChromaDB',
    url: 'https://github.com/user/local-rag',
    source: 'hn',
    sourceId: '38847291',
    publishedAt: new Date('2024-01-07'),
    content: 'A simple RAG system that runs entirely locally using Ollama for embeddings and ChromaDB for vector storage.',
    excerpt: 'Local RAG system tutorial',
    author: 'developer123',
    domain: 'github.com',
    score: 423,
    commentCount: 87,
    hnDiscussionUrl: 'https://news.ycombinator.com/item?id=38847291',
  },
  {
    title: 'GPT-4 Vision API now generally available',
    url: 'https://openai.com/blog/gpt-4-vision-api-general-availability',
    source: 'hn',
    sourceId: '38846712',
    publishedAt: new Date('2024-01-06'),
    content: 'OpenAI announces general availability of GPT-4 Vision API with updated pricing and rate limits.',
    excerpt: 'GPT-4 Vision API goes GA',
    author: 'openai_official',
    domain: 'openai.com',
    score: 856,
    commentCount: 234,
    hnDiscussionUrl: 'https://news.ycombinator.com/item?id=38846712',
  },
  {
    title: 'PyTorch 2.2 Released with TorchInductor Improvements',
    url: 'https://pytorch.org/blog/pytorch-2.2-release/',
    source: 'hn',
    sourceId: '38845123',
    publishedAt: new Date('2024-01-05'),
    content: 'PyTorch 2.2 includes performance improvements, better CUDA support, and new experimental features.',
    excerpt: 'PyTorch 2.2 with performance improvements',
    author: 'pytorch_team',
    domain: 'pytorch.org',
    score: 512,
    commentCount: 143,
    hnDiscussionUrl: 'https://news.ycombinator.com/item?id=38845123',
  },
]

/**
 * Fetch top stories from Hacker News
 * Filters for developer-relevant AI/ML content
 */
export async function fetchTopStories(limit: number = 30): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[Hacker News] Using mock data for top stories')
    return {
      articles: MOCK_HN_STORIES.slice(0, limit),
      fetchedAt: new Date(),
      source: 'hackernews',
    }
  }

  // TODO: Real Hacker News API implementation
  // 1. Fetch top story IDs: https://hacker-news.firebaseio.com/v0/topstories.json
  // 2. Fetch each story details: https://hacker-news.firebaseio.com/v0/item/{id}.json
  // 3. Filter for AI/ML keywords
  throw new Error('Real Hacker News API not implemented yet')
}

/**
 * Main export: Fetch all Hacker News data
 */
export async function fetchHackerNewsData(): Promise<FetchResult> {
  try {
    const stories = await fetchTopStories(30)
    return stories
  } catch (error) {
    console.error('[Hacker News] Error fetching data:', error)
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'hackernews',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
