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

  console.log('[GitHub] Fetching trending AI/ML repos...')

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  if (!GITHUB_TOKEN) {
    console.error('[GitHub] GITHUB_TOKEN not found in environment')
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'github-trending',
      error: 'GITHUB_TOKEN not configured',
    }
  }

  try {
    // Search for trending AI/ML repos (created in last 7 days, sorted by stars)
    const since = new Date()
    since.setDate(since.getDate() - 7)
    const sinceStr = since.toISOString().split('T')[0]

    const query = `topic:ai OR topic:machine-learning OR topic:llm OR topic:deep-learning created:>${sinceStr}`
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    const articles: RawArticle[] = data.items.map((repo: any) => ({
      title: repo.full_name,
      url: repo.html_url,
      source: 'github',
      sourceId: repo.full_name,
      publishedAt: new Date(repo.created_at),
      content: repo.description || '',
      excerpt: repo.description || '',
      author: repo.owner.login,
      githubRepo: repo.full_name,
      githubStars: repo.stargazers_count,
      githubLanguage: repo.language || 'Unknown',
      githubLastCommit: new Date(repo.pushed_at),
      isGithubTrending: true,
      score: repo.stargazers_count,
    }))

    console.log(`[GitHub] Fetched ${articles.length} trending repos`)

    return {
      articles,
      fetchedAt: new Date(),
      source: 'github-trending',
    }
  } catch (error) {
    console.error('[GitHub] Error fetching trending repos:', error)
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'github-trending',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch recent releases from major AI/ML libraries
 */
export async function fetchReleases(repos: string[] = [
  'huggingface/transformers',
  'langchain-ai/langchain',
  'openai/openai-python',
  'anthropics/anthropic-sdk-python',
  'pytorch/pytorch',
  'tensorflow/tensorflow',
  'ollama/ollama',
  'ggerganov/llama.cpp',
]): Promise<FetchResult> {
  if (USE_MOCK_DATA) {
    console.log('[GitHub] Using mock data for releases')
    const filtered = MOCK_TRENDING_REPOS.filter(article =>
      article.url.includes('/releases/')
    )
    return {
      articles: filtered,
      fetchedAt: new Date(),
      source: 'github-releases',
    }
  }

  console.log(`[GitHub] Fetching releases from ${repos.length} repos...`)

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  if (!GITHUB_TOKEN) {
    console.error('[GitHub] GITHUB_TOKEN not found in environment')
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'github-releases',
      error: 'GITHUB_TOKEN not configured',
    }
  }

  try {
    const articles: RawArticle[] = []

    // Fetch releases for each repo
    for (const repo of repos) {
      try {
        const url = `https://api.github.com/repos/${repo}/releases?per_page=1`
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        })

        if (!response.ok) {
          console.error(`[GitHub] Error fetching releases for ${repo}: ${response.status}`)
          continue
        }

        const releases = await response.json()
        if (!releases || releases.length === 0) continue

        const release = releases[0]
        const publishedAt = new Date(release.published_at)

        // Only include releases from last 30 days
        const daysSinceRelease = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceRelease > 30) continue

        articles.push({
          title: `${repo}: ${release.name || release.tag_name}`,
          url: release.html_url,
          source: 'github',
          sourceId: repo,
          publishedAt,
          content: release.body || '',
          excerpt: release.body?.split('\n').slice(0, 3).join('\n') || '',
          author: repo.split('/')[0],
          githubRepo: repo,
          githubReleaseTag: release.tag_name,
          score: 0, // Will be scored by AI
        })
      } catch (error) {
        console.error(`[GitHub] Error fetching release for ${repo}:`, error)
      }
    }

    console.log(`[GitHub] Fetched ${articles.length} releases`)

    return {
      articles,
      fetchedAt: new Date(),
      source: 'github-releases',
    }
  } catch (error) {
    console.error('[GitHub] Error fetching releases:', error)
    return {
      articles: [],
      fetchedAt: new Date(),
      source: 'github-releases',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Main export: Fetch all GitHub data
 */
export async function fetchGitHubData(): Promise<FetchResult> {
  try {
    // Fetch both trending repos and releases in parallel
    const [trending, releases] = await Promise.all([
      fetchTrendingRepos(),
      fetchReleases(),
    ])

    // Combine articles from both sources
    const allArticles = [
      ...trending.articles,
      ...releases.articles,
    ]

    console.log(`[GitHub] Total fetched: ${allArticles.length} articles (${trending.articles.length} trending + ${releases.articles.length} releases)`)

    return {
      articles: allArticles,
      fetchedAt: new Date(),
      source: 'github',
    }
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
