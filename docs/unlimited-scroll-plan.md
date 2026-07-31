# Unlimited Scroll with Tiered Caching

**Status: IMPLEMENTED** (2026-01-26)

## Overview

Currently, the infinite scroll is limited to the last 3 days of data. This plan extends it to support **unlimited scrolling** - users can scroll back through all historical data in the database.

### Current Behavior
- Cache holds last 3 days of articles
- Pagination only works within that 3-day window
- `hasMore: false` when 3-day data is exhausted

### Target Behavior
- Last 3 days: Served from in-memory cache (fast)
- Older data: Served from database on-demand (slower but available)
- No artificial limit - scroll as far back as data exists

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Scrolling                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /api/articles/today                          │
│                                                                 │
│   offset=0-N (within 3-day cache)                              │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐                                              │
│   │  In-Memory  │  ◄── Fast (microseconds)                     │
│   │    Cache    │      Last 3 days of articles                 │
│   └─────────────┘                                              │
│        │                                                        │
│        │ Cache exhausted? Continue to DB...                    │
│        ▼                                                        │
│   offset=N+ (beyond cache)                                     │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐                                              │
│   │  Database   │  ◄── Slower (milliseconds)                   │
│   │   Query     │      Articles older than 3 days              │
│   └─────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Changes

### Request Parameters (unchanged)
```
GET /api/articles/today?offset=0&limit=10
```

### Response Changes

```typescript
// Current response
{
  articles: Article[],
  total: number,        // Total in 3-day window
  hasMore: boolean,     // False when 3-day exhausted
  cached: boolean,
}

// New response
{
  articles: Article[],
  total: number,        // Total articles fetched so far (not all-time)
  hasMore: boolean,     // True if more data exists in DB
  cached: boolean,      // True if this page came from cache
  source: 'cache' | 'database',  // Which tier served this request
  oldestArticleDate: string,     // ISO date of oldest article returned
}
```

---

## Implementation Plan

### Phase 1: Track Cache Boundaries

**File: `lib/cache/articles-cache.ts`**

Add metadata to track what's cached:

```typescript
interface CacheEntry {
  data: Article[]
  timestamp: number
  epoch: string
  isValid: boolean
  // NEW: Track boundaries
  oldestDate: Date      // Oldest article date in cache
  newestDate: Date      // Newest article date in cache
  totalCached: number   // Count of articles in cache
}
```

Add method to check if offset is within cache:

```typescript
isOffsetInCache(offset: number): boolean {
  return cache && cache.isValid && offset < cache.data.length
}

getCacheSize(): number {
  return cache?.data.length ?? 0
}
```

---

### Phase 2: Modify API Route

**File: `app/api/articles/today/route.ts`**

#### Step 1: Check if request is within cache bounds

```typescript
const cacheSize = articlesCache.getCacheSize()
const isWithinCache = offset < cacheSize

if (!hasFilters && isWithinCache) {
  // Serve from cache (existing logic)
  const cached = articlesCache.getCached(epoch)
  if (cached) {
    const page = cached.slice(offset, offset + limit)
    return NextResponse.json({
      articles: page,
      hasMore: true,  // Always true - more data may exist in DB
      source: 'cache',
      // ...
    })
  }
}
```

#### Step 2: Query database for older articles

When offset exceeds cache, query database for older data:

```typescript
// Calculate how many articles we need from DB
const dbOffset = offset - cacheSize
const dbLimit = limit

// Query articles OLDER than cache boundary
const olderArticles = await prisma.article.findMany({
  where: {
    importanceScore: { gte: 40 },
    publishedAt: { lt: cacheOldestDate },  // Before cache window
  },
  orderBy: [
    { importanceScore: 'desc' },
    { publishedAt: 'desc' }
  ],
  skip: dbOffset,
  take: dbLimit,
})
```

#### Step 3: Determine hasMore

```typescript
// Check if more articles exist beyond this page
const nextPageExists = await prisma.article.count({
  where: {
    importanceScore: { gte: 40 },
    publishedAt: { lt: oldestReturnedDate },
  },
}) > 0

return NextResponse.json({
  articles: olderArticles,
  hasMore: nextPageExists,
  source: 'database',
})
```

---

### Phase 3: Handle Edge Cases

#### Mixed Page (Cache + DB)

When a page spans both cache and database:

```typescript
// Example: cache has 25 articles, request is offset=20, limit=10
// Need 5 from cache + 5 from database

const fromCache = cached.slice(offset, cacheSize)  // Articles 20-24
const dbNeeded = limit - fromCache.length           // Need 5 more

const fromDb = await prisma.article.findMany({
  where: {
    importanceScore: { gte: 40 },
    publishedAt: { lt: cacheOldestDate },
  },
  orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
  take: dbNeeded,
})

const page = [...fromCache, ...fromDb]
```

#### Filters Applied

When filters are applied, bypass cache entirely and query database:

```typescript
if (hasFilters) {
  // Query database directly with filters
  // No cache involved for filtered requests
  const articles = await prisma.article.findMany({
    where: {
      importanceScore: { gte: 40 },
      ...(languages?.length && { languages: { hasSome: languages } }),
      ...(frameworks?.length && { frameworks: { hasSome: frameworks } }),
    },
    orderBy: [{ importanceScore: 'desc' }, { publishedAt: 'desc' }],
    skip: offset,
    take: limit,
  })
}
```

---

### Phase 4: Performance Considerations

#### Database Index

Ensure compound index exists for efficient pagination:

```prisma
// prisma/schema.prisma
model Article {
  // ...

  @@index([importanceScore(sort: Desc), publishedAt(sort: Desc)])
}
```

#### Cursor-Based Pagination (Future Optimization)

For very deep pagination, consider switching to cursor-based:

```typescript
// Instead of offset/limit:
GET /api/articles/today?cursor=article_id_123&limit=10

// Query:
const articles = await prisma.article.findMany({
  where: {
    importanceScore: { gte: 40 },
    OR: [
      { importanceScore: { lt: cursorScore } },
      {
        importanceScore: cursorScore,
        publishedAt: { lt: cursorDate }
      }
    ]
  },
  take: limit,
})
```

This is more efficient for deep pagination but adds complexity. **Recommend deferring to V2.**

---

## Summary of Changes

| File | Change |
|------|--------|
| `lib/cache/articles-cache.ts` | Add boundary tracking, `isOffsetInCache()`, `getCacheSize()` |
| `app/api/articles/today/route.ts` | Tiered fetch logic (cache → DB), updated `hasMore` logic |
| `prisma/schema.prisma` | Verify compound index exists |

---

## Testing Plan

1. **Cache-only pagination**: Verify first N articles come from cache
2. **DB-only pagination**: Verify deep pagination fetches from database
3. **Mixed page**: Verify pages spanning cache/DB boundary work correctly
4. **Filtered requests**: Verify filters bypass cache and query DB
5. **Empty database**: Verify graceful handling when no more data
6. **Performance**: Verify DB queries remain fast with proper indexing

---

## Rollout

1. Implement cache boundary tracking
2. Update API route with tiered logic
3. Test with small cache (force early DB fallback)
4. Deploy and monitor query performance
5. Consider cursor pagination if deep pagination is slow

---

## Questions Resolved

1. **Sort order for historical data**: Keep importance-first ordering for consistency.

2. **UI indicator**: Show "Earlier Articles" section header (option C) when entering historical data.

3. **Rate limiting**: No rate limiting for V1. Natural pagination throttles requests.

4. **Header text**: Dynamically update to show date range of oldest article.

5. **Filtered requests**: Support unlimited scroll for filtered requests too.