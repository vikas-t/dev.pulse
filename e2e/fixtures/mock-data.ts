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
  section?: 'critical' | 'noteworthy' | 'spotlight'
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

// Full mock response with all sections
export const mockArticlesResponse = {
  success: true,
  articles: [criticalArticle, noteworthyArticle1, noteworthyArticle2, spotlightArticle],
  count: 4,
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
