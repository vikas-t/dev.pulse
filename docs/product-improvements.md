# Product Improvement Review

**Date:** 2026-06-12
**Scope:** Full codebase review — pipeline, sources, AI layer, API routes, caching, frontend.

---

## Biggest Product Gaps

### 1. Tech-stack filtering has a complete backend but no UI
The schema calls it "CRITICAL for MVP", the API accepts `?languages=&frameworks=` params, and there's a `UserPreference` model — but `app/page.tsx` never sends filters and there's no filter UI anywhere.

**Why it matters:** This is the single highest-value thing to build next; the hard part is already done.

### 2. The pipeline re-pays OpenAI for the same articles every run
The orchestrator scores, validates, and summarizes every fetched article, then upserts by URL. Articles stay in the fetch window for days, so the same article gets scored + summarized on every pipeline run (cron is every 2 hours per the comment).

**Fix:** Skip URLs that already exist in the DB before the AI steps. This would cut the OpenAI bill by an order of magnitude and speed the pipeline up dramatically.

### 3. Mock data silently masquerades as real news
When the API fails or the DB is empty, `page.tsx` falls back to `MOCK_ARTICLES` — fabricated 2024 news items — with no visual indicator. For a news product, showing fake news on error is worse than showing an error. The empty state also tells end users to run `curl http://localhost:3000/api/cron/test`.

**Fix:** Replace both with honest empty/error states.

### 4. Refresh UX fights the product
The refresh button runs the entire pipeline (fetch → 3 AI passes → save) synchronously inside one HTTP request. That's minutes of work — risky against platform request timeouts, and the user just stares at a spinner. Combined with the global 24h lock, most visitors see a permanently disabled button.

**Better model:** Cron keeps data fresh in the background; the button becomes "check for updates" (cache invalidation + refetch), with a "last updated X ago" label instead of a lock.

---

## Data Quality & Robustness

- **`Promise.all` on six sources** in the orchestrator: if any fetcher throws, the whole pipeline dies. `Promise.allSettled` (or per-source try/catch) keeps five working sources alive when one API is down. CLAUDE.md explicitly says "don't assume external APIs are always available."

- **AI responses are `JSON.parse`d and trusted blindly** (`scorer.ts:124`, `summarizer.ts:99`). No validation that `score` is a number in 0–100 or `category` is a real category. One malformed response puts garbage in the DB. A small zod schema per AI response would fix it — and aligns with the "validate data from external sources" rule.

- **Zero-engagement filtering drops early news permanently.** An HN post fetched 10 minutes after posting has 0 points → dropped. If the next fetch window doesn't pick it up again, genuinely breaking news that just hadn't accumulated votes yet is lost. Consider deferring (re-check next run) rather than dropping.

- **Summarizer runs at temperature 0.7** while the prompt pleads "NEVER hallucinate." For factual extraction, 0.2–0.3 is the right setting — same as the scorer.

- **No retry/backoff on OpenAI calls** — one transient 429 silently drops that article from the feed.

---

## Smaller Things Worth Knowing

- `page.tsx` is ~800 lines with heavy `console.log` use and a `(window as any).__loadMore` test hook shipped to production — both violate CLAUDE.md rules (no console.logs, no `any`). The four article sections are also copy-paste of each other; extracting a `FeedSection` component would halve the file.

- The in-memory cache + global refresh lock assume a single server instance. Fine on Render today, but `refresh` invalidating the cache only on the instance that served it will surprise you at 2+ instances.

- Header says "Today's Top X AI Updates" but the window is 3 days — minor trust issue for a news product.

- `UserPreference` and `ArticleView` (analytics) tables exist but nothing writes to them — either wire them up or drop them.

- CLAUDE.md mandates reading `docs/Research.md`, `PLAN.md`, `DESIGNS.md` — none exist. Worth fixing the docs or the instructions.

---

## Open Questions (Blocking Prioritization)

1. **Is anything actually scheduled to call `/api/cron/fetch` on Render?** The code comments assume Vercel Cron, but deployment is on Render. If no cron exists, the feed only updates when someone clicks refresh once per 24h — meaning the product is essentially a daily snapshot, and fixing this is priority #1.

2. **Who is this for right now — just you, or public users?** That decides whether the global refresh lock is fine (personal tool) or hostile (public product).

3. **What's the OpenAI budget tolerance?** That decides how aggressively to attack the re-summarization waste vs. just shipping the filter UI first.

4. **Is the tech-stack filter UI already planned** (there are design docs for other features), or was it deliberately deferred?
