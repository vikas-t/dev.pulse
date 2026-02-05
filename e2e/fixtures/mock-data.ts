export interface MockArticle {
  id: string
  title: string
  url: string
  source: string
  category: string
  importanceLabel: string
  importanceScore: number
  tags: string[]
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
  publishedAt: string
  hnDiscussionUrl?: string | null
  section?: 'critical' | 'noteworthy' | 'spotlight' | 'historical'
}

// Critical article (score >= 95)
export const criticalArticle: MockArticle = {
  id: 'critical-1',
  title: 'PyTorch 2.2: Critical Security Vulnerability in Model Loading',
  url: 'https://github.com/pytorch/pytorch/security/advisories/GHSA-1234',
  source: 'github',
  category: 'security',
  importanceLabel: 'BREAKING',
  importanceScore: 98,
  tags: ['🔴', '🔒'],
  summary: [
    'Critical RCE vulnerability in torch.load() function',
    'Affects all versions < 2.2.0',
    'Immediate upgrade required for production systems',
  ],
  insight: 'If you use torch.load() with untrusted model files, your system is vulnerable to remote code execution.',
  codeExample: `# Safe loading (PyTorch 2.2+)
import torch
model = torch.load('model.pt', weights_only=True)`,
  codeLanguage: 'python',
  installCommand: 'pip install torch>=2.2.0',
  languages: ['python'],
  frameworks: ['pytorch'],
  topics: ['security', 'ml'],
  githubRepo: 'pytorch/pytorch',
  githubStars: 78000,
  githubLanguage: 'Python',
  publishedAt: '2024-01-10T10:00:00Z',
  section: 'critical',
}

// Noteworthy articles (score 55-94)
export const noteworthyArticle1: MockArticle = {
  id: 'noteworthy-1',
  title: 'Ollama 0.2: Multi-model Serving and Faster Inference',
  url: 'https://github.com/ollama/ollama/releases/tag/v0.2.0',
  source: 'github',
  category: 'launch',
  importanceLabel: 'MAJOR',
  importanceScore: 85,
  tags: ['🚀'],
  summary: [
    'Support for serving multiple models simultaneously',
    '40% faster inference on Apple Silicon',
    'New API for model management',
  ],
  insight: 'Great for local development setups that need to switch between models frequently.',
  codeExample: `# Run multiple models
ollama serve --models llama2,codellama,mistral`,
  codeLanguage: 'bash',
  installCommand: 'curl -fsSL https://ollama.com/install.sh | sh',
  languages: ['go'],
  frameworks: ['ollama'],
  topics: ['llm', 'local-llm'],
  githubRepo: 'ollama/ollama',
  githubStars: 55000,
  githubLanguage: 'Go',
  publishedAt: '2024-01-09T14:00:00Z',
  section: 'noteworthy',
}

export const noteworthyArticle2: MockArticle = {
  id: 'noteworthy-2',
  title: 'LangChain Expression Language (LCEL) Best Practices Guide',
  url: 'https://blog.langchain.dev/lcel-best-practices',
  source: 'blog',
  category: 'community',
  importanceLabel: 'NOTABLE',
  importanceScore: 72,
  tags: ['💬'],
  summary: [
    'Official guide for LCEL chain composition',
    'Performance tips for production RAG pipelines',
    'Error handling patterns',
  ],
  insight: 'Essential reading if you\'re building production LangChain applications.',
  languages: ['python'],
  frameworks: ['langchain'],
  topics: ['llm', 'rag'],
  publishedAt: '2024-01-08T09:00:00Z',
  section: 'noteworthy',
}

// Spotlight article (GitHub trending)
export const spotlightArticle: MockArticle = {
  id: 'spotlight-1',
  title: 'ComfyUI: Node-based Stable Diffusion Interface',
  url: 'https://github.com/comfyanonymous/ComfyUI',
  source: 'github',
  category: 'trending',
  importanceLabel: 'MAJOR',
  importanceScore: 80,
  tags: ['⭐'],
  summary: [
    'Visual node-based workflow for Stable Diffusion',
    'Gained 5000+ stars this week',
    'Supports SDXL, ControlNet, and custom nodes',
  ],
  insight: 'Great alternative to Automatic1111 for complex image generation workflows.',
  languages: ['python'],
  frameworks: ['pytorch', 'stable-diffusion'],
  topics: ['image-generation', 'diffusion'],
  githubRepo: 'comfyanonymous/ComfyUI',
  githubStars: 32000,
  githubLanguage: 'Python',
  publishedAt: '2024-01-07T16:00:00Z',
  section: 'spotlight',
}

