# ContentEngine Curriculum Insert — Complete Reference

> **Three deliverables in this package:**
> - `CONTENTENGINE_SYSTEM_PROMPT.md` — paste into Claude's system prompt when generating content
> - `CONTENTENGINE_TEMPLATE.json` — annotated JSON template, copy and fill in
> - `CONTENTENGINE_INSERT_GUIDE.md` — this file, the full technical reference

---

## Background

ContentEngine uses a single API endpoint to create or update an entire language curriculum:

```
POST /v1/admin/bulk/language
Content-Type: application/json
X-Admin-Key: <your-admin-key>
```

Fully idempotent — every field uses `ON CONFLICT DO UPDATE`. Safe to re-run after a fix. Every rule in this document was learned from a real insertion failure during the Node.js curriculum build.

---

## The Three-Layer Payload

```json
{
  "language": { ... },    ← language record — present in every file
  "sections": [ ... ],    ← ALL sections for this language — present in every file
  "topics":   [ ... ]     ← topics being added in this specific file
}
```

All three keys are required in every file, every time.

---

## Layer 1 — Language

```json
{
  "slug":        "node",
  "name":        "Node.js",
  "description": "A JavaScript runtime built on Chrome's V8 engine.",
  "iconUrl":     "/icons/node.svg",
  "sortOrder":   3,
  "meta": {
    "color":   "#68a063",
    "tagline": "Non-blocking. Event-driven. Built for scale."
  }
}
```

| Field | Notes |
|-------|-------|
| `slug` | **Must match the first dot-segment of every topic path.** `slug: "node"` → all paths start with `"node."` |
| `name` | Display name |
| `description` | One sentence |
| `iconUrl` | Path to icon |
| `sortOrder` | Position in language list |
| `meta.color` | Hex colour for UI theming |
| `meta.tagline` | Short phrase under language name |

**The slug rule is the most common failure.** The backend resolves language by:
```js
WHERE l.slug = topic.path.split('.')[0]
```
If `language.slug = "nodejs"` but paths are `"node.core.intro"`, every topic fails silently with `Cannot read properties of undefined (reading 'id')`.

---

## Layer 2 — Sections

### ⚠️ The Single Most Important Rule

**Every file for a language must include ALL sections for that language, every time.**

The backend has two code paths for sections:

**Path A — from `sections[]`:**
```sql
ON CONFLICT (language_id, slug) DO UPDATE SET sort_order = EXCLUDED.sort_order
```
Correctly sets and updates sortOrder on every run.

**Path B — auto-created when a topic references a section not in `sections[]`:**
```sql
INSERT ... ON CONFLICT DO NOTHING
```
Creates the section with `sortOrder: 99`. This value is **never corrected** on subsequent runs because Path A is never triggered for it.

Result: any section omitted from `sections[]` gets `sortOrder: 99` permanently, breaking navigation order. The only fix is manual SQL.

### Sections Are Per-Language

Each language defines its own section list based on its curriculum. There is no global list.

```json
// Node.js — 12 sections
"sections": [
  { "slug": "core",        "title": "Core Node.js",       "sortOrder": 1  },
  { "slug": "async",       "title": "Async Patterns",     "sortOrder": 2  },
  { "slug": "streams",     "title": "Streams & Buffers",  "sortOrder": 3  },
  { "slug": "http",        "title": "HTTP & Networking",  "sortOrder": 4  },
  { "slug": "filesystem",  "title": "File System & OS",   "sortOrder": 5  },
  { "slug": "performance", "title": "Performance",        "sortOrder": 6  },
  { "slug": "express",     "title": "Express & APIs",     "sortOrder": 7  },
  { "slug": "database",    "title": "Database & Caching", "sortOrder": 8  },
  { "slug": "tooling",     "title": "Ecosystem & Tooling","sortOrder": 9  },
  { "slug": "security",    "title": "Security",           "sortOrder": 10 },
  { "slug": "realtime",    "title": "Real-time",          "sortOrder": 11 },
  { "slug": "projects",    "title": "Projects",           "sortOrder": 12 }
]

// Java — 6 sections (completely different structure)
"sections": [
  { "slug": "core-language", "title": "Core Language",  "sortOrder": 1 },
  { "slug": "oop",           "title": "OOP & Design",   "sortOrder": 2 },
  { "slug": "collections",   "title": "Collections",    "sortOrder": 3 },
  { "slug": "concurrency",   "title": "Concurrency",    "sortOrder": 4 },
  { "slug": "jvm",           "title": "JVM Internals",  "sortOrder": 5 },
  { "slug": "projects",      "title": "Projects",       "sortOrder": 6 }
]

// Python — 8 sections
"sections": [
  { "slug": "core",            "title": "Core Language",          "sortOrder": 1 },
  { "slug": "data-structures", "title": "Data Structures",        "sortOrder": 2 },
  { "slug": "oop",             "title": "OOP",                    "sortOrder": 3 },
  { "slug": "functional",      "title": "Functional Programming", "sortOrder": 4 },
  { "slug": "internals",       "title": "Python Internals",       "sortOrder": 5 },
  { "slug": "concurrency",     "title": "Concurrency",            "sortOrder": 6 },
  { "slug": "stdlib",          "title": "Standard Library",       "sortOrder": 7 },
  { "slug": "projects",        "title": "Projects",               "sortOrder": 8 }
]
```

