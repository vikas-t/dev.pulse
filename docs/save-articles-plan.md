# Save Articles Feature Plan

## Overview

Allow users to save articles for later reading. Saved articles persist across sessions and can be accessed from a dedicated view.

**Status:** Implemented (V1)

---

## User Stories

1. **As a user**, I want to save an article so I can read it later
2. **As a user**, I want to see which articles I've already saved
3. **As a user**, I want to access all my saved articles in one place
4. **As a user**, I want to remove articles from my saved list

---

## UI Design

### 1. Save Button on Article Cards

Add a star icon to each article card header.

**Location:** Top-right of article card, next to the date

**States:**
- **Unsaved:** Outline star icon (subtle, zinc-500)
- **Saved:** Filled star icon (amber-400)

**Interaction:**
- Click to toggle save/unsave
- Visual feedback on state change (scale animation)
- Toast notification confirms action

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 BREAKING  security                    Jan 10  [⭐]      │
│                                                             │
│ PyTorch 2.2: Critical Security Vulnerability                │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2. Persistent Collapsible Sidebar

**Implementation (Final):** Persistent collapsible sidebar on the left

**Desktop Behavior:**
- Sidebar is persistent (always visible)
- Hamburger icon toggles between collapsed (48px) and expanded (320px)
- When collapsed: shows hamburger icon + star icon with saved count
- When expanded: shows full saved articles list
- Main content shifts right to accommodate sidebar

**Mobile Behavior:**
- Sidebar is hidden when collapsed (0px width)
- Hamburger icon in header opens the sidebar full-width
- Can close by clicking hamburger again

```
Collapsed (Desktop):            Expanded:
┌──┬─────────────────────┐     ┌─────────────┬─────────────────┐
│☰ │                     │     │ ☰ ⭐ Saved  │                 │
│⭐│  dev.pulse          │     │   3 articles│  dev.pulse      │
│ 3│                     │     │─────────────│                 │
│  │  [Article Feed...]  │     │ [Article 1] │  [Article Feed] │
│  │                     │     │ [Article 2] │                 │
└──┴─────────────────────┘     └─────────────┴─────────────────┘
```

### 3. Empty State for Saved Articles

When no articles are saved:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                        ⭐                                   │
│                                                             │
│              No saved articles                              │
│                                                             │
│       Click the star icon on any article to save it         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Storage

### Option A: LocalStorage (Recommended for V1)

**Pros:**
- No backend changes
- Works offline
- Instant save/load
- Simple implementation

**Cons:**
- Limited to single browser/device
- Lost if user clears browser data
- ~5MB storage limit (plenty for article IDs)

**Implementation:**
```typescript
// Store array of saved article IDs
localStorage.setItem('savedArticles', JSON.stringify(['id1', 'id2', ...]))
```

### Option B: Database (Future V2)

**Pros:**
- Cross-device sync
- Persistent storage
- Can track save analytics

**Cons:**
- Requires user accounts/sessions
- Backend API changes
- More complex

**Recommendation:** Start with LocalStorage for V1. Add database sync in V2 if user accounts are implemented.

---

## Technical Implementation

### 1. React Context for Saved Articles

Create a context to manage saved articles state across components.

```typescript
interface SavedArticlesContextType {
  savedArticleIds: Set<string>
  saveArticle: (id: string) => void
  unsaveArticle: (id: string) => void
  isSaved: (id: string) => boolean
  savedCount: number
}
```

### 2. Components to Create/Modify

| Component | Action |
|-----------|--------|
| `SavedArticlesProvider` | New - Context provider with localStorage sync |
| `SaveButton` | New - Bookmark toggle button |
| `SavedArticlesPanel` | New - Slide-out panel for saved articles |
| `DevArticleCard` | Modify - Add SaveButton |
| `Header` | Modify - Add saved count/link |

### 3. LocalStorage Schema

```typescript
interface SavedArticleData {
  id: string
  savedAt: string  // ISO date
  title: string    // For display even if article not in current feed
  url: string      // For direct access
}

// Stored as:
// localStorage key: 'pulse_saved_articles'
// value: JSON array of SavedArticleData
```

---

## User Flow

### Saving an Article

1. User sees article in feed
2. User clicks bookmark icon
3. Icon fills in, article ID saved to localStorage
4. Header counter increments
5. Toast notification: "Article saved" (optional)

### Viewing Saved Articles

1. User clicks "Saved" in header
2. Slide-out panel opens from right
3. Panel shows list of saved articles
4. User can click article to open in new tab
5. User can unsave articles from this view
6. User clicks outside or X to close panel

### Unsaving an Article

1. User clicks filled bookmark icon (in feed or saved panel)
2. Icon returns to outline state
3. Article removed from localStorage
4. Header counter decrements
5. If in saved panel, article removed from list

---

## Edge Cases

