# Claude Agent Instructions - AI News Bulletin

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

## DO's

### Planning & Architecture
- **DO** read all planning documents before implementing
- **DO** follow the tech stack defined in PLAN.md
- **DO** follow the design system in DESIGNS.md
- **DO** ask questions when unclear
- **DO** keep it simple - avoid over-engineering

### Code Quality (Basics)
- **DO** use TypeScript with strict mode
- **DO** handle errors (try/catch, error states)
- **DO** use clear, descriptive variable names
- **DO** validate API responses before using them

### Security (Essentials Only)
- **DO** use environment variables for API keys
- **DO** add `.env` to `.gitignore`
- **DO** validate user inputs

### User Experience (Core)
- **DO** show loading states
- **DO** show clear error messages
- **DO** make it responsive (mobile + desktop)
- **DO** provide visual feedback for interactions

### Data & APIs
- **DO** handle API errors gracefully
- **DO** validate data from external sources
- **DO** deduplicate articles from multiple sources
- **DO** store timestamps consistently

---

## DON'Ts

### Planning & Architecture
- **DON'T** implement features not in PLAN.md without discussion
- **DON'T** change the tech stack without approval
- **DON'T** deviate from DESIGNS.md without reason
- **DON'T** over-engineer - keep V1 simple

### Code Quality
- **DON'T** use `any` type in TypeScript
- **DON'T** ignore TypeScript errors
- **DON'T** leave console.logs in committed code
- **DON'T** skip error handling

### Security (Critical)
- **DON'T** commit API keys or secrets
- **DON'T** trust external data without validation

### User Experience
- **DON'T** leave users staring at blank screens (show loading)
- **DON'T** use generic error messages
- **DON'T** break responsive design

### Data & APIs
- **DON'T** assume external APIs are always available
- **DON'T** fetch data on every component render
- **DON'T** trust data formats from external sources

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

- Read the planning docs
- Keep it simple and working
- Focus on data quality and usability
- Don't over-engineer
- When in doubt, ask

**Get it working. Then make it better.**

---

*Last Updated: 2026-01-26*
