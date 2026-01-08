import { RawArticle } from '../sources/types'
import { ScoringResult } from './scorer'
import { callOpenAI } from './openai'

export interface SummaryResult {
  summary: string[] // Bullet points
  insight: string // "Why this matters for your code"
  codeExample?: string
  codeLanguage?: string
  installCommand?: string
  migrationGuide?: string
}

const SUMMARIZATION_PROMPT = `Create a developer-focused summary for this AI/ML update.

**REQUIRED FORMAT (code-first):**

## Installation
\`\`\`{language}
{installation_command}
\`\`\`

## Quick Start
\`\`\`{language}
{minimal_working_example}
\`\`\`

## What Changed
- Bullet point 1 (specific, technical)
- Bullet point 2 (include version numbers, API names)
- Bullet point 3 (concrete facts, no hype)

## Why It Matters for Your Code
{1-2 sentences explaining practical impact on developer workflows}

{IF BREAKING CHANGE: Include migration guide}
## Migration Guide
\`\`\`{language}
# Old way (deprecated)
{old_code}

# New way (v{version})
{new_code}
\`\`\`

**RULES:**
- Code examples are REQUIRED (installation + usage)
- Be specific: versions, API names, function signatures
- Technical accuracy > brevity
- No marketing language
- Show concrete code, not pseudocode
- If research paper: include link to code repo or "No code available"`

/**
 * Generate code-first summary for an article
 */
export async function summarizeArticle(
  article: RawArticle,
  scoring: ScoringResult
): Promise<SummaryResult | null> {
  try {
    const userPrompt = `
Title: ${article.title}
URL: ${article.url}
Content: ${article.content || article.excerpt || '(no content)'}
${article.githubRepo ? `GitHub: ${article.githubRepo}` : ''}

Category: ${scoring.category}
Languages: ${scoring.languages.join(', ')}
Frameworks: ${scoring.frameworks.join(', ')}
Is Breaking Change: ${scoring.affectsProduction ? 'YES' : 'NO'}

Create a code-first summary following the format above.

Return JSON:
{
  "summary": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "insight": "Why this matters...",
  "codeExample": "code here",
  "codeLanguage": "python",
  "installCommand": "pip install ...",
  "migrationGuide": "migration code (if breaking)"
}
`

    const response = await callOpenAI(
      [
        { role: 'system', content: SUMMARIZATION_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 1500,
        responseFormat: { type: 'json_object' },
      }
    )

    const result = JSON.parse(response) as SummaryResult

    console.log(`[AI Summarizer] Generated summary for: ${article.title}`)

    return result
  } catch (error) {
    console.error(`[AI Summarizer] Failed to summarize: ${article.title}`, error)
    return null
  }
}

/**
 * Summarize multiple articles in batch
 */
export async function summarizeArticles(
  articles: RawArticle[],
  scorings: Map<string, ScoringResult>,
  batchSize: number = 10
): Promise<Map<string, SummaryResult>> {
  const results = new Map<string, SummaryResult>()

  // Only summarize articles with score >= 40
  const toSummarize = articles.filter(article => {
    const scoring = scorings.get(article.url)
    return scoring && scoring.score >= 40
  })

  console.log(`[AI Summarizer] Summarizing ${toSummarize.length}/${articles.length} articles (score >= 40)`)

  for (let i = 0; i < toSummarize.length; i += batchSize) {
    const batch = toSummarize.slice(i, i + batchSize)
    const batchPromises = batch.map(article => {
      const scoring = scorings.get(article.url)!
      return summarizeArticle(article, scoring)
    })
    const batchResults = await Promise.all(batchPromises)

    batchResults.forEach((result, index) => {
      if (result) {
        results.set(batch[index].url, result)
      }
    })

    // Small delay between batches
    if (i + batchSize < toSummarize.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`[AI Summarizer] Successfully summarized ${results.size}/${toSummarize.length} articles`)

  return results
}
