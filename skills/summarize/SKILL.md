---
name: Summarize
description: Condensing documents, pages, conversations, and data — web pages, documents, data, conversations
triggers:
  - summarize
  - summary
  - condense
  - key points
  - tl;dr
  - brief
  - overview
tools:
  - terminator-browser (browse_url, browse_extract)
  - terminator-files (files_tree, files_search)
  - terminator-data (data_query, data_csv_read, data_analyze)
  - terminator-memory (memory_store, memory_search)
---

# Summarize Skill

## Purpose
Distill information from any source — web pages, documents, datasets, or conversations — into clear, concise summaries at the appropriate level of detail.

## When to Use
- User asks to summarize a web page, article, or document
- User wants key takeaways from a long piece of content
- User asks for a TL;DR or executive summary
- User wants to condense meeting notes or conversations
- User needs a data summary or overview of a dataset

## Workflow

### Step 1: Identify Source
Determine the source type and load it:

| Source | Tool |
|--------|------|
| Web page / URL | `browse_url` |
| Local file | Read file directly |
| CSV / Data | `data_csv_read` or `data_query` |
| Multiple sources | Batch `browse_url` calls |
| Previous research | `memory_search` |

### Step 2: Extract Key Content
- For web pages: `browse_url` already strips noise (ads, nav, etc.)
- For data: use `data_analyze` for statistical overview
- For code: focus on structure, purpose, and interfaces
- For documents: identify headings, conclusions, and key arguments

### Step 3: Determine Summary Level
Match detail level to the user's need:

| Level | Length | Use When |
|-------|--------|----------|
| **One-liner** | 1 sentence | Quick context |
| **TL;DR** | 2–3 sentences | Casual overview |
| **Executive Summary** | 1 paragraph | Business context |
| **Detailed Summary** | 5–10 bullet points | Thorough understanding |
| **Comprehensive** | Full structured report | Deep dive |

### Step 4: Summarize
Apply these principles:
1. **Lead with the conclusion** — what's the main point?
2. **Include supporting evidence** — key facts, numbers, quotes
3. **Note what's missing** — gaps, caveats, limitations
4. **Preserve attribution** — who said what, where it came from

### Step 5: Format

**TL;DR format:**
> [One-sentence summary]. Key points: [2-3 bullets]. Notable: [anything surprising or important].

**Executive Summary format:**
```markdown
## Summary: [Title]

**Main Point**: [Core takeaway in one sentence]

### Key Points
- [Point 1 with supporting detail]
- [Point 2 with supporting detail]
- [Point 3 with supporting detail]

### Notable
- [Surprising finding or important caveat]

*Source: [URL or document name]*
```

### Step 6: Store
- Save summaries in memory with `memory_store`
- Tag with `summary`, source type, and topic
- Include the source URL/path for reference

## Tips
- Always ask "what level of detail?" if unclear — a TL;DR is very different from a comprehensive summary
- For web pages, prefer `browse_url` over `browse_extract` — it gives cleaner full content
- When summarizing data, always include the dataset size, time range, and key metrics
- Preserve numbers and specific claims — vague summaries are useless
- If the source is very long, summarize sections first, then synthesize into an overall summary
- Store summaries in memory — they're frequently re-requested
