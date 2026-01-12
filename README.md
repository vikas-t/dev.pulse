# dev.pulse

> Your daily AI/ML news briefing — curated for developers.

dev.pulse aggregates AI news from multiple sources, scores them with AI, and delivers a balanced daily briefing with code examples, GitHub integration, and tech stack filtering.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Playwright](https://img.shields.io/badge/Tested%20with-Playwright-green?logo=playwright)

## Features

- **Balanced Feed** — Not just breaking news. Get a mix of critical updates, new launches, trending repos, and industry news
- **Smart Sections** — Articles grouped into Critical, New & Noteworthy, and GitHub Spotlight
- **AI Scoring** — GPT-4 powered importance scoring (BREAKING → MAJOR → NOTABLE → INFO)
- **Visual Tags** — Quick-scan emoji tags: 🔴 Breaking, 🚀 Launch, ⭐ Trending, 🔒 Security, 🐛 Known Issue
- **Code Examples** — Install commands, quick start snippets, and migration guides
- **Tech Stack Filtering** — Filter by language (Python, JS, Go) or framework (PyTorch, LangChain)
- **Multiple Sources** — GitHub releases, Hacker News, Reddit, arXiv, RSS feeds

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| AI | OpenAI GPT-4 |
| Styling | Tailwind CSS |
| Testing | Playwright |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or [Supabase](https://supabase.com) account)
- OpenAI API key
- GitHub token (optional, increases rate limits)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/dev.pulse.git
cd dev.pulse

# Install dependencies
npm install

# Install Playwright browsers (for testing)
npx playwright install chromium
```

### Environment Setup

```bash
# Copy example env file
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

Required environment variables:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
GITHUB_TOKEN="ghp_..."  # Optional but recommended
```

### Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Fetching Articles

Trigger the data pipeline to fetch and process articles:

```bash
# Manual trigger (development only)
curl http://localhost:3000/api/cron/test
```

## Testing

```bash
# Run all E2E tests
npm run e2e

# Run with interactive UI
npm run e2e:ui

# View test report
npm run e2e:report
```

## Project Structure

```
dev.pulse/
├── app/
│   ├── api/
│   │   ├── articles/today/   # Balanced feed API
│   │   └── cron/             # Pipeline triggers
│   ├── layout.tsx
│   └── page.tsx              # Main feed page
├── components/
│   ├── CategoryBadge.tsx     # Category labels
│   ├── CodeBlock.tsx         # Syntax highlighting
│   └── DevArticleCard.tsx    # Article card component
├── lib/
│   ├── ai/
│   │   ├── scorer.ts         # AI importance scoring
│   │   └── summarizer.ts     # AI summarization
│   ├── pipeline/
│   │   ├── orchestrator.ts   # Main pipeline
│   │   └── dedup.ts          # Deduplication
│   └── sources/              # Data source fetchers
│       ├── github.ts
│       ├── hackernews.ts
│       └── ...
├── e2e/
│   ├── fixtures/             # Mock data
│   └── tests/                # Playwright tests
└── prisma/
    └── schema.prisma         # Database schema
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/articles/today` | Fetch today's balanced feed |
| `GET /api/cron/test` | Trigger pipeline (dev only) |
| `GET /api/cron/fetch` | Trigger pipeline (production) |

### Query Parameters

```
/api/articles/today?limit=10&languages=python,javascript&frameworks=pytorch
```

## Content Categories

| Category | Description | Tag |
|----------|-------------|-----|
| `breaking` | Breaking changes, deprecations | 🔴 |
| `security` | CVEs, vulnerabilities | 🔒 |
| `launch` | Product launches, new features | 🚀 |
| `trending` | GitHub fast-growers | ⭐ |
| `library` | New libraries, frameworks | 📚 |
| `tools` | Developer tools, CLI, IDE | 🛠️ |
| `performance` | Optimizations, benchmarks | ⚡ |
| `known_issue` | Bugs, workarounds | 🐛 |
| `case_study` | Production stories | 🏭 |
| `industry` | Layoffs, funding, acquisitions | 📰 |
| `research` | Papers, academic work | 🔬 |
| `community` | Discussions, tutorials | 💬 |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), and [Claude Code](https://claude.ai/code)