Section objects: `slug`, `title`, `sortOrder` only. Nothing else.

---

## Layer 3 — Topics

### ⚠️ Always Use bulk/language — Never bulk/topic

Every insert goes through `POST /v1/admin/bulk/language` regardless of how many topics you are adding. Never use `POST /v1/admin/bulk/topic` for curriculum content.

The `bulk/topic` endpoint does not accept a `sections[]` array. Any section a topic references that does not already exist gets auto-created by `ensureSection()` with `sortOrder: 99`. Since `bulk/topic` never triggers `sectionRepo.upsert()`, the sortOrder is never corrected. Navigation breaks permanently.

Rule: one topic, one hundred topics, a project topic added alone — always `bulk/language` with the complete sections array.

### All Topic Fields

```json
{
  "path":          "node.core.event-loop",
  "title":         "The Event Loop",
  "section":       "core",
  "difficulty":    "intermediate",
  "estimatedMins": 16,
  "tags":          ["nodejs", "event loop", "libuv", "concurrency"],
  "isDeepDive":    false,
  "isPublished":   true,
  "sortOrder":     2,
  "blocks":        [ ... ]
}
```

| Field | Values | Notes |
|-------|--------|-------|
| `path` | string | Dot-separated. First segment = `language.slug`. Lowercase, hyphens only. |
| `title` | string | Display title |
| `section` | string | Must exactly match a slug in `sections[]` |
| `difficulty` | `"beginner"` `"intermediate"` `"advanced"` | |
| `estimatedMins` | number | Section roots: 2. Topics: 10–20. Projects: 120–480. |
| `tags` | string[] | First tag = language slug. Include topic-specific keywords. |
| `isDeepDive` | boolean | **Always set explicitly.** `false` for main topics, `true` for deep dives. |
| `isPublished` | boolean | `true` for all live content |
| `sortOrder` | number | Position among siblings at same depth level |
| `blocks` | array | Content blocks in display order |

### Path Rules

- All lowercase: `event-loop` not `Event-Loop`
- Hyphens not underscores: `child-process` not `child_process`
- No spaces, no uppercase, no special characters except hyphens and dots
- First segment = `language.slug` exactly
- Second segment = section slug

### sortOrder Rules

`sortOrder` controls position among **siblings only** — topics at the same path depth under the same parent. It is not a global counter. Each parent's children form their own independent sequence starting from 1 (root starts at 0).

```
node.core                sortOrder: 0   ← section root always 0
node.core.intro          sortOrder: 1   ← first child of core
node.core.event-loop     sortOrder: 2   ← second child
node.core.modules        sortOrder: 3   ← third child
node.core.globals        sortOrder: 4   ← fourth child

node.core.intro.v8       sortOrder: 1   ← deep dive, only child → 1
node.core.event-loop.phases  sortOrder: 1   ← deep dive → 1
node.core.modules.esm    sortOrder: 1   ← deep dive → 1
```

Rules: root=0, first-level children start at 1 and are sequential, no gaps, deep dive as sole child=1.

### Nesting Model

```
depth 1  node.core                                  isDeepDive: false   section root
depth 2  node.core.event-loop                       isDeepDive: false   main topic
depth 3  node.core.event-loop.phases                isDeepDive: true    🔬 deep
depth 4  node.core.event-loop.phases.microtasks     isDeepDive: true    🔬🔬 deeper
```

Only go deeper when there is genuinely more to explain that would overwhelm the parent. Ask: "Can this fit as a card in concept_cards?" If yes → card. If it needs its own diagrams, code, and quizzes → deep dive.

### Section Root Topics

Every section with content needs a depth-1 root topic. This is the section landing page.

```json
{
  "path": "node.core",       "title": "Core Node.js",
  "section": "core",         "sortOrder": 0,
  "estimatedMins": 2,        "isDeepDive": false,
  "blocks": [{ "type": "text", "data": { "content": "Section overview." } }]
}
```

Without the section root, child topics have no parent in the navigation tree.

### Projects Root Topic

The projects section always needs its own depth-1 root before any project topics:

