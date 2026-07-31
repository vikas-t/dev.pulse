# Save Articles - UI Design

## Overview

This document details the UI design for the Save Articles feature using a slide-out panel approach.

**Status:** Pending Review

---

## Full Page Layouts

### Desktop - Panel Closed (Normal State)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                BROWSER WINDOW                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  AI Updates                                        [🔖 3 Saved] [↻ Refresh]│  │
│  │  2 of 25 articles • Last 3 days                                            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  🔴 CRITICAL & BREAKING                                                    │  │
│  │  Breaking changes, security updates                                        │  │
│  ├────────────────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🔴 BREAKING security              pytorch/pytorch ⭐78K  Jan 10 [🔖] │  │  │
│  │  │                                                                      │  │  │
│  │  │ PyTorch 2.2: Critical Security Vulnerability in Model Loading        │  │  │
│  │  │                                                                      │  │  │
│  │  │ • Critical RCE vulnerability in torch.load()                         │  │  │
│  │  │ • Affects all versions < 2.2.0                                       │  │  │
│  │  │                                                                      │  │  │
│  │  │ python  pytorch  security                          ↓ Show more       │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  🟢 NEW & NOTEWORTHY                                                       │  │
│  │  Launches, tools, trending projects                                        │  │
│  ├────────────────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🚀 MAJOR launch                   ollama/ollama ⭐55K   Jan 9  [🔖] │  │  │
│  │  │                                                                      │  │  │
│  │  │ Ollama 0.2: Multi-model Serving and Faster Inference                 │  │  │
│  │  │ ...                                                                  │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                            │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 📰 NOTABLE research                  arxiv.org          Jan 9  [🔖] │  │  │
│  │  │                                                                      │  │  │
│  │  │ Efficient Fine-Tuning with LoRA 2.0                                  │  │  │
│  │  │ ...                                                                  │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

[🔖] = Bookmark icon (outline when unsaved, filled amber when saved)
```

### Desktop - Panel Open

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                BROWSER WINDOW                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────┬─────────────────────────────────────────────────┐  │
│  │                          │                                                 │  │
│  │  🔖 Saved Articles  [✕]  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  3 articles              │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │ ─────────────────────────│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                          │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  ┌────────────────────┐  │ ░░░░░░░░░░░ DARKENED BACKDROP ░░░░░░░░░░░░░░░ │  │
│  │  │ 🔴 security   [🔖] │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │                    │  │ ░░░░░░░░░░░ (click to close) ░░░░░░░░░░░░░░░░ │  │
│  │  │ PyTorch 2.2:       │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ Critical Security  │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ Vulnerability...   │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │                    │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ pytorch • Jan 10   │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  └────────────────────┘  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                          │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  ┌────────────────────┐  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ 🚀 launch     [🔖] │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │                    │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ Ollama 0.2:        │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ Multi-model...     │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │                    │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ ollama • Jan 9     │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  └────────────────────┘  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                          │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  ┌────────────────────┐  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ 📰 research   [🔖] │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │                    │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ LoRA 2.0:          │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │ Efficient Fine...  │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  │                    │  │                                                 │  │
│  │  │ arxiv • Jan 9      │  │        ◄──────── Main content dimmed ────────►  │  │
│  │  └────────────────────┘  │                                                 │  │
│  │                          │                                                 │  │
│  └──────────────────────────┴─────────────────────────────────────────────────┘  │
│                                                                                  │
│   ◄────── 400px ──────►        ◄─────────── ~70% width ───────────►             │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

← Panel slides in from left edge (slides RIGHT to open)
Backdrop darkens the main content
Click backdrop OR [✕] to close
```

### Mobile - Panel Closed (Normal State)

