import { RawArticle, FetchResult } from './types'

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'

// Mock data for testing
const MOCK_TRENDING_REPOS: RawArticle[] = [
  {
    title: 'Transformers 4.36.0: New LLM Support and Breaking Changes',
    url: 'https://github.com/huggingface/transformers/releases/tag/v4.36.0',
    source: 'github',
    sourceId: 'huggingface/transformers',
    publishedAt: new Date('2024-01-07'),
    content: `## What's Changed
- Added support for Phi-2 and Mixtral models
- BREAKING: Removed deprecated AutoModelWithLMHead class
- Performance improvements for inference
- Updated tokenizer handling`,
    excerpt: 'Major release with new model support and breaking API changes',
    author: 'huggingface',
    githubRepo: 'huggingface/transformers',
    githubStars: 125000,
    githubLanguage: 'Python',
    githubLastCommit: new Date('2024-01-07'),
    githubReleaseTag: 'v4.36.0',
    isGithubTrending: false,
    score: 125000,
  },
  {
    title: 'LangChain 0.1.0: Stable API Release',
    url: 'https://github.com/langchain-ai/langchain/releases/tag/v0.1.0',
    source: 'github',
    sourceId: 'langchain-ai/langchain',
    publishedAt: new Date('2024-01-06'),
    content: `## 🎉 LangChain 0.1.0 - Stable Release

### Breaking Changes
- LCEL syntax changes for chains
- New streaming API
- Deprecated legacy chains

### New Features
- Improved RAG support
- Better vector store integrations
- Enhanced agent capabilities`,
    excerpt: 'First stable release with breaking changes to chain syntax',
    author: 'langchain-ai',
    githubRepo: 'langchain-ai/langchain',
    githubStars: 75000,
    githubLanguage: 'Python',
    githubLastCommit: new Date('2024-01-06'),
    githubReleaseTag: 'v0.1.0',
    isGithubTrending: true,
    score: 75000,
  },
  {
    title: 'Ollama: Local LLM Runtime',
    url: 'https://github.com/ollama/ollama',
    source: 'github',
    sourceId: 'ollama/ollama',
    publishedAt: new Date('2024-01-05'),
    content: 'Run Llama 2, Code Llama, and other models locally. Optimized for macOS, Linux, and Windows.',
    excerpt: 'Local LLM runtime - run models on your machine',
    author: 'ollama',
    githubRepo: 'ollama/ollama',
    githubStars: 45000,
    githubLanguage: 'Go',
    githubLastCommit: new Date('2024-01-05'),
    isGithubTrending: true,
    score: 45000,
  },
]

/**
 * Fetch trending AI/ML repositories from GitHub
 */
export async function fetchTrendingRepos(): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[GitHub] Using mock data for trending repos')
    return {
      articles: MOCK_TRENDING_REPOS,
      fetchedAt: new Date(),
      source: 'github-trending',
    }
  }

  // TODO: Real GitHub API implementation
  // const response = await fetch('https://api.github.com/search/repositories?q=topic:ai+topic:ml&sort=stars&order=desc')
  throw new Error('Real GitHub API not implemented yet')
}

/**
 * Fetch recent releases from major AI/ML libraries
 */
export async function fetchReleases(repos: string[]): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[GitHub] Using mock data for releases')
    // Filter mock data to simulate fetching specific repos
    const filtered = MOCK_TRENDING_REPOS.filter(article =>
      article.url.includes('/releases/')
    )
    return {
      articles: filtered,
      fetchedAt: new Date(),
      source: 'github-releases',
    }
  }

  // TODO: Real GitHub API implementation
  throw new Error('Real GitHub API not implemented yet')
}

/**
 * Main export: Fetch all GitHub data
 */
export async function fetchGitHubData(): Promise<FetchResult> {
  try {
    // For now, just fetch trending repos
    // In the future, combine with releases
    const trending = await fetchTrendingRepos()

    return trending
  } catch (error) {
    console.error('[GitHub] Error fetching data:', error)
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'github',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