```json
{
  "path": "node.projects",   "title": "Projects",
  "section": "projects",     "sortOrder": 0,
  "estimatedMins": 2,        "isDeepDive": false,
  "blocks": [{ "type": "text", "data": { "content": "Projects track overview." } }]
}
```

---

## Block Types

Blocks are the content units inside each topic, rendered in array order.

---

### `text`
Prose. Supports markdown bold and inline code.

```json
{ "type": "text", "data": { "content": "Your prose here. Supports **bold** and `inline code`." } }
```

Use for: topic introductions, step separators in projects, explanatory paragraphs.

Project step separator pattern:
```json
{ "type": "text", "data": { "content": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSTEP 3 — Authentication\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" } }
```

---

### `concept_cards`
Grid of icon+title+desc cards. The primary teaching unit.

```json
{
  "type": "concept_cards",
  "data": {
    "items": [
      { "icon": "⚙️", "title": "Concept Title", "desc": "Explanation. Use \\n for line breaks.\nSupports multiple lines." },
      { "icon": "🔄", "title": "Second Concept", "desc": "Explanation." }
    ]
  }
}
```

Guidelines: 4–6 cards per block. Each card = one concept. `\n` for line breaks in `desc`.

---

### `warning`
Orange callout. For gotchas, anti-patterns, security issues, common mistakes.

```json
{ "type": "warning", "data": { "content": "**Trap name:** Explanation of what goes wrong, why, and the exact fix." } }
```

Bold the key phrase at the start. One warning per major trap.

---

### `note`
Blue callout. For helpful tips, API references, real-world context, non-blocking info.

```json
{ "type": "note", "data": { "content": "**Label:** Supporting information the learner will find useful." } }
```

---

### `diagram`
Inline Mermaid diagram. Only when a visual genuinely adds understanding.

```json
{
  "type": "diagram",
  "data": {
    "diagramKey":  "globally_unique_key",
    "title":       "Diagram Title",
    "diagramType": "mermaid",
    "mermaid":     "graph LR\n  A[Node] --> B[Node]\n  style A fill:#1e3a5f,color:#93c5fd"
  }
}
```

`diagramKey` must be globally unique across all content. Dark theme style colours:

| Name | Value |
|------|-------|
| Navy | `fill:#1e3a5f,color:#93c5fd` |
| Green | `fill:#14532d,color:#86efac` |
| Brown | `fill:#7c2d12,color:#fed7aa` |
| Purple | `fill:#581c87,color:#e9d5ff` |
| Teal | `fill:#164e63,color:#a5f3fc` |

---

### `code`
Syntax-highlighted code block. For reading, not execution.

```json
{
  "type": "code",
  "data": {
    "language": "javascript",
    "filename": "demo.js",
    "runnable": false,
    "snippet":  "// Comment every non-obvious line\nconst example = 'real-looking code'"
  }
}
```

Supported languages: `javascript`, `typescript`, `java`, `python`, `bash`, `sql`, `json`

---

### `quiz`
MCQ. Always 4 options. Exactly one correct. `questionId` must be globally unique.

```json
{
  "type": "quiz",
  "data": {
    "questionId":   "q_node_core_evloop_001",
    "questionText": "Question text?",
    "questionType": "mcq",
    "options": [
      { "id": "a", "text": "Plausible wrong — common misconception",  "correct": false },
      { "id": "b", "text": "Correct answer — specific and clear",     "correct": true  },
      { "id": "c", "text": "Plausible wrong — partial understanding", "correct": false },
      { "id": "d", "text": "Plausible wrong — another misconception", "correct": false }
    ],
    "explanation": "Why b is correct. Why each wrong answer is wrong. Teaches something even to those who got it right."
  }
}
```

`questionId` convention: `q_{langSlug}_{sectionSlug}_{topicSlug}_{NNN}`

---

## Content Standards Per Topic Type

### Standard Curriculum Topic (depth 2+, isDeepDive: false)

| Block | Required | Notes |
|-------|----------|-------|
| `text` | ✅ | 2–4 sentence intro. What it covers. Why it matters. |
| `concept_cards` | ✅ | 4–6 cards. |
| `diagram` | If visual helps | Not every topic. |
| `code` | For code topics | Rich comments. |
| `warning` | When a real trap exists | |
| `note` | Optional | |
| `quiz` × 2 | ✅ | First: core concept. Second: edge case or real scenario. |

### Deep Dive (isDeepDive: true)
Same as standard. Intro explains what this reveals the parent didn't cover. Questions require deeper understanding.

### Section Root (depth 1, sortOrder: 0)
One `text` block with 2–3 sentences describing the section.

### Project Topic

**`code` and `quiz` blocks are forbidden in project topics.** No exceptions.

Projects teach architecture, thinking, and problem decomposition — not syntax. The learner implements everything themselves. Code blocks hand them the answer. Quiz blocks break the step-by-step build flow.

