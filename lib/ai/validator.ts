import { RawArticle } from '../sources/types'
import { ScoringResult } from './scorer'
import { callOpenAI } from './openai'

export type ValidationLabel = 'VERIFIED' | 'LIKELY_VALID' | 'UNVERIFIED' | 'SUSPICIOUS'

export interface ValidationResult {
  validationScore: number        // 0-100
  validationLabel: ValidationLabel
  validationReason: string
  metrics: {
    authenticity: number         // 0-10: Is the source/author credible? Are claims specific?
    domainReputation: number     // 0-10: Known trusted domain vs unknown blog
    engagement: number           // 0-10: HN points, comments, GitHub stars
    claimVerifiability: number   // 0-10: Links to evidence (GitHub PR, release notes, official docs)?
    contentQuality: number       // 0-10: Specific/technical vs vague/sensational
    sourceConsistency: number    // 0-10: Story corroborated by multiple sources?
  }
}

// Domains that are inherently trusted — skip AI validation, auto-VERIFIED
const TRUSTED_DOMAINS = new Set([
  'github.com',
  'arxiv.org',
  'openai.com',
  'anthropic.com',
  'pytorch.org',
  'tensorflow.org',
  'huggingface.co',
  'deepmind.google',
  'research.google',
  'ai.meta.com',
  'mistral.ai',
  'ollama.com',
  'langchain.com',
  'python.org',
  'nodejs.org',
  'rust-lang.org',
  'news.ycombinator.com',
])

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isTrustedDomain(url: string): boolean {
  const domain = extractDomain(url)
  if (!domain) return false
  // Check exact match and subdomain match
  return TRUSTED_DOMAINS.has(domain) ||
    [...TRUSTED_DOMAINS].some(trusted => domain.endsWith(`.${trusted}`))
}

const VALIDATION_PROMPT = `You are a credibility analyst for a developer news feed. Evaluate the authenticity and reliability of this article.

**Score each metric 0-10:**

- **authenticity** (0-10): Is the source/author credible? Are claims specific with version numbers, function names, concrete details? (0 = anonymous blog with vague claims, 10 = official announcement with specific technical details)
- **domainReputation** (0-10): How reputable is the domain? (0 = unknown personal blog, 5 = established tech blog, 10 = official project/company site)
- **engagement** (0-10): Community validation via points/comments/stars. (0 = zero engagement, 10 = hundreds of upvotes + active discussion)
- **claimVerifiability** (0-10): Does the article link to or reference verifiable evidence like GitHub PRs, changelogs, release notes, official docs? (0 = no evidence, 10 = direct links to proof)
- **contentQuality** (0-10): Is the content specific and technical, or vague/sensational? Does the title match the content? (0 = clickbait/hype, 10 = precise technical facts)
- **sourceConsistency** (0-10): Is this story corroborated by being referenced from multiple sources, or does it stand alone as an unverified claim? (0 = single obscure source, 10 = widely reported)

**Label rules (based on average score):**
- VERIFIED (80-100): Trusted, specific, well-evidenced
- LIKELY_VALID (60-79): Probably accurate, minor gaps
- UNVERIFIED (40-59): Insufficient evidence to confirm
- SUSPICIOUS (0-39): Red flags — vague claims, unknown source, no engagement, sensational title

Return JSON only.`

/**
 * Validate a single article's credibility
 * Trusted domains are auto-verified without an API call
 */