1. **Article no longer in feed**: Saved article may have aged out of the feed. Store enough data (title, URL) to display in saved list.

2. **LocalStorage full**: Unlikely with just article metadata. Handle gracefully with error message if occurs.

3. **Browser without localStorage**: Rare. Detect and hide save functionality, or show message.

4. **Duplicate saves**: Use Set or check before adding to prevent duplicates.

---

## E2E Test Scenarios

### Test 1: Save button appears on articles
- Load feed with articles
- Verify bookmark icon visible on each article card

### Test 2: Clicking save button saves article
- Click bookmark icon on article
- Verify icon changes to filled state
- Verify localStorage contains article ID

### Test 3: Saved counter updates
- Save an article
- Verify header shows "1 Saved"
- Save another article
- Verify header shows "2 Saved"

### Test 4: Unsave article
- Save an article
- Click bookmark icon again
- Verify icon returns to outline state
- Verify article removed from localStorage

### Test 5: Saved articles panel opens
- Save an article
- Click "Saved" in header
- Verify panel opens
- Verify saved article appears in panel

### Test 6: Saved articles persist across page reload
- Save an article
- Reload page
- Verify article still shows as saved (filled icon)
- Verify header counter correct

### Test 7: Empty saved state
- Open saved panel with no saved articles
- Verify empty state message appears

### Test 8: Remove from saved panel
- Save an article
- Open saved panel
- Click unsave button in panel
- Verify article removed from panel
- Verify article in feed shows outline icon

---

## Out of Scope (V1)

- User accounts / authentication
- Cross-device sync
- Saved article folders/categories
- Export saved articles
- Share saved articles
- Saved article notes/annotations
- Offline reading of saved articles

---

## Open Questions

1. **Panel or page?** Recommendation is slide-out panel. Confirm preference.

2. **Toast notifications?** Show "Saved!" toast on save? Could be noisy if saving multiple.

3. **Sort order in saved panel?** By save date (newest first) or by article date?

4. **Max saved articles?** Limit to prevent localStorage bloat? Suggest 100 max.

---

## Success Criteria

1. Users can save/unsave articles with a single click
2. Saved state persists across browser sessions
3. Saved articles accessible from dedicated panel
4. No regression in existing functionality
5. All 8 E2E tests pass

---

## Approval

**Please review and confirm:**
- [ ] UI design approach (save button location, panel vs page)
- [ ] LocalStorage for V1 is acceptable
- [ ] Slide-out panel preferred over separate route
- [ ] Test scenarios are sufficient
- [ ] Ready to proceed with implementation

---

## Tech Debt Notes (V2 Improvements)

The following improvements were identified during architecture design and code review but deferred for V1:

### High Priority (DRY Violations)

1. **Centralized Type Definitions**: Extract shared `Article` interface and `Category` type to `/types/article.ts` to avoid duplication across `page.tsx`, `DevArticleCard.tsx`, `SavedArticlesPanel.tsx`, and `CategoryBadge.tsx`

2. **Shared Icon Components**: Extract bookmark SVG to `/components/icons/BookmarkIcon.tsx` - currently duplicated in `SaveButton.tsx`, `SavedArticlesPanel.tsx`, and `page.tsx`

3. **ImportanceBadge Component**: Extract importance label styling (BREAKING/MAJOR/NOTABLE/INFO) to shared component - duplicated in `DevArticleCard.tsx` and `SavedArticlesPanel.tsx`

### Medium Priority (Architecture)

4. **Merge useSavedArticles Hook**: The separate `hooks/useSavedArticles.ts` file is trivial (13 lines) and could be merged into `SavedArticlesContext.tsx`

5. **Separate Hooks for Utilities**:
   - `useLocalStorage.ts` - Generic localStorage hook with tab sync support
   - `useKeyPress.ts` - Reusable keyboard event listener

6. **Component Extraction**:
   - Extract `SavedArticleItem` from `SavedArticlesPanel.tsx` to its own file
   - Extract header into a separate `Header.tsx` component

### Low Priority (Enhancements)

7. **Context Improvements**:
   - Add localStorage sync across browser tabs using `storage` events
   - Debounce localStorage writes for rapid save/unsave actions
   - Surface localStorage quota errors to user via toast

8. **Race Condition Fix**: The `saveArticle` limit check could be bypassed with rapid clicks - use functional state update pattern

9. **Validation Improvements**: Add validation for all required `SavedArticleData` fields when loading from localStorage

10. **Testing**:
    - Unit tests for `useSavedArticles` hook
    - Unit tests for `useToast` hook
    - E2E tests for save articles feature (8 scenarios in this document)

11. **Accessibility Enhancements**:
    - Focus trap in panel (currently basic)
    - Return focus to trigger button on close
    - Tab through save buttons with Enter to toggle

---

*Created: 2026-01-27*
*Updated: 2026-01-28 - Implemented V1 with hybrid architecture*
