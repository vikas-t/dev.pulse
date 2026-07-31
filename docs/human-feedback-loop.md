# Human Feedback Loop — Refining Article Selection

## Problem
The AI scorer and validator make decisions based on general prompts with no project-specific context. Over time, manual review of articles reveals patterns — certain domains are always good, certain types of claims are always noise — that the AI doesn't know about.

## Goal
Use manually labeled articles (good/bad + reason) to refine how the AI scores and validates future articles.

---

## Option A — Few-Shot Examples in Prompt (Recommended for V1)

**How it works:**
Inject your labeled articles directly into the scorer/validator prompts as examples before asking it to score a new article.

```
Good example: "PyTorch 2.3 release notes" (github.com) → MAJOR
Reason: Official release, specific version, real changelog

Bad example: "New HTTP 406 standard" (406.fail) → rejected
Reason: Unknown domain, no RFC, unverifiable claim
```

**Pros:**
- No model training needed
- Immediate effect
- Free
- Works with as few as 10-20 labeled articles

**Implementation:**
1. Label articles in DB (humanReviewed + humanLabel + humanReason)
2. At pipeline start, fetch top 10-20 labeled examples from DB
3. Inject into scorer/validator system prompt as few-shot examples

---

## Option B — Score Calibration

**How it works:**
After labeling ~50+ articles, analyze patterns:
- Which domains consistently produce good articles?
- Which sources are consistently noise?
- What importance score thresholds actually match your quality bar?

Use findings to:
- Tune score thresholds in `lib/ai/scorer.ts`
- Expand/refine the trusted domains list in `lib/ai/validator.ts`
- Adjust engagement minimums in `lib/pipeline/orchestrator.ts`

**Pros:**
- Data-driven tuning
- No prompt changes needed — just config/threshold updates

**When to do:** After 50+ labeled articles

---

## Option C — Fine-Tuning (Future)

**How it works:**
With 500+ labeled articles, fine-tune a small model (GPT-4o-mini supports fine-tuning) specifically for this scoring task.

**Pros:**
- Most accurate long-term
- Cheaper per-token once fine-tuned

**Cons:**
- Expensive to set up
- Requires significant labeled data
- Needs periodic retraining

**When to do:** Post-V1, when you have enough data and the prompt-based approach hits a ceiling.

---

## What to Build

### Schema changes needed
```prisma
humanReviewed  Boolean  @default(false)  // already exists
humanLabel     String?  // 'good' | 'bad'
humanReason    String?  // why it's good/bad
```

### Labeling workflow
For V1 — use Prisma Studio (`npx prisma studio`) to label articles directly in the DB. No need to build a UI yet.

### Pipeline integration
At the start of `runPipeline()`, fetch labeled examples and inject into scorer/validator prompts.

---

## Recommendation

Start with **Option A**:
1. Label 10-20 articles in Prisma Studio
2. Inject them as few-shot examples into scorer prompt
3. Measure improvement over 1-2 weeks
4. Move to Option B once you have 50+ labels