export async function validateArticle(
  article: RawArticle,
  scoring: ScoringResult,
  isCorroborated: boolean = false
): Promise<ValidationResult> {
  // Auto-verify trusted domains — no API call needed
  if (isTrustedDomain(article.url)) {
    return {
      validationScore: 95,
      validationLabel: 'VERIFIED',
      validationReason: 'Trusted official source domain',
      metrics: {
        authenticity: 10,
        domainReputation: 10,
        engagement: Math.min(10, Math.round(((article.score || 0) + (article.commentCount || 0) * 2) / 50)),
        claimVerifiability: 9,
        contentQuality: 9,
        sourceConsistency: isCorroborated ? 10 : 7,
      },
    }
  }

  try {
    const domain = extractDomain(article.url)
    const userPrompt = `
Title: ${article.title}
URL: ${article.url}
Domain: ${domain}
Source: ${article.source}
Author: ${article.author || 'unknown'}
Content: ${article.content || article.excerpt || '(no content available)'}
HN Points: ${article.score || 0}
Comments: ${article.commentCount || 0}
GitHub Stars: ${article.githubStars || 'N/A'}
AI Category: ${scoring.category}
Corroborated by multiple sources: ${isCorroborated}

Evaluate credibility and return JSON:
{
  "validationScore": 72,
  "validationLabel": "LIKELY_VALID",
  "validationReason": "Brief explanation of the overall assessment",
  "metrics": {
    "authenticity": 7,
    "domainReputation": 6,
    "engagement": 8,
    "claimVerifiability": 5,
    "contentQuality": 7,
    "sourceConsistency": 6
  }
}`

    const response = await callOpenAI(
      [
        { role: 'system', content: VALIDATION_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.2,
        maxTokens: 400,
        responseFormat: { type: 'json_object' },
      }
    )

    const result = JSON.parse(response) as ValidationResult
    console.log(`[AI Validator] "${article.title}" → ${result.validationScore} (${result.validationLabel})`)
    return result
  } catch (error) {
    console.error(`[AI Validator] Failed to validate: ${article.title}`, error)
    // Default to UNVERIFIED on failure rather than blocking the pipeline
    return {
      validationScore: 50,
      validationLabel: 'UNVERIFIED',
      validationReason: 'Validation failed — could not assess credibility',
      metrics: {
        authenticity: 5,
        domainReputation: 5,
        engagement: 5,
        claimVerifiability: 5,
        contentQuality: 5,
        sourceConsistency: 5,
      },
    }
  }
}

/**
 * Validate articles in batch
 * Only validates MAJOR+ articles from non-trusted domains (saves API costs)
 */
export async function validateArticles(
  articles: RawArticle[],
  scorings: Map<string, ScoringResult>,
  duplicates: Map<string, RawArticle[]>,
  batchSize: number = 10
): Promise<Map<string, ValidationResult>> {
  const results = new Map<string, ValidationResult>()

  // Only validate MAJOR+ from non-trusted domains
  const toValidate = articles.filter(article => {
    const scoring = scorings.get(article.url)
    if (!scoring) return false
    if (isTrustedDomain(article.url)) return true // Will be auto-verified cheaply
    return scoring.score >= 75 // MAJOR and above only
  })

  console.log(`[AI Validator] Validating ${toValidate.length}/${articles.length} articles (MAJOR+ or trusted domains)`)

  for (let i = 0; i < toValidate.length; i += batchSize) {
    const batch = toValidate.slice(i, i + batchSize)
    const batchPromises = batch.map(article => {
      const scoring = scorings.get(article.url)!
      const isCorroborated = (duplicates.get(article.url) || []).length > 0
      return validateArticle(article, scoring, isCorroborated)
    })
    const batchResults = await Promise.all(batchPromises)

    batchResults.forEach((result, index) => {
      results.set(batch[index].url, result)
    })

    if (i + batchSize < toValidate.length) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  console.log(`[AI Validator] Validated ${results.size} articles`)
  return results
}

/**
 * Apply validation result to scoring — cap importance label for low-credibility articles
 */
export function applyValidationToScoring(
  scoring: ScoringResult,
  validation: ValidationResult
): ScoringResult {
  if (validation.validationLabel === 'VERIFIED' || validation.validationLabel === 'LIKELY_VALID') {
    return scoring
  }

  const updated = { ...scoring }

  if (validation.validationLabel === 'UNVERIFIED') {
    // Cap at NOTABLE max
    if (updated.score > 74) updated.score = 74
    if (updated.label === 'BREAKING' || updated.label === 'MAJOR') updated.label = 'NOTABLE'
    updated.tags = [...updated.tags, '⚠️']
  } else if (validation.validationLabel === 'SUSPICIOUS') {
    // Cap at INFO max
    if (updated.score > 54) updated.score = 54
    if (updated.label === 'BREAKING' || updated.label === 'MAJOR' || updated.label === 'NOTABLE') {
      updated.label = 'INFO'
    }
    updated.tags = [...updated.tags, '⚠️']
  }

  return updated
}