```
┌────────────────────────┐
│      MOBILE SCREEN     │
├────────────────────────┤
│                        │
│ [☰]     AI Updates [↻] │  ← [☰] = hamburger menu (opens saved panel)
│                        │
├────────────────────────┤
│ 🔴 CRITICAL & BREAKING │
├────────────────────────┤
│ ┌────────────────────┐ │
│ │🔴 security    [🔖] │ │
│ │                    │ │
│ │ PyTorch 2.2:       │ │
│ │ Critical Security  │ │
│ │ Vulnerability...   │ │
│ │                    │ │
│ │ • Critical RCE...  │ │
│ │ • Affects all...   │ │
│ │                    │ │
│ │ python pytorch     │ │
│ │        ↓ Show more │ │
│ └────────────────────┘ │
│                        │
├────────────────────────┤
│ 🟢 NEW & NOTEWORTHY    │
├────────────────────────┤
│ ┌────────────────────┐ │
│ │🚀 launch      [🔖] │ │
│ │                    │ │
│ │ Ollama 0.2:        │ │
│ │ Multi-model...     │ │
│ │                    │ │
│ └────────────────────┘ │
│                        │
│ ┌────────────────────┐ │
│ │📰 research    [🔖] │ │
│ │                    │ │
│ │ LoRA 2.0:          │ │
│ │ Efficient...       │ │
│ │                    │ │
│ └────────────────────┘ │
│                        │
└────────────────────────┘

Note: No saved count shown on mobile header
Hamburger menu on LEFT opens the saved articles panel
```

### Mobile - Panel Open (Full Screen)

```
┌────────────────────────┐
│      MOBILE SCREEN     │
├────────────────────────┤
│                        │
│ 🔖 Saved Articles  [✕] │  ← Panel header with close button
│ 3 articles             │
│                        │
├────────────────────────┤
│                        │
│ ┌────────────────────┐ │
│ │ 🔴 security   [🔖] │ │  ← Saved article card
│ │                    │ │
│ │ PyTorch 2.2:       │ │
│ │ Critical Security  │ │
│ │ Vulnerability...   │ │
│ │                    │ │
│ │ pytorch • Jan 10   │ │
│ └────────────────────┘ │
│                        │
│ ┌────────────────────┐ │
│ │ 🚀 launch     [🔖] │ │
│ │                    │ │
│ │ Ollama 0.2:        │ │
│ │ Multi-model...     │ │
│ │                    │ │
│ │ ollama • Jan 9     │ │
│ └────────────────────┘ │
│                        │
│ ┌────────────────────┐ │
│ │ 📰 research   [🔖] │ │
│ │                    │ │
│ │ LoRA 2.0:          │ │
│ │ Efficient Fine...  │ │
│ │                    │ │
│ │ arxiv • Jan 9      │ │
│ └────────────────────┘ │
│                        │
│                        │
│                        │
└────────────────────────┘

On mobile, panel covers 100% of screen
Panel slides in from LEFT (slides RIGHT to open)
No backdrop needed - panel IS the screen
[✕] button to return to feed
```

### Mobile Header Close-up

```
PANEL CLOSED:
┌────────────────────────────────┐
│                                │
│  [☰]      AI Updates      [↻]  │
│                                │
└────────────────────────────────┘
   ↑                          ↑
hamburger                  refresh
(opens saved               button
 panel)

No saved article count on mobile header.
Clean, minimal design.
```

### Desktop Header Close-up

```
PANEL CLOSED - with saved articles:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  AI Updates                              [🔖 3 Saved] [↻ Refresh]│
│  2 of 25 articles • Last 3 days                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                                 ↑
                                           Shows text + count
                                           Amber colored when > 0

PANEL CLOSED - no saved articles:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  AI Updates                                [🔖 Saved] [↻ Refresh]│
│  2 of 25 articles • Last 3 days                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                                 ↑
                                           Dimmed/subtle when 0
```

---

## 1. Save Button on Article Cards

### Location
Top-right corner of the article card header, aligned with the date.

### Visual Design

