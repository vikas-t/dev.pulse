import { RawArticle } from '../sources/types'
import { callOpenAI } from './openai'

export interface ScoringResult {
  score: number // 0-100
  label: 'BREAKING' | 'MAJOR' | 'MINOR' | 'INFO' | 'NOISE'
  category: 'breaking' | 'library' | 'sdk' | 'performance' | 'research' | 'security'
  languages: string[]
  frameworks: string[]
  topics: string[]
  requiresCodeExample: boolean
  affectsProduction: boolean
  reasoning: string
}

const SCORING_PROMPT = `You are curating a daily developer briefing for software engineers working with AI/ML.

**DEVELOPER-FIRST RULES:**
1. Breaking changes / deprecations = HIGHEST priority (95-100)
2. New libraries/tools developers can use TODAY = high priority (80-94)
3. Research papers WITHOUT code repos = lower priority (40-59)
4. Marketing hype, funding announcements = NOISE (<40)
5. If it doesn't affect code, it's probably not important

**Scoring Guidelines:**
- BREAKING (95-100): API changes, deprecations, breaking updates that affect production code
- MAJOR (80-94): New libraries/tools, major features, SDK updates
- MINOR (60-79): Helpful tutorials, optimizations, minor updates
- INFO (40-59): Interesting but optional (research, blog posts)
- NOISE (<40): Hype, funding news, generic AI content

**Categories:**
- breaking: API changes, deprecations, removed features
- library: New libraries, tools, frameworks
- sdk: SDK updates, API changes
- performance: Optimizations, speed improvements
- research: Research papers, academic work
- security: Security updates, CVEs, vulnerabilities

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
  "reasoning": "Brief explanation of why this score"
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
