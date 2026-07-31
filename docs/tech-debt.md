# Tech Debt

Tracking technical improvements to address in future versions.

---

## V2: Service Layer Architecture for Pagination

**Added**: 2026-01-26
**Priority**: Medium
**Effort**: 2-3 days

### Current State (V1)
The unlimited scroll feature uses a simple `older=true` query parameter to switch between cache and database tiers. The logic is embedded directly in the API route.

### Proposed Improvement
Refactor to a clean service layer architecture:

1. **`lib/types/articles.ts`** - Centralized type definitions
2. **`lib/repositories/article-repository.ts`** - Encapsulate all Prisma queries
3. **`lib/services/article-service.ts`** - Tier orchestration logic (cache vs DB decision)

### Benefits
- **Testability**: Each layer can be unit tested independently
- **Mixed pages**: Handle requests spanning cache/DB boundary seamlessly
- **Cursor pagination**: Easy to add cursor-based pagination for deep scrolling
- **Separation of concerns**: API route only handles HTTP, service handles business logic

### When to Address
- When adding cursor-based pagination
- When pagination logic becomes more complex
- When we need better test coverage for data fetching

### Reference
See architecture design in the code-architect agent output from 2026-01-26 (Approach 2: Clean Architecture).

---

## Future Items

_Add new tech debt items here as they arise._
