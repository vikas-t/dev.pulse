import { RawArticle } from '../sources/types'
import { callOpenAI } from './openai'

export interface ScoringResult {
  score: number // 0-100
  label: 'BREAKING' | 'MAJOR' | 'NOTABLE' | 'INFO' | 'NOISE'
  category:
    | 'breaking'      // Breaking changes, deprecations
    | 'library'       // New libraries, frameworks
    | 'sdk'           // SDK updates, API changes
    | 'launch'        // Product launches, new features
    | 'trending'      // GitHub trending repos
    | 'industry'      // Layoffs, funding, acquisitions
    | 'tools'         // Developer tools, IDE, CLI
    | 'performance'   // Optimizations, benchmarks
    | 'known_issue'   // Bugs, workarounds, warnings
    | 'case_study'    // Production stories, architectures
    | 'research'      // Research papers
    | 'community'     // Discussions, tutorials
    | 'security'      // CVEs, vulnerabilities
  languages: string[]
  frameworks: string[]
  topics: string[]
  requiresCodeExample: boolean
  affectsProduction: boolean
  reasoning: string
  tags: string[]      // Visual tags for UI: 🔴,🐛,🚀,⭐,⚡,🛠️,🏭,📰,🔒
}

const SCORING_PROMPT = `You are curating a BALANCED daily developer briefing for software engineers working with AI/ML.

**BALANCED SCORING RULES:**
Developers need diverse content - not just breaking changes. Include:
- Critical updates (breaking changes, security, known issues)
- New tools & launches (even if not "breaking")
- Trending projects (GitHub stars velocity)
- Industry news (launches, layoffs, funding - contextual awareness)
- Performance insights & case studies
- Valuable tutorials and discussions

**Scoring Guidelines (LESS POLARIZED):**
- BREAKING (95-100): Breaking changes, critical security CVEs, major known issues
- MAJOR (75-94): New tools/libraries, major launches, trending repos with high engagement, important industry news
- NOTABLE (55-74): Launches, trending projects, useful tools, performance insights, case studies, important tutorials
- INFO (40-54): Research, community posts, general AI news, interesting discussions
- NOISE (<40): Pure hype, low-quality content, irrelevant news

**Categories (EXPANDED):**
- breaking: API changes, deprecations, removed features
- library: New libraries, frameworks
- sdk: SDK updates, API changes
- launch: Product launches, new features (OpenAI releases, Anthropic updates)
- trending: GitHub repos with high star velocity
- industry: Layoffs, funding, acquisitions, company news
- tools: Developer tools, IDE plugins, CLI tools, DevOps
- performance: Benchmarks, optimizations, speed comparisons
- known_issue: Bugs, don't-upgrade warnings, workarounds
- case_study: Production stories, how companies use AI/ML
- research: Research papers, academic work
- community: Tutorials, discussions, blog posts
- security: CVEs, vulnerabilities, security advisories

**Tags (assign 1-2):**
Return emoji tags for visual scanning:
- 🔴 BREAKING - for breaking changes
- 🐛 KNOWN ISSUE - for bugs/warnings
- 🚀 LAUNCH - for product launches
- ⭐ TRENDING - for GitHub fast-growers
- ⚡ PERFORMANCE - for speed/benchmarks
- 🛠️ TOOLS - for developer tools
- 🏭 CASE STUDY - for production stories
- 📰 INDUSTRY - for company news
- 🔒 SECURITY - for CVEs

Analyze this item and return a JSON object with your assessment.`

/**
 * Score a single article using AI
 */
export async function scoreArticle(article: RawArticle): Promise<ScoringResult | null> {
  try {
    const userPrompt = `
Title: ${article.title}
Source: ${article.source}
URL: ${article.url}
Content: ${article.content || article.excerpt || '(no content)'}
${article.githubRepo ? `GitHub: ${article.githubRepo} (${article.githubStars || 0} stars)` : ''}
${article.score ? `Community: ${article.score} points` : ''}
${article.commentCount ? `Comments: ${article.commentCount}` : ''}

Rate importance 0-100 for DEVELOPERS and extract metadata.

Return JSON:
{
  "score": 85,
  "label": "MAJOR",
  "category": "library",
  "languages": ["python"],
  "frameworks": ["langchain"],
  "topics": ["llm", "agents"],
  "requiresCodeExample": true,
  "affectsProduction": false,
  "reasoning": "Brief explanation of why this score",
  "tags": ["🚀", "🛠️"]
}
`

    const response = await callOpenAI(
      [
        { role: 'system', content: SCORING_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.3, // Lower temperature for consistent scoring
        maxTokens: 500,
        responseFormat: { type: 'json_object' },
      }
    )

    const result = JSON.parse(response) as ScoringResult

    console.log(`[AI Scorer] "${article.title}" → ${result.score} (${result.label})`)

    return result
  } catch (error) {
    console.error(`[AI Scorer] Failed to score article: ${article.title}`, error)
    return null
  }
}

/**
 * Score multiple articles in batch
 */
export async function scoreArticles(
  articles: RawArticle[],
  batchSize: number = 10
): Promise<Map<string, ScoringResult>> {
  const results = new Map<string, ScoringResult>()

  console.log(`[AI Scorer] Scoring ${articles.length} articles in batches of ${batchSize}`)

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    const batchPromises = batch.map(article => scoreArticle(article))
    const batchResults = await Promise.all(batchPromises)

    batchResults.forEach((result, index) => {
      if (result) {
        results.set(batch[index].url, result)
      }
    })

    // Small delay between batches to avoid rate limits
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`[AI Scorer] Successfully scored ${results.size}/${articles.length} articles`)

  return results
}
