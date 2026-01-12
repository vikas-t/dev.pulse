# Claude Agent Instructions - AI News Bulletin

## 🚨🚨🚨 CRITICAL: TASK TRACKING 🚨🚨🚨

**⚠️ MANDATORY REQUIREMENT - READ THIS FIRST ⚠️**

**THIS PROJECT USES `bd` (BEADS) FOR ***ALL*** TASK TRACKING.**

**❌ NEVER USE TodoWrite - IT IS FORBIDDEN IN THIS PROJECT ❌**

**✅ EVERY SINGLE TASK MUST BE TRACKED WITH `bd` ✅**

**"ALL TASKS" MEANS:**
- ✅ Code implementation tasks
- ✅ Bug fixes
- ✅ Documentation updates
- ✅ Research and investigation
- ✅ Reading files and gathering information
- ✅ ANY user request, no matter how small

---

## 🚀 START EVERY SESSION WITH THIS

**FIRST THING when you receive ANY user message:**

1. Run `bd ready --json` to check for existing unblocked work
2. Run `bd list --status in_progress --json` to see mid-flight tasks
3. If the user is asking you to do something new, **STOP** and follow the workflow below

---

## 🛑 STOP: Beads Workflow is MANDATORY

**EVERY TIME the user asks you to do ANYTHING, this is the ONLY valid workflow:**

### Step 1: CREATE THE BEAD FIRST (before reading ANY files or launching ANY agents)
```bash
bd create --title="<exactly what user asked>" --type=task --priority=2 --description="<brief context>"
```
YOU WILL GET AN ID like `model-brief-abc123`. **SAVE THIS ID.**

### Step 2: MARK IT IN PROGRESS (before doing the actual work)
```bash
bd update model-brief-abc123 --status=in_progress
```

### Step 3: NOW YOU CAN WORK
- Read files
- Launch agents
- Write code
- Research
- Whatever the task requires

### Step 4: UPDATE AS YOU GO (not just at the end!)
```bash
# Found a problem while working?
bd create "Found issue with X" -t bug -p 1
bd dep add model-brief-NEW_ID model-brief-abc123 --type discovered-from

# Scope changed?
bd update model-brief-abc123 -d "Updated: now also includes Y"
```

### Step 5: CLOSE WHEN DONE
```bash
bd close model-brief-abc123 --reason "Completed: <what you did>"
```

---

## Beads Workflow Decision Tree

```
User sends message
         ↓
    [STOP HERE]
         ↓
Run: bd ready (check existing work)
         ↓
Run: bd create "User's request"  ← YOU ARE HERE (not reading files yet!)
         ↓
Get issue ID: model-brief-abc123
         ↓
Run: bd update model-brief-abc123 --status=in_progress
         ↓
    NOW you can:
    - Read files
    - Launch agents
    - Write code
         ↓
    (while working)
    Update bd as you discover things
         ↓
Run: bd close model-brief-abc123
         ↓
    DONE
```

---

## ⚠️ Common Mistakes (DON'T DO THESE)

### ❌ WRONG: Reading files first
```
User: "Fix the scoring bug"
Claude: *launches Explore agent immediately*
Claude: *reads scorer.ts*
Claude: "Oh right, let me create a bead now"  ← TOO LATE
```

### ✅ CORRECT: Bead first, THEN work
```
User: "Fix the scoring bug"
Claude: *stops*
Claude: bd create --title="Fix scoring bug" --type=task --priority=1
Claude: bd update model-brief-xyz --status=in_progress
Claude: *NOW launches Explore agent*
Claude: *NOW reads scorer.ts*
```

---

## CRITICAL BLOCKING RULES

**These actions are FORBIDDEN before `bd create`:**

❌ NO reading files before `bd create`
❌ NO launching agents before `bd create`
❌ NO writing code before `bd create`
❌ NO editing files before `bd create`
❌ NO "I'll create the bead later"

✅ ALWAYS `bd create` FIRST, then work

---

See `AGENTS.md` for complete workflow instructions.

---

## Project Overview

**Project Name:** AI News Bulletin
**Purpose:** AI-powered news aggregator specifically for developers working with AI/ML
**Target Users:** ML engineers, full-stack developers, AI practitioners

**V1 Goal:** Get a working version that fetches the right data and displays it clearly. Simple and functional.

---

## Essential Reading

**BEFORE writing any code, you MUST read these documents:**

