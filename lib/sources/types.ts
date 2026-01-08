// Shared types for data sources

export interface RawArticle {
  // Core fields (required)
  title: string
  url: string
  source: 'github' | 'hn' | 'reddit' | 'arxiv' | 'blog' | 'devto'
  sourceId?: string
  publishedAt: Date

  // Content
  content?: string // Full text content if available
  excerpt?: string // Short description/excerpt

  // Metadata
  author?: string
  domain?: string

  // Engagement metrics
  score?: number // HN points, Reddit upvotes, GitHub stars
  commentCount?: number

  // GitHub-specific
  githubRepo?: string
  githubStars?: number
  githubLanguage?: string
  githubLastCommit?: Date
  githubReleaseTag?: string
  isGithubTrending?: boolean

  // Discussion URLs
  hnDiscussionUrl?: string
  redditDiscussionUrl?: string
}

export interface FetchResult {
  articles: RawArticle[]
  fetchedAt: Date
  source: string
  error?: string
}