```
┌────────────────────────────────────────────────────────────────────┐
│ 🔴 BREAKING  security   BREAKING        pytorch/pytorch ⭐ 78,000  │
│                                              Jan 10   [🔖]         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ PyTorch 2.2: Critical Security Vulnerability in Model Loading      │
│                                                                    │
│ pip install torch>=2.2.0                                    [📋]   │
│                                                                    │
│ • Critical RCE vulnerability in torch.load() function              │
│ • Affects all versions < 2.2.0                                     │
│ • Immediate upgrade required for production systems                │
│                                                                    │
│ python  pytorch  security  ml                                      │
│                                                                    │
│ ↓ Show more                                                        │
└────────────────────────────────────────────────────────────────────┘
```

### Button States

| State | Icon | Color | Cursor |
|-------|------|-------|--------|
| Unsaved | `○` outline bookmark | `text-zinc-500` | pointer |
| Unsaved (hover) | `○` outline bookmark | `text-zinc-300` | pointer |
| Saved | `●` filled bookmark | `text-amber-400` | pointer |
| Saved (hover) | `●` filled bookmark | `text-amber-300` | pointer |

### Icon SVG
```html
<!-- Unsaved (outline) -->
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
</svg>

<!-- Saved (filled) -->
<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
</svg>
```

### Interaction
- Click toggles save/unsave
- No confirmation needed
- Subtle scale animation on click: `transform: scale(1.1)` for 150ms

---

## 2. Header with Saved Counter (Desktop Only)

### Current Header
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  AI Updates                                         [↻ Refresh]    │
│  2 of 25 articles • Last 3 days                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Updated Header with Saved Button (Desktop)
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  AI Updates                            [🔖 3 Saved]  [↻ Refresh]   │
│  2 of 25 articles • Last 3 days                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Updated Header (Mobile) - Hamburger Menu
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  [☰]                    AI Updates                    [↻ Refresh]  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Saved Button States (Desktop)

| State | Display | Style |
|-------|---------|-------|
| No saved articles | `🔖 Saved` | `text-zinc-500` (subtle) |
| Has saved articles | `🔖 3 Saved` | `text-amber-400` (highlighted) |
| Panel open | `🔖 3 Saved` | `bg-zinc-700` (active state) |

### Hamburger Menu (Mobile)

| State | Display | Style |
|-------|---------|-------|
| Panel closed | `☰` (three lines) | `text-zinc-400` |
| Panel closed (hover) | `☰` (three lines) | `text-zinc-200` |
| Panel open | Hidden (panel covers screen) | - |

### Button Style
```css
/* Desktop Saved Button */
padding: 0.5rem 0.75rem;
border-radius: 0.5rem;
font-size: 0.875rem;
display: flex;
align-items: center;
gap: 0.375rem;
transition: all 150ms;

/* Hover */
background-color: rgb(63 63 70); /* zinc-700 */

/* Active (panel open) */
background-color: rgb(63 63 70);
color: rgb(251 191 36); /* amber-400 */

/* Mobile Hamburger */
padding: 0.5rem;
font-size: 1.25rem;
color: rgb(161 161 170); /* zinc-400 */
```

---

## 3. Slide-Out Panel

### Panel Dimensions
- **Width:** 400px (desktop), 100% (mobile < 640px)
- **Height:** 100vh (full viewport height)
- **Position:** Fixed, LEFT edge of screen
- **Z-index:** 50 (above content, below modals)

### Panel Layout

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │  Saved Articles            [✕]   │ │  ← Header (sticky)
│ │  3 articles                      │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │  ┌────────────────────────────┐  │ │
│ │  │ PyTorch 2.2: Critical...  │  │ │  ← Saved Article Card
│ │  │ security • Jan 10    [🔖] │  │ │
│ │  │ pytorch/pytorch           │  │ │
│ │  └────────────────────────────┘  │ │
│ │                                  │ │
│ │  ┌────────────────────────────┐  │ │
│ │  │ Ollama 0.2: Multi-model..│  │ │
│ │  │ launch • Jan 9       [🔖] │  │ │
│ │  │ ollama/ollama             │  │ │
│ │  └────────────────────────────┘  │ │
│ │                                  │ │
│ │  ┌────────────────────────────┐  │ │
│ │  │ LoRA 2.0: Efficient...    │  │ │
│ │  │ research • Jan 9     [🔖] │  │ │
│ │  │ arxiv.org                 │  │ │
│ │  └────────────────────────────┘  │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
        ↑ Scrollable content area