**Only these blocks are allowed in project topics:** `text`, `concept_cards`, `note`, `warning`

Structure:

| Block | Notes |
|-------|-------|
| `text` | What the project is and teaches |
| `concept_cards` | Overview: What You'll Build, Concepts Used, Rules, Definition of Done |
| `note` | Setup info |
| `text` (step separator) + `concept_cards` per step | Cards: What to Build, How It Works, Checkpoint |
| `note` | What you built and why it matters |
| `warning` | Known limitations |
| `text` | Next project preview |

---

## Splitting Into Multiple Files

| File | Contents |
|------|----------|
| File 1 | Language + ALL sections + first 2–3 sections of topics |
| File 2+ | Language + ALL sections + next batch of topics |
| Projects file | Language + ALL sections + `{lang}.projects` root + project topics |

Keep each file under ~25 topics. POST in order: 1 first, projects last.

---

## How the Backend Processes the Payload

```
1. Upsert language row (slug is key)
2. Upsert sections[] → ON CONFLICT DO UPDATE sort_order  ← corrects sortOrder
3. For each topic.section not in sections[]:
   ensureSection() → INSERT ... ON CONFLICT DO NOTHING   ← sortOrder: 99 forever
4. Sort topics by path depth (parents before children)
5. For each topic:
   INSERT using JOIN:
     WHERE l.slug = path.split('.')[0]       ← must match language.slug
     AND s.slug = topic.section              ← must match a section slug
   Returns 0 rows if either join fails → error
6. Flush Redis cache
```

---

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read properties of undefined (reading 'id')` | `path.split('.')[0]` ≠ `language.slug` | Set `language.slug` equal to first path segment |
| Sections show `sortOrder: 99` | Section auto-created by `ensureSection()`, not from `sections[]` | Include ALL sections in every file |
| Topic in wrong section | `topic.section` spelling doesn't match `sections[].slug` | Check exact spelling both places |
| Duplicate sections in nav | Two different slugs for same concept (`project` vs `projects`) | SQL: `DELETE FROM sections WHERE slug = 'wrong-slug'` |
| Topics out of order | Non-sequential sortOrders | Make them sequential: 0, 1, 2, 3... no gaps |
| Deep dive shows as normal topic | `isDeepDive: false` | Set `isDeepDive: true` |
| Section missing from nav | No depth-1 root topic for that section | Add `{lang}.{section}` root with `sortOrder: 0` |
| Projects not in nav | No `{lang}.projects` root topic | Add projects root before project topics |
| Section sortOrder: 99 after re-insert | Used `bulk/topic` instead of `bulk/language` | Always use `bulk/language` — it's the only endpoint that runs `sectionRepo.upsert()` |
| `code` or `quiz` block in project | Generated incorrectly | Projects allow only: `text`, `concept_cards`, `note`, `warning` |
| Deep dive on wrong topic | `isDeepDive` inferred from depth | Set `isDeepDive` explicitly — depth and isDeepDive are unrelated |

---

## Pre-Flight Checklist

```
Structure
  ☐ language.slug matches first segment of every topic path
  ☐ sections[] contains ALL sections for this language
  ☐ Every topic.section matches a slug in sections[]

Topics
  ☐ Every section with topics has a depth-1 root (sortOrder: 0, estimatedMins: 2)
  ☐ Projects section has {lang}.projects depth-1 root
  ☐ sortOrders are sequential per sibling group — no gaps, starts at 1
  ☐ isDeepDive explicitly set on every topic (not inferred from path depth)
  ☐ Project topics contain ONLY text/concept_cards/note/warning blocks — no code, no quiz
  ☐ All paths: lowercase, hyphens only, no underscores or spaces

Blocks
  ☐ Every non-root topic: text intro + concept_cards + 2 quizzes minimum
  ☐ All questionId values unique: q_{lang}_{section}_{topic}_{NNN}
  ☐ All diagramKey values unique across entire curriculum
  ☐ No _comment fields left from template

Technical
  ☐ Used bulk/language endpoint (not bulk/topic)
  ☐ Valid JSON: python3 -c "import json; json.load(open('file.json'))" 
```

---

## Language Quick Reference

### Node.js
```
slug: node  |  icon: /icons/node.svg  |  sortOrder: 3  |  color: #68a063
sections: core(1) async(2) streams(3) http(4) filesystem(5) performance(6)
          express(7) database(8) tooling(9) security(10) realtime(11) projects(12)
```

### Java
```
slug: java  |  icon: /icons/java.svg  |  sortOrder: 1  |  color: #f59e0b
sections: (define from actual Java curriculum)
```

### Python
```
slug: python  |  icon: /icons/python.svg  |  sortOrder: 2  |  color: #3b82f6
sections: (define from actual Python curriculum)
```
