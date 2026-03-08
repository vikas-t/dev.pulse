import { fetchGitHubData } from '../sources/github'
import { fetchHackerNewsData } from '../sources/hackernews'
import { fetchRedditData } from '../sources/reddit'
import { fetchArxivData } from '../sources/arxiv'
import { fetchRSSData } from '../sources/rss'
import { fetchDevToData } from '../sources/devto'
import { deduplicateArticles } from './dedup'
import { scoreArticles } from '../ai/scorer'
import { validateArticles, applyValidationToScoring } from '../ai/validator'
import { summarizeArticles } from '../ai/summarizer'
import { enrichTechTags } from './tech-tagger'
import { prisma } from '../db/prisma'
import { RawArticle } from '../sources/types'

export interface PipelineResult {
  success: boolean
  articlesProcessed: number
  articlesSaved: number
  errors: string[]
  duration: number
}

/**
 * Main pipeline orchestrator
 * Coordinates: Fetch → Dedupe → Score → Summarize → Save
 */
export async function runPipeline(): Promise<PipelineResult> {
  const startTime = Date.now()
  const errors: string[] = []

  console.log('[Pipeline] Starting data pipeline...')

  try {
    // STEP 1: Fetch from all sources in parallel
    console.log('[Pipeline] Step 1: Fetching from all sources...')
    const [github, hn, reddit, arxiv, rss, devto] = await Promise.all([
      fetchGitHubData(),
      fetchHackerNewsData(),
      fetchRedditData(),
      fetchArxivData(),
      fetchRSSData(),
      fetchDevToData(),
    ])

    // Collect all articles
    const allArticles: RawArticle[] = [
      ...github.articles,
      ...hn.articles,
      ...reddit.articles,
      ...arxiv.articles,
      ...rss.articles,
      ...devto.articles,
    ]

    console.log(`[Pipeline] Fetched ${allArticles.length} articles total`)

    // Filter out social articles (HN/Reddit) with no engagement — they have no signal
    const filteredArticles = allArticles.filter(article => {
      if (article.source === 'hn' || article.source === 'reddit') {
        const hasEngagement = (article.score ?? 0) > 0 || (article.commentCount ?? 0) > 0
        if (!hasEngagement) {
          console.log(`[Pipeline] Skipping zero-engagement ${article.source} article: ${article.title}`)
        }
        return hasEngagement
      }
      return true
    })

    console.log(`[Pipeline] ${filteredArticles.length} articles after engagement filter (${allArticles.length - filteredArticles.length} dropped)`)

    if (filteredArticles.length === 0) {
      console.log('[Pipeline] No articles fetched, exiting')
      return {
        success: true,
        articlesProcessed: 0,
        articlesSaved: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    // STEP 2: Deduplication (BEFORE AI processing to save costs)
    console.log('[Pipeline] Step 2: Deduplicating articles...')
    const { canonical, duplicates } = deduplicateArticles(filteredArticles)

    // STEP 3: AI Scoring (only canonical articles)
    console.log('[Pipeline] Step 3: AI scoring...')
    const scorings = await scoreArticles(canonical)

    // STEP 3.5: AI Validation (MAJOR+ articles from non-trusted domains)
    console.log('[Pipeline] Step 3.5: AI validation...')
    const validations = await validateArticles(canonical, scorings, duplicates)

    // Apply validation results — cap scores for low-credibility articles
    for (const [url, validation] of validations) {
      const scoring = scorings.get(url)
      if (scoring) {
        scorings.set(url, applyValidationToScoring(scoring, validation))
      }
    }

    // STEP 4: AI Summarization (only articles with score >= 40)
    console.log('[Pipeline] Step 4: AI summarization...')
    const summaries = await summarizeArticles(canonical, scorings)

    // STEP 5: Tech stack tagging
    console.log('[Pipeline] Step 5: Tech stack tagging...')
    const enrichedArticles = canonical.map(article => {
      const scoring = scorings.get(article.url)
      if (!scoring) return null

      const summary = summaries.get(article.url)
      const validation = validations.get(article.url)
      const techTags = enrichTechTags(article, scoring)

      return {
        article,
        scoring,
        summary,
        validation,
        techTags,
      }
    }).filter(Boolean)

    // STEP 6: Save to database
    console.log('[Pipeline] Step 6: Saving to database...')
    let savedCount = 0

    for (const item of enrichedArticles) {
      if (!item) continue

      const { article, scoring, summary, validation, techTags } = item

      try {
        // Upsert article (use URL as unique key)
        const savedArticle = await prisma.article.upsert({
          where: { url: article.url },
          create: {
            title: article.title,
            url: article.url,
            source: article.source,
            sourceId: article.sourceId || null,
            publishedAt: article.publishedAt,

            // AI-generated content
            summary: summary?.summary || [],
            insight: summary?.insight || null,
            codeExample: summary?.codeExample || null,
            codeLanguage: summary?.codeLanguage || null,
            installCommand: summary?.installCommand || null,
            migrationGuide: summary?.migrationGuide || null,

            // Metadata
            author: article.author || null,
            domain: article.domain || null,
            category: scoring.category,
            tags: scoring.tags,

            // Tech stack
            languages: techTags.languages,
            frameworks: techTags.frameworks,
            topics: techTags.topics,

            // GitHub data
            githubRepo: article.githubRepo || null,
            githubStars: article.githubStars || null,
            githubLanguage: article.githubLanguage || null,
            githubLastCommit: article.githubLastCommit || null,
            githubReleaseTag: article.githubReleaseTag || null,
            isGithubTrending: article.isGithubTrending || false,

            // Scoring
            importanceScore: scoring.score,
            importanceLabel: scoring.label,
            aiReasoning: scoring.reasoning,
            affectsProduction: scoring.affectsProduction,

            // Validation
            validationScore: validation?.validationScore ?? null,
            validationLabel: validation?.validationLabel ?? null,
            validationReason: validation?.validationReason ?? null,

            // Engagement
            sourceScore: article.score || null,
            commentCount: article.commentCount || null,
            hnDiscussionUrl: article.hnDiscussionUrl || null,
            redditDiscussionUrl: article.redditDiscussionUrl || null,

            // Pipeline version
            pipelineVersion: 'v2',
          },
          update: {
            // Update if article already exists (in case of re-run)
            summary: summary?.summary || [],
            insight: summary?.insight || null,
            importanceScore: scoring.score,
            importanceLabel: scoring.label,
            tags: scoring.tags,
            validationScore: validation?.validationScore ?? null,
            validationLabel: validation?.validationLabel ?? null,
            validationReason: validation?.validationReason ?? null,
            pipelineVersion: 'v2',
            updatedAt: new Date(),
          },
        })

        // Save duplicates if any
        const articleDuplicates = duplicates.get(article.url) || []
        for (const dup of articleDuplicates) {
          await prisma.articleDuplicate.create({
            data: {
              canonicalArticleId: savedArticle.id, // Use the actual article ID
              duplicateUrl: dup.url,
              duplicateTitle: dup.title,
              duplicateSource: dup.source,
            },
          })
        }

        savedCount++
      } catch (error) {
        const errorMsg = `Failed to save article: ${article.title}`
        console.error(`[Pipeline] ${errorMsg}`, error)
        errors.push(errorMsg)
      }
    }

    const duration = Date.now() - startTime

    console.log(`[Pipeline] ✓ Complete! Processed ${canonical.length} articles, saved ${savedCount} to database`)
    console.log(`[Pipeline] Duration: ${(duration / 1000).toFixed(2)}s`)

    return {
      success: true,
      articlesProcessed: canonical.length,
      articlesSaved: savedCount,
      errors,
      duration,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Pipeline] Fatal error:', error)
    errors.push(errorMsg)

    return {
      success: false,
      articlesProcessed: 0,
      articlesSaved: 0,
      errors,
      duration: Date.now() - startTime,
    }
  }
}