```

### Panel Animation
- **Open:** Slide in from LEFT, 200ms ease-out (slides RIGHT to open)
- **Close:** Slide out to LEFT, 150ms ease-in (slides LEFT to close)
- **Backdrop:** Fade in dark overlay (`bg-black/50`) - desktop only

```css
/* Panel enter (slides RIGHT to open from left edge) */
transform: translateX(-100%) → translateX(0);
transition: transform 200ms ease-out;

/* Panel exit (slides LEFT to close) */
transform: translateX(0) → translateX(-100%);
transition: transform 150ms ease-in;

/* Backdrop (desktop only) */
opacity: 0 → 1;
transition: opacity 200ms;
```

### Panel Header (Sticky)

```
┌────────────────────────────────────────┐
│  🔖 Saved Articles              [✕]    │
│  3 articles                            │
└────────────────────────────────────────┘
```

**Styles:**
```css
position: sticky;
top: 0;
padding: 1.5rem;
background: rgb(24 24 27); /* zinc-900 */
border-bottom: 1px solid rgb(39 39 42); /* zinc-800 */
```

### Saved Article Card (Compact)

Simplified version of the main article card, optimized for the panel width.

```
┌────────────────────────────────────────┐
│ 🔴 security                       [🔖] │
│                                        │
│ PyTorch 2.2: Critical Security         │
│ Vulnerability in Model Loading         │
│                                        │
│ pytorch/pytorch • Jan 10               │
└────────────────────────────────────────┘
```

**Card Structure:**
1. **Row 1:** Category badge + emoji tag + unsave button (right)
2. **Row 2-3:** Title (2 lines max, truncated with ellipsis)
3. **Row 4:** Source/repo + date (muted)

**Styles:**
```css
/* Card */
padding: 1rem;
background: rgb(39 39 42); /* zinc-800 */
border-radius: 0.5rem;
margin-bottom: 0.75rem;
cursor: pointer;
transition: background 150ms;

/* Card hover */
background: rgb(63 63 70); /* zinc-700 */

/* Title */
font-size: 0.9375rem; /* 15px */
font-weight: 500;
color: rgb(244 244 245); /* zinc-100 */
line-height: 1.4;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;

/* Metadata */
font-size: 0.75rem;
color: rgb(113 113 122); /* zinc-500 */
margin-top: 0.5rem;
```

**Click Behavior:**
- Clicking the card opens the article URL in a new tab
- Clicking the bookmark icon unsaves (with stopPropagation)

---

## 4. Empty State

When user has no saved articles:

```
┌────────────────────────────────────────┐
│  🔖 Saved Articles              [✕]    │
│  0 articles                            │
├────────────────────────────────────────┤
│                                        │
│                                        │
│              ┌────────┐                │
│              │   🔖   │                │
│              └────────┘                │
│                                        │
│        No saved articles yet           │
│                                        │
│   Click the bookmark icon on any       │
│   article to save it for later         │
│                                        │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

**Styles:**
```css
/* Container */
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 4rem 2rem;
text-align: center;

/* Icon */
font-size: 3rem;
margin-bottom: 1rem;
opacity: 0.3;

/* Title */
font-size: 1rem;
color: rgb(161 161 170); /* zinc-400 */
margin-bottom: 0.5rem;

/* Subtitle */
font-size: 0.875rem;
color: rgb(113 113 122); /* zinc-500 */
max-width: 200px;
```

---

## 5. Backdrop Overlay (Desktop Only)

When panel is open on desktop, a semi-transparent backdrop covers the main content.

**Behavior:**
- Click backdrop to close panel
- Prevents scrolling on main content while panel is open
- NOT shown on mobile (panel covers full screen)

**Styles:**
```css
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.5);
z-index: 40; /* Below panel (50), above content */
```

---

## 6. Mobile Responsive Design

### Breakpoint: < 640px (sm)

