'use client'

import { useEffect, useState } from 'react'
import { DevArticleCard } from '@/components/DevArticleCard'

interface Article {
  id: string
  title: string
  url: string
  source: string
  category: 'breaking' | 'library' | 'sdk' | 'performance' | 'research' | 'security'
  importanceLabel: string
  importanceScore: number
  summary: string[]
  insight?: string | null
  codeExample?: string | null
  codeLanguage?: string | null
  installCommand?: string | null
  migrationGuide?: string | null
  languages: string[]
  frameworks: string[]
  topics: string[]
  githubRepo?: string | null
  githubStars?: number | null
  githubLanguage?: string | null
  author?: string | null
  publishedAt: Date | string
  hnDiscussionUrl?: string | null
}

// Mock data for development (when database is empty)
const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Transformers 4.36.0: New LLM Support and Breaking Changes',
    url: 'https://github.com/huggingface/transformers/releases/tag/v4.36.0',
    source: 'github',
    category: 'breaking',
    importanceLabel: 'BREAKING',
    importanceScore: 95,
    summary: [
      'Added support for Phi-2 and Mixtral models',
      'BREAKING: Removed deprecated AutoModelWithLMHead class',
      'Performance improvements for inference',
    ],
    insight: 'If you\'re using AutoModelWithLMHead in production, you\'ll need to migrate to AutoModelForCausalLM. This affects all LLM-based applications using older Transformers patterns.',
    codeExample: `from transformers import AutoModelForCausalLM, AutoTokenizer

# Load model and tokenizer
model = AutoModelForCausalLM.from_pretrained("microsoft/phi-2")
tokenizer = AutoTokenizer.from_pretrained("microsoft/phi-2")

# Generate text
inputs = tokenizer("Hello, I am", return_tensors="pt")
outputs = model.generate(**inputs, max_length=50)
print(tokenizer.decode(outputs[0]))`,
    codeLanguage: 'python',
    installCommand: 'pip install transformers==4.36.0',
    migrationGuide: `# Old (deprecated)
from transformers import AutoModelWithLMHead
model = AutoModelWithLMHead.from_pretrained("gpt2")

# New (v4.36.0+)
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained("gpt2")`,
    languages: ['python'],
    frameworks: ['transformers', 'pytorch'],
    topics: ['llm', 'fine-tuning'],
    githubRepo: 'huggingface/transformers',
    githubStars: 125000,
    githubLanguage: 'Python',
    publishedAt: new Date('2024-01-07'),
  },
  {
    id: '2',
    title: 'LangChain 0.1.0: Stable API Release',
    url: 'https://github.com/langchain-ai/langchain/releases/tag/v0.1.0',
    source: 'github',
    category: 'breaking',
    importanceLabel: 'MAJOR',
    importanceScore: 88,
    summary: [
      'First stable release with breaking changes to LCEL syntax',
      'New streaming API for real-time responses',
      'Improved RAG support with better vector store integrations',
    ],
    insight: 'LCEL chain syntax has changed. If you have production LangChain apps, review the migration guide to avoid runtime errors.',
    codeExample: `from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

# New LCEL syntax
prompt = ChatPromptTemplate.from_template("Tell me a joke about {topic}")
model = ChatOpenAI()
chain = prompt | model | StrOutputParser()

result = chain.invoke({"topic": "AI"})
print(result)`,
    codeLanguage: 'python',
    installCommand: 'pip install langchain==0.1.0 langchain-openai',
    languages: ['python'],
    frameworks: ['langchain', 'openai'],
    topics: ['llm', 'rag', 'agents'],
    githubRepo: 'langchain-ai/langchain',
    githubStars: 75000,
    githubLanguage: 'Python',
    publishedAt: new Date('2024-01-06'),
  },
  {
    id: '3',
    title: 'Ollama: Run Llama 2, Code Llama locally',
    url: 'https://github.com/ollama/ollama',
    source: 'github',
    category: 'library',
    importanceLabel: 'MAJOR',
    importanceScore: 82,
    summary: [
      'Run LLMs locally on macOS, Linux, and Windows',
      'Optimized inference with GPU acceleration',
      'Simple API compatible with OpenAI client libraries',
    ],
    insight: 'Perfect for local development and testing LLM features without API costs. Drop-in replacement for OpenAI API calls during development.',
    codeExample: `# Using Ollama with OpenAI-compatible API
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"  # required but unused
)

response = client.chat.completions.create(
    model="llama2",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
    codeLanguage: 'python',
    installCommand: 'curl https://ollama.ai/install.sh | sh',
    languages: ['go', 'python', 'javascript'],
    frameworks: ['ollama'],
    topics: ['llm', 'local-llm'],
    githubRepo: 'ollama/ollama',
    githubStars: 45000,
    githubLanguage: 'Go',
    publishedAt: new Date('2024-01-05'),
  },
]

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch('/api/articles/today?limit=10')
        const data = await response.json()

        if (data.success && data.articles.length > 0) {
          setArticles(data.articles)
        } else {
          // Use mock data if API returns empty or fails
          console.log('Using mock data (database empty or error)')
          setArticles(MOCK_ARTICLES)
        }
      } catch (err) {
        console.error('Error fetching articles:', err)
        // Fallback to mock data on error
        setArticles(MOCK_ARTICLES)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 rounded w-64 mb-2"></div>
            <div className="h-4 bg-zinc-800 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-zinc-900 rounded-lg border border-zinc-800"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <h1 className="text-2xl font-bold text-zinc-100">
            Model Brief
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Today's Top {articles.length} AI Updates for Developers
          </p>
        </div>
      </header>

      {/* Main Feed */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg mb-2">No articles yet</p>
            <p className="text-zinc-600 text-sm">
              Run the pipeline to fetch and process articles
            </p>
            <p className="text-zinc-600 text-xs mt-4 font-mono">
              curl http://localhost:3000/api/cron/test
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article, index) => (
              <DevArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-zinc-600 text-sm">
          <p>Built with Next.js, Tailwind, and Claude Code</p>
        </div>
      </footer>
    </div>
  )
}
