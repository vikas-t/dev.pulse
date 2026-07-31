# arXiv Integration Plan

## Overview

Add arXiv as a data source to fetch recent AI/ML research papers. This complements the existing GitHub and Hacker News sources by adding academic research content.

**Status:** IMPLEMENTED (2026-01-27)

---

## Current State

### Existing Sources
- **GitHub** (implemented): Trending repos + releases from major AI/ML libraries
- **Hacker News** (implemented): Top stories filtered for AI/ML keywords
- **arXiv** (stub): Returns empty array - needs implementation
- **Reddit, RSS, Dev.to** (stubs): Not implemented

### Existing Architecture
- Sources return `RawArticle[]` via `fetchXxxData()` functions
- Pipeline orchestrates: fetch → dedupe → score → summarize → tag → save
- Articles stored in PostgreSQL via Prisma
- Source type already defined: `'github' | 'hn' | 'reddit' | 'arxiv' | 'blog' | 'devto'`

---

## arXiv API Overview

### API Details
- **Endpoint:** `http://export.arxiv.org/api/query`
- **Format:** Atom XML feed
- **Authentication:** None required (public API)
- **Rate Limit:** Recommended 3-second delay between requests
- **Documentation:** https://info.arxiv.org/help/api/index.html

### Relevant Categories for AI/ML
| Category | Description |
|----------|-------------|
| `cs.AI` | Artificial Intelligence |
| `cs.LG` | Machine Learning |
| `cs.CL` | Computation and Language (NLP) |
| `cs.CV` | Computer Vision |
| `cs.NE` | Neural and Evolutionary Computing |
| `stat.ML` | Machine Learning (Statistics) |

### Query Parameters
| Param | Description | Example |
|-------|-------------|---------|
| `search_query` | Search terms with categories | `cat:cs.LG OR cat:cs.AI` |
| `start` | Offset for pagination | `0` |
| `max_results` | Number of results | `50` |
| `sortBy` | Sort field | `submittedDate` |
| `sortOrder` | Sort direction | `descending` |

### Sample API Response (Atom XML)
```xml
<entry>
  <id>http://arxiv.org/abs/2401.12345v1</id>
  <updated>2024-01-15T00:00:00Z</updated>
  <published>2024-01-14T00:00:00Z</published>
  <title>Attention Is All You Need (Revisited)</title>
  <summary>We present improvements to the transformer architecture...</summary>
  <author>
    <name>John Doe</name>
    <arxiv:affiliation>Stanford University</arxiv:affiliation>
  </author>
  <author>
    <name>Jane Smith</name>
  </author>
  <link href="http://arxiv.org/abs/2401.12345v1" rel="alternate" type="text/html"/>
  <link href="http://arxiv.org/pdf/2401.12345v1" rel="related" type="application/pdf"/>
  <arxiv:primary_category term="cs.LG"/>
  <category term="cs.LG"/>
  <category term="cs.AI"/>
</entry>
```

---

## Implementation Plan

### Phase 1: Core arXiv Fetcher

**File:** `lib/sources/arxiv.ts`

#### 1.1 Implement `fetchArxivData()`
- Query arXiv API for recent papers in AI/ML categories
- Parse Atom XML response
- Convert to `RawArticle[]` format
- Handle rate limiting (3-second delay between requests)
- Support mock data mode for testing

#### 1.2 Query Strategy
- Categories: `cs.AI`, `cs.LG`, `cs.CL`, `cs.CV`, `cs.NE`, `stat.ML`
- Time window: Last 7 days
- Max results: 50 papers per fetch
- Sort: By submission date (descending)

#### 1.3 Field Mapping

| arXiv Field | RawArticle Field |
|-------------|------------------|
| `<id>` | `url`, `sourceId` |
| `<title>` | `title` |
| `<summary>` | `content`, `excerpt` |
| `<published>` | `publishedAt` |
| `<author><name>` | `author` (first author) |
| `<arxiv:primary_category>` | Used for filtering |
| PDF link | Stored for reference |

#### 1.4 Mock Data
- Create 3-5 mock arXiv papers for testing
- Match real arXiv response structure
- Include variety: LLM paper, vision paper, training paper

---

### Phase 2: Database Schema (Optional)

Consider adding arXiv-specific fields to the Article model if needed:

```prisma
// Optional arXiv-specific fields (future consideration)
arxivId          String?   @map("arxiv_id")      // e.g., "2401.12345"
arxivCategories  String[]  @map("arxiv_categories") // ["cs.LG", "cs.AI"]
arxivPdfUrl      String?   @map("arxiv_pdf_url")
```

**Decision:** Start without schema changes. The existing `source: 'arxiv'` and `sourceId` fields are sufficient for V1. Add dedicated fields only if needed later.

---

### Phase 3: AI Scoring Adjustments

The existing AI scorer should handle arXiv papers well, but may need minor prompt adjustments:

#### 3.1 Category Mapping
arXiv papers will typically fall into:
- `research` - Most academic papers
- `breaking` - Novel architectures or significant findings
- `performance` - Benchmark improvements
- `tools` - New libraries or frameworks from papers

#### 3.2 Scoring Considerations
- Research papers may score lower than breaking changes by default
- Papers with code repositories should score higher
- Papers from major labs (OpenAI, Google, Meta) may warrant higher scores

**Decision:** No changes needed for V1. The existing scorer handles research content appropriately. Monitor scores after launch and adjust if needed.

---

### Phase 4: Integration with Pipeline

**File:** `lib/pipeline/orchestrator.ts`