// Full mock response with all sections (updated with pagination fields)
export const mockArticlesResponse = {
  success: true,
  articles: [criticalArticle, noteworthyArticle1, noteworthyArticle2, spotlightArticle],
  count: 4,
  total: 4,
  hasMore: false,
  cached: false,
  distribution: {
    critical: 1,
    major: 2,
    notable: 1,
    info: 0,
    trending: 1,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// Empty response
export const emptyArticlesResponse = {
  success: true,
  articles: [],
  count: 0,
  total: 0,
  hasMore: false,
  cached: false,
  distribution: {
    critical: 0,
    major: 0,
    notable: 0,
    info: 0,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// Error response
export const errorArticlesResponse = {
  success: false,
  articles: [],
  count: 0,
  error: 'Database connection failed',
}

// Only noteworthy articles (no sections)
export const noteworthyOnlyResponse = {
  success: true,
  articles: [noteworthyArticle1, noteworthyArticle2],
  count: 2,
  total: 2,
  hasMore: false,
  cached: false,
  distribution: {
    critical: 0,
    major: 2,
    notable: 0,
    info: 0,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// Refresh status responses
export const refreshStatusCanRefresh = {
  canRefresh: true,
  lastRefreshAt: null,
  nextRefreshAt: null,
}

export const refreshStatusRateLimited = {
  canRefresh: false,
  lastRefreshAt: new Date().toISOString(),
  nextRefreshAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
}

// Refresh POST responses
export const refreshSuccessResponse = {
  success: true,
  message: 'Refresh complete',
  stats: {
    articlesProcessed: 25,
    articlesSaved: 20,
    duration: '15.32s',
  },
}

export const refreshRateLimitedResponse = {
  success: false,
  rateLimited: true,
  message: 'Already refreshed today',
  nextRefreshAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
}

export const refreshErrorResponse = {
  success: false,
  message: 'Refresh failed',
  error: 'Pipeline error',
}

// Pagination mock responses
export const firstPageResponse = {
  success: true,
  articles: [criticalArticle, noteworthyArticle1],
  count: 2,
  total: 25,
  hasMore: true,
  cached: false,
  distribution: {
    critical: 1,
    major: 15,
    notable: 7,
    info: 2,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

export const secondPageResponse = {
  success: true,
  articles: [noteworthyArticle2, spotlightArticle],
  count: 2,
  total: 25,
  hasMore: true,
  cached: true,
  distribution: {
    critical: 1,
    major: 15,
    notable: 7,
    info: 2,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

export const lastPageResponse = {
  success: true,
  articles: [noteworthyArticle1],
  count: 1,
  total: 25,
  hasMore: false,
  cached: true,
  distribution: {
    critical: 1,
    major: 15,
    notable: 7,
    info: 2,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

export const emptyPageResponse = {
  success: true,
  articles: [],
  count: 0,
  total: 25,
  hasMore: false,
  cached: true,
  distribution: {
    critical: 1,
    major: 15,
    notable: 7,
    info: 2,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// Historical articles (older than 3 days)
export const historicalArticle1: MockArticle = {
  id: 'historical-1',
  title: 'TensorFlow 2.14: New XLA Compiler Optimizations',
  url: 'https://github.com/tensorflow/tensorflow/releases/tag/v2.14.0',
  source: 'github',
  category: 'launch',
  importanceLabel: 'MAJOR',
  importanceScore: 82,
  tags: ['🚀'],
  summary: [
    'Major XLA compiler improvements for GPU workloads',
    '25% faster training on TPU v4',
    'New keras.Model.fit() optimizations',
  ],
  insight: 'Worth upgrading if you have heavy GPU training workloads.',
  languages: ['python'],
  frameworks: ['tensorflow', 'keras'],
  topics: ['ml', 'training'],
  githubRepo: 'tensorflow/tensorflow',
  githubStars: 180000,
  githubLanguage: 'Python',
  publishedAt: '2024-01-01T10:00:00Z',
  section: 'historical',
}

export const historicalArticle2: MockArticle = {
  id: 'historical-2',
  title: 'Hugging Face Introduces Model Memory Mapping',
  url: 'https://huggingface.co/blog/memory-mapping',
  source: 'blog',
  category: 'performance',
  importanceLabel: 'NOTABLE',
  importanceScore: 68,
  tags: ['⚡'],
  summary: [
    'Load 70B models with less RAM using memory mapping',
    'Works with transformers 4.35+',
    'Reduces peak memory by 50%',
  ],
  insight: 'Game-changer for running large models on consumer hardware.',
  languages: ['python'],
  frameworks: ['transformers'],
  topics: ['llm', 'optimization'],
  publishedAt: '2023-12-28T14:00:00Z',
  section: 'historical',
}

// Last page of recent data (triggers transition to historical)
export const lastRecentPageResponse = {
  success: true,
  articles: [noteworthyArticle1],
  count: 1,
  total: 3,
  hasMore: false,
  cached: true,
  source: 'cache',
  oldestDate: '2024-01-09T14:00:00Z',
  distribution: {
    critical: 1,
    major: 1,
    notable: 1,
    info: 0,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// First page of historical data
export const firstHistoricalPageResponse = {
  success: true,
  articles: [historicalArticle1, historicalArticle2],
  count: 2,
  total: 10,
  hasMore: true,
  cached: false,
  source: 'database',
  oldestDate: '2023-12-28T14:00:00Z',
  distribution: {
    critical: 0,
    major: 1,
    notable: 1,
    info: 0,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// Last page of historical data
export const lastHistoricalPageResponse = {
  success: true,
  articles: [historicalArticle2],
  count: 1,
  total: 10,
  hasMore: false,
  cached: false,
  source: 'database',
  oldestDate: '2023-12-28T14:00:00Z',
  distribution: {
    critical: 0,
    major: 0,
    notable: 1,
    info: 0,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// arXiv articles (research papers)
export const arxivArticle1: MockArticle = {
  id: 'arxiv-1',
  title: 'Efficient Fine-Tuning of Large Language Models with LoRA 2.0',
  url: 'https://arxiv.org/abs/2401.23456',
  source: 'arxiv',
  category: 'research',
  importanceLabel: 'NOTABLE',
  importanceScore: 68,
  tags: ['📰'],
  summary: [
    'Improved low-rank adaptation method for LLM fine-tuning',
    'Reduces memory requirements by 40%',
    'Compatible with HuggingFace Transformers',
  ],
  insight: 'Useful for developers fine-tuning models on limited hardware.',
  codeExample: `from peft import LoraConfig, get_peft_model

config = LoraConfig(r=16, lora_alpha=32)
model = get_peft_model(base_model, config)`,
  codeLanguage: 'python',
  installCommand: 'pip install peft transformers',
  languages: ['python'],
  frameworks: ['transformers', 'peft'],
  topics: ['llm', 'fine-tuning'],
  author: 'Hu et al.',
  publishedAt: '2024-01-09T12:00:00Z',
  section: 'noteworthy',
}

export const arxivArticle2: MockArticle = {
  id: 'arxiv-2',
  title: 'Building Production RAG Systems: Lessons from Industry',
  url: 'https://arxiv.org/abs/2401.34567',
  source: 'arxiv',
  category: 'research',
  importanceLabel: 'NOTABLE',
  importanceScore: 65,
  tags: ['📰'],
  summary: [
    'Practical lessons for deploying RAG at scale',
    'Chunking strategies and embedding selection',
    'Hybrid search approaches with examples',
  ],
  insight: 'Essential reading for building production RAG pipelines.',
  languages: ['python'],
  frameworks: ['langchain', 'llamaindex'],
  topics: ['rag', 'llm'],
  author: 'Chen et al.',
  publishedAt: '2024-01-08T09:00:00Z',
  section: 'noteworthy',
}

export const arxivArticle3: MockArticle = {
  id: 'arxiv-3',
  title: 'Attention Mechanisms Revisited: A Comprehensive Survey',
  url: 'https://arxiv.org/abs/2401.45678',
  source: 'arxiv',
  category: 'research',
  importanceLabel: 'INFO',
  importanceScore: 52,
  tags: ['📰'],
  summary: [
    'Survey of attention mechanisms in modern architectures',
    'Comparison of multi-head, grouped-query, and flash attention',
    'Performance benchmarks across model sizes',
  ],
  insight: 'Good reference for understanding attention variants in LLMs.',
  languages: ['python'],
  frameworks: ['pytorch', 'transformers'],
  topics: ['llm', 'architecture'],
  author: 'Wang et al.',
  publishedAt: '2024-01-07T15:00:00Z',
  section: 'noteworthy',
}

// arXiv response with papers
export const arxivArticlesResponse = {
  success: true,
  articles: [arxivArticle1, arxivArticle2, arxivArticle3],
  count: 3,
  total: 3,
  hasMore: false,
  cached: false,
  distribution: {
    critical: 0,
    major: 0,
    notable: 2,
    info: 1,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// Mixed response with arXiv and other sources
export const mixedSourcesResponse = {
  success: true,
  articles: [criticalArticle, arxivArticle1, noteworthyArticle1, arxivArticle2],
  count: 4,
  total: 4,
  hasMore: false,
  cached: false,
  distribution: {
    critical: 1,
    major: 1,
    notable: 2,
    info: 0,
    trending: 0,
  },
  filters: {
    languages: [],
    frameworks: [],
  },
}

// arXiv article that also appears on HN (for deduplication testing)
export const arxivOnHnArticle: MockArticle = {
  id: 'arxiv-hn-1',
  title: 'Efficient Fine-Tuning of Large Language Models with LoRA 2.0',
  url: 'https://arxiv.org/abs/2401.23456', // Same URL as arxivArticle1
  source: 'hn',
  category: 'research',
  importanceLabel: 'NOTABLE',
  importanceScore: 72,
  tags: ['📰', '💬'],
  summary: [
    'Improved low-rank adaptation method for LLM fine-tuning',
    'Reduces memory requirements by 40%',
    'Compatible with HuggingFace Transformers',
  ],
  insight: 'Useful for developers fine-tuning models on limited hardware.',
  languages: ['python'],
  frameworks: ['transformers', 'peft'],
  topics: ['llm', 'fine-tuning'],
  author: 'Hu et al.',
  publishedAt: '2024-01-09T12:00:00Z',
  hnDiscussionUrl: 'https://news.ycombinator.com/item?id=12345678',
  section: 'noteworthy',
}