**Header Changes:**
- Hamburger menu icon `[☰]` on LEFT side
- NO saved article count shown
- Clean, minimal header

```
Mobile header:
┌──────────────────────────────────────────────┐
│  [☰]            AI Updates            [↻]    │
└──────────────────────────────────────────────┘
```

**Panel Changes:**
- Width: 100% (full screen)
- Slides in from LEFT (slides RIGHT to open)
- No backdrop (panel covers everything)
- Larger touch targets for buttons

```
┌──────────────────────────────────────────────┐
│  🔖 Saved Articles                    [✕]    │
│  3 articles                                  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 🔴 security                       [🔖] │  │
│  │                                        │  │
│  │ PyTorch 2.2: Critical Security         │  │
│  │ Vulnerability in Model Loading         │  │
│  │                                        │  │
│  │ pytorch/pytorch • Jan 10               │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 7. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close panel |
| `s` | Toggle save on focused article (future) |

---

## 8. Accessibility

- Panel has `role="dialog"` and `aria-modal="true"`
- Close button has `aria-label="Close saved articles panel"`
- Save button has `aria-label="Save article"` / `aria-label="Remove from saved"`
- Hamburger menu has `aria-label="Open saved articles"`
- Focus trapped within panel when open
- Focus returns to trigger button on close

---

## 9. Color Palette Reference

| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Panel background | `#18181b` | `bg-zinc-900` |
| Card background | `#27272a` | `bg-zinc-800` |
| Card hover | `#3f3f46` | `bg-zinc-700` |
| Border | `#27272a` | `border-zinc-800` |
| Title text | `#f4f4f5` | `text-zinc-100` |
| Body text | `#d4d4d8` | `text-zinc-300` |
| Muted text | `#71717a` | `text-zinc-500` |
| Save icon (unsaved) | `#71717a` | `text-zinc-500` |
| Save icon (saved) | `#fbbf24` | `text-amber-400` |
| Backdrop | `rgba(0,0,0,0.5)` | `bg-black/50` |

---

## 10. Component Hierarchy

```
<SavedArticlesProvider>           ← Context provider (wraps app)
  <Header>
    <HamburgerMenu />             ← Mobile only, opens panel
    <SavedArticlesButton />       ← Desktop only, opens panel, shows count
  </Header>

  <Feed>
    <ArticleCard>
      <SaveButton />              ← Toggle save/unsave
    </ArticleCard>
  </Feed>

  <SavedArticlesPanel>            ← Slide-out panel (from LEFT)
    <PanelHeader />
    <SavedArticlesList>
      <SavedArticleCard />        ← Compact card
      <SavedArticleCard />
    </SavedArticlesList>
    <EmptyState />                ← When no saved articles
  </SavedArticlesPanel>

  <Backdrop />                    ← Click to close (desktop only)
</SavedArticlesProvider>
```

---

## 11. Interaction Summary

| Action | Result |
|--------|--------|
| Click save button (unsaved) | Article saved, icon fills, counter increments (desktop) |
| Click save button (saved) | Article unsaved, icon outlines, counter decrements (desktop) |
| Click "Saved" in header (desktop) | Panel slides open from LEFT |
| Click hamburger menu (mobile) | Panel slides open from LEFT |
| Click backdrop (desktop) | Panel closes |
| Click X button | Panel closes |
| Press Escape | Panel closes |
| Click saved article card | Opens article URL in new tab |
| Click unsave in panel | Article removed, card animates out |

---

## Approval

**Please confirm:**
- [ ] Panel on LEFT side (slides RIGHT to open)
- [ ] Panel width (400px) is appropriate
- [ ] Compact card design for saved articles
- [ ] Color scheme (amber for saved state)
- [ ] Mobile: hamburger menu on left, no saved count in header
- [ ] Mobile behavior (full-width panel)
- [ ] Ready to proceed with implementation

---

*Created: 2026-01-27*
*Updated: 2026-01-28 - Changed panel to LEFT side, added hamburger menu for mobile, removed saved count from mobile header*