The pipeline already calls `fetchArxivData()` - it just returns empty. Once implemented:
1. arXiv articles will be fetched in parallel with other sources
2. Deduplication will catch papers also posted to HN
3. AI scoring will categorize as `research` or appropriate category
4. Summarization will generate developer-focused summaries

No changes needed to the orchestrator.

---

### Phase 5: Deduplication

**File:** `lib/pipeline/dedup.ts`

#### 5.1 Cross-Source Detection
Papers may appear in multiple sources:
- arXiv paper URL shared on Hacker News
- GitHub repo linked to arXiv paper

Current dedup handles:
- Exact URL match (covers arXiv links on HN)
- Title similarity (covers reposted papers)

**Decision:** No changes needed. Existing dedup logic is sufficient.

---

## Implementation Checklist

### Files to Modify
1. `lib/sources/arxiv.ts` - Main implementation
2. `e2e/fixtures/mock-data.ts` - Add arXiv mock articles

### Files Unchanged
- `lib/sources/types.ts` - Already has `'arxiv'` source type
- `prisma/schema.prisma` - No schema changes needed for V1
- `lib/pipeline/orchestrator.ts` - Already calls `fetchArxivData()`
- `lib/pipeline/dedup.ts` - Existing logic handles arXiv
- `lib/ai/scorer.ts` - Handles research content
- `lib/ai/summarizer.ts` - Handles all article types

---

## E2E Test Scenarios

### New Test File: `e2e/tests/arxiv-source.spec.ts`

#### Test 1: arXiv articles appear in feed
- Mock arXiv API response with 2-3 papers
- Verify papers display in the feed
- Verify source shows as 'arxiv'
- Verify title and summary are displayed correctly

#### Test 2: arXiv articles have correct metadata
- Mock response with paper including authors, categories
- Verify author name displays
- Verify arXiv link works (opens paper URL)

#### Test 3: arXiv articles are categorized correctly
- Mock paper with AI scoring response
- Verify it appears in correct section (likely "New & Noteworthy" for research)
- Verify category is set (likely 'research')

#### Test 4: arXiv articles work with filters
- Mock arXiv papers with specific languages/frameworks
- Apply filter (e.g., "python")
- Verify filtered results include/exclude arXiv papers correctly

#### Test 5: Deduplication works across arXiv and HN
- Mock same paper appearing in both arXiv and HN sources
- Verify only one copy appears in feed
- Verify engagement metrics are merged (HN comments visible)

#### Test 6: Error handling for arXiv API
- Mock arXiv API returning error (500 status)
- Verify other sources still work
- Verify no crash, graceful degradation
- Verify error is logged

#### Test 7: Empty arXiv response handling
- Mock arXiv API returning 0 papers
- Verify feed still loads with other sources
- Verify no errors in UI

### Existing Tests to Verify

Ensure these existing test suites still pass after implementation:

1. **`e2e/tests/infinite-scroll.spec.ts`** (11 tests)
   - Pagination should work with arXiv articles mixed in
   - Loading states unaffected

2. **`e2e/tests/unlimited-scroll.spec.ts`** (9 tests)
   - Historical mode should include arXiv articles
   - Deduplication at boundary unaffected

3. **`e2e/tests/article-card.spec.ts`**
   - Article cards should display arXiv papers correctly
   - Code examples (if present) should work

4. **`e2e/tests/states.spec.ts`**
   - Loading, empty, and error states unaffected

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| arXiv API rate limiting | Medium | Add 3-second delay, implement exponential backoff |
| XML parsing errors | Low | Use robust XML parser, validate response structure |
| Papers without clear dev relevance | Low | AI scorer filters low-relevance papers |
| Large response times | Low | Set timeout, fetch in parallel with other sources |
| API format changes | Low | Version check, graceful degradation |

---

## Out of Scope (V1)

- GitHub repo detection from paper links
- Citation counts or impact metrics
- Author affiliation display
- PDF content extraction
- Paper summarization beyond abstract
- arXiv-specific database fields

---

## Success Criteria

1. arXiv papers appear in the feed alongside GitHub and HN content
2. Papers are properly categorized and scored
3. Deduplication works when papers are also shared on HN
4. No regression in existing test suites
5. Error handling prevents crashes if arXiv API is down

---

## Timeline Estimate

| Phase | Scope |
|-------|-------|
| Phase 1 | Core fetcher implementation |
| Phase 2 | Skipped (no schema changes) |
| Phase 3 | Skipped (no scorer changes) |
| Phase 4 | Skipped (no orchestrator changes) |
| Phase 5 | Skipped (no dedup changes) |
| E2E Tests | New test file + verification |

**Total:** Implementing Phase 1 + E2E tests

---

## Approval

**Please review and confirm:**
- [x] Approach looks good
- [x] Categories to fetch are appropriate (cs.AI, cs.LG, cs.CL)
- [x] E2E test scenarios are sufficient
- [x] Ready to proceed with implementation

---

## Implementation Notes

**Completed:** 2026-01-27

**Files Modified:**
1. `lib/sources/arxiv.ts` - Full implementation with XML parsing, rate limiting, mock data
2. `e2e/fixtures/mock-data.ts` - Added arXiv mock articles and responses
3. `e2e/tests/arxiv-source.spec.ts` - 8 E2E tests for arXiv integration

**Dependencies Added:**
- `fast-xml-parser` - For parsing arXiv Atom XML responses

**Key Decisions:**
- Categories: cs.AI, cs.LG, cs.CL (most relevant for developers)
- Papers fetched: 20 (configurable)
- Rate limiting: 3-second delay before API request
- Time window: Last 7 days

**Test Results:**
- 8 new arXiv tests: All passed
- 71 existing tests: All passed (1 pre-existing failure unrelated to arXiv)

---

*Created: 2026-01-27*
