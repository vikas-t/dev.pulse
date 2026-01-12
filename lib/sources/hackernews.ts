import { RawArticle, FetchResult } from './types'

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'

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

  console.log('[Hacker News] Fetching top stories...')

  try {
    // Step 1: Fetch top story IDs
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
    if (!topStoriesRes.ok) {
      throw new Error(`HN API error: ${topStoriesRes.status}`)
    }

    const storyIds: number[] = await topStoriesRes.json()

    // Step 2: Fetch details for first 50 stories (will filter down)
    const storiesToFetch = storyIds.slice(0, 50)
    const articles: RawArticle[] = []

    // AI/ML keywords to filter for
    const keywords = [
      'ai', 'ml', 'llm', 'gpt', 'chatgpt', 'openai', 'anthropic', 'claude',
      'machine learning', 'deep learning', 'neural', 'transformer', 'langchain',
      'pytorch', 'tensorflow', 'huggingface', 'ollama', 'stable diffusion',
      'midjourney', 'dall-e', 'embedding', 'vector', 'rag', 'fine-tuning',
      'prompt', 'agent', 'copilot', 'codex', 'model', 'inference'
    ]

    for (const id of storiesToFetch) {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        if (!storyRes.ok) continue

        const story = await storyRes.json()
        if (!story || story.type !== 'story' || story.dead || story.deleted) continue

        // Filter for AI/ML content
        const text = `${story.title} ${story.text || ''}`.toLowerCase()
        const hasKeyword = keywords.some(kw => text.includes(kw.toLowerCase()))

        if (!hasKeyword) continue

        // Extract domain from URL
        let domain = ''
        try {
          if (story.url) {
            domain = new URL(story.url).hostname.replace('www.', '')
          }
        } catch {}

        articles.push({
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          source: 'hn',
          sourceId: String(story.id),
          publishedAt: new Date(story.time * 1000),
          content: story.text || '',
          excerpt: story.title,
          author: story.by || 'unknown',
          domain,
          score: story.score || 0,
          commentCount: story.descendants || 0,
          hnDiscussionUrl: `https://news.ycombinator.com/item?id=${story.id}`,
        })

        if (articles.length >= limit) break
      } catch (error) {
        console.error(`[Hacker News] Error fetching story ${id}:`, error)
      }
    }

    console.log(`[Hacker News] Fetched ${articles.length} relevant stories`)

    return {
      articles,
      fetchedAt: new Date(),
      source: 'hackernews',
    }
  } catch (error) {
    console.error('[Hacker News] Error:', error)
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'hackernews',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
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