1. **docs/Research.md** - Competitive landscape, user needs, market gaps
2. **docs/PLAN.md** - Complete implementation plan, tech stack, database schema, phases
3. **docs/DESIGNS.md** - UI/UX specifications, components, layouts, design system

---

## V1 Focus: Make It Work

**Priorities for V1:**
1. **Fetch data** from sources (HN, Reddit, arXiv, GitHub, blogs)
2. **Store data** correctly in database
3. **Display data** in a clean, readable feed
4. **Basic filtering** by category, source, tech stack
5. **AI summaries** that are accurate and useful

**NOT priorities for V1:**
- Perfect performance optimization
- Advanced security hardening
- Comprehensive testing
- Complex caching strategies
- SEO optimization

---

## DO's ✅

### Planning & Architecture
- ✅ **DO** read all planning documents before implementing
- ✅ **DO** follow the tech stack defined in PLAN.md
- ✅ **DO** follow the design system in DESIGNS.md
- ✅ **DO** ask questions when unclear
- ✅ **DO** keep it simple - avoid over-engineering

### Code Quality (Basics)
- ✅ **DO** use TypeScript with strict mode
- ✅ **DO** handle errors (try/catch, error states)
- ✅ **DO** use clear, descriptive variable names
- ✅ **DO** validate API responses before using them

### Security (Essentials Only)
- ✅ **DO** use environment variables for API keys
- ✅ **DO** add `.env` to `.gitignore`
- ✅ **DO** validate user inputs

### User Experience (Core)
- ✅ **DO** show loading states
- ✅ **DO** show clear error messages
- ✅ **DO** make it responsive (mobile + desktop)
- ✅ **DO** provide visual feedback for interactions

### Data & APIs
- ✅ **DO** handle API errors gracefully
- ✅ **DO** validate data from external sources
- ✅ **DO** deduplicate articles from multiple sources
- ✅ **DO** store timestamps consistently

---

## DON'Ts ❌

### Planning & Architecture
- ❌ **DON'T** implement features not in PLAN.md without discussion
- ❌ **DON'T** change the tech stack without approval
- ❌ **DON'T** deviate from DESIGNS.md without reason
- ❌ **DON'T** over-engineer - keep V1 simple

### Code Quality
- ❌ **DON'T** use `any` type in TypeScript
- ❌ **DON'T** ignore TypeScript errors
- ❌ **DON'T** leave console.logs in committed code
- ❌ **DON'T** skip error handling

### Security (Critical)
- ❌ **DON'T** commit API keys or secrets
- ❌ **DON'T** trust external data without validation

### User Experience
- ❌ **DON'T** leave users staring at blank screens (show loading)
- ❌ **DON'T** use generic error messages
- ❌ **DON'T** break responsive design

### Data & APIs
- ❌ **DON'T** assume external APIs are always available
- ❌ **DON'T** fetch data on every component render
- ❌ **DON'T** trust data formats from external sources

---

## V1 Principles

**1. Make It Work First**
- Get data flowing from sources to UI
- Prove the concept works
- Iterate based on real usage

**2. Keep It Simple**
- Avoid premature optimization
- Use straightforward solutions
- YAGNI (You Ain't Gonna Need It)

**3. Focus on Data Quality**
- Accurate fetching from sources
- Proper deduplication
- Correct categorization
- Useful AI summaries

**4. Make It Usable**
- Clean, readable interface
- Fast enough (don't obsess over milliseconds)
- Works on mobile and desktop
- Clear when something goes wrong

**5. Ship It**
- Done is better than perfect
- Get feedback early
- Iterate based on real use

---

## When In Doubt

**Ask yourself:**
- Does this help get V1 working?
- Is this the simplest solution?
- Can this wait until after V1?

**If unsure:**
- Architecture decisions → Ask the user
- Tech stack changes → Ask the user
- Design deviations → Ask the user

**Better to ask than to waste time on the wrong thing.**

---

## Summary

**V1 Mission:** Fetch AI news from multiple sources, summarize with AI, display in a clean feed.

- ✅ Follow the beads workflow (AGENTS.md)
- ✅ Read the planning docs
- ✅ Keep it simple and working
- ✅ Focus on data quality and usability
- ❌ Don't over-engineer
- 🤔 When in doubt, ask

**Get it working. Then make it better.**

---

*Last Updated: 2026-01-03*
