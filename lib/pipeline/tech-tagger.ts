import { RawArticle } from '../sources/types'
import { ScoringResult } from '../ai/scorer'

/**
 * Enrich tech stack tags from AI scoring + additional detection
 * Adds any missing languages/frameworks based on content analysis
 */
export function enrichTechTags(
  article: RawArticle,
  scoring: ScoringResult
): {
  languages: string[]
  frameworks: string[]
  topics: string[]
} {
  const languages = new Set(scoring.languages)
  const frameworks = new Set(scoring.frameworks)
  const topics = new Set(scoring.topics)

  const contentLower = `${article.title} ${article.content || ''} ${article.excerpt || ''}`.toLowerCase()

  // Language detection from content
  const languageKeywords: Record<string, string[]> = {
    python: ['python', 'pip', 'pytorch', 'tensorflow', 'pandas', 'numpy'],
    javascript: ['javascript', 'typescript', 'npm', 'node', 'react', 'next.js'],
    typescript: ['typescript', 'ts', '.tsx'],
    rust: ['rust', 'cargo', 'rustc'],
    go: ['golang', ' go ', 'go-'],
    cpp: ['c++', 'cpp', 'cmake'],
    java: ['java', 'maven', 'gradle'],
  }

  Object.entries(languageKeywords).forEach(([lang, keywords]) => {
    if (keywords.some(kw => contentLower.includes(kw))) {
      languages.add(lang)
    }
  })

  // Framework detection
  const frameworkKeywords: Record<string, string[]> = {
    pytorch: ['pytorch', 'torch'],
    tensorflow: ['tensorflow', 'tf', 'keras'],
    langchain: ['langchain', 'lcel'],
    llamaindex: ['llama index', 'llamaindex'],
    transformers: ['transformers', 'huggingface', 'hf'],
    openai: ['openai', 'gpt', 'chatgpt'],
    anthropic: ['anthropic', 'claude'],
    react: ['react', 'next.js', 'nextjs'],
    fastapi: ['fastapi', 'fast api'],
    flask: ['flask'],
    django: ['django'],
  }

  Object.entries(frameworkKeywords).forEach(([framework, keywords]) => {
    if (keywords.some(kw => contentLower.includes(kw))) {
      frameworks.add(framework)
    }
  })

  // Topic detection
  const topicKeywords: Record<string, string[]> = {
    llm: ['llm', 'large language model', 'language model'],
    rag: ['rag', 'retrieval augmented', 'retrieval-augmented'],
    'fine-tuning': ['fine-tuning', 'fine-tune', 'finetune', 'finetuning'],
    'computer-vision': ['computer vision', 'cv', 'image', 'vision'],
    nlp: ['nlp', 'natural language'],
    embeddings: ['embedding', 'embeddings', 'vector'],
    agents: ['agent', 'agents', 'autonomous'],
    multimodal: ['multimodal', 'multi-modal', 'vision-language'],
  }

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(kw => contentLower.includes(kw))) {
      topics.add(topic)
    }
  })

  // Use GitHub language if available
  if (article.githubLanguage) {
    languages.add(article.githubLanguage.toLowerCase())
  }

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    topics: Array.from(topics),
  }
}
