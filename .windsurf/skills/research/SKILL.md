---
name: Research
description: Web research, information gathering, and synthesis
triggers:
  - research
  - investigate
  - find information
  - look up
  - what is
  - search for
tools:
  - terminator-browser (browse_url, browse_extract, browse_search)
  - terminator-memory (memory_store, memory_search, memory_context)
  - terminator-data (data_json_store, data_query)
---

# Research Skill

## Purpose
Conduct thorough web research on any topic, synthesize findings from multiple sources, and deliver a clear, structured report. All findings are stored in persistent memory for future reference.

## When to Use
- User asks to research, investigate, or find information about a topic
- User asks "what is X?" or "find out about Y"
- User needs current information from the web
- User wants to compare options, products, or technologies

## Workflow

### Step 1: Understand the Research Question
- Clarify what the user wants to know
- Identify the scope: quick answer vs. deep dive
- Check memory for any prior research on this topic using `memory_search`

### Step 2: Search
- Use `browse_search` to find relevant sources (DuckDuckGo)
- Scan 5–10 results for relevance
- Identify the most authoritative and diverse sources

### Step 3: Deep Read
- Use `browse_url` on the top 3–5 sources
- Extract key information, data points, and quotes
- Use `browse_extract` for structured data (tables, lists, specific elements)

### Step 4: Synthesize
- Cross-reference findings across sources
- Identify consensus vs. conflicting information
- Note what is well-established vs. uncertain
- Organize by theme or importance

### Step 5: Store Findings
- Use `memory_store` to save key findings with tags like `finding`, `research`, and topic-specific tags
- Store source URLs for attribution
- Store the date of research for freshness tracking

### Step 6: Report
Present findings in a structured format:

```markdown
## Research: [Topic]

### Summary
[2-3 sentence executive summary]

### Key Findings
1. [Finding with source attribution]
2. [Finding with source attribution]
3. ...

### Details
[Organized by theme or importance]

### Sources
- [Source 1 URL] — [what was found here]
- [Source 2 URL] — [what was found here]

### Gaps & Limitations
[What couldn't be determined, what needs more research]
```

## Example Output

**User**: "Research the best practices for SQLite performance optimization"

**Report**:
> ## Research: SQLite Performance Optimization
>
> ### Summary
> SQLite performance can be dramatically improved through WAL mode, proper indexing, and batch transactions. Most applications see 10-50x improvements from these three changes alone.
>
> ### Key Findings
> 1. **WAL mode** (`PRAGMA journal_mode=WAL`) improves concurrent read performance significantly (sqlite.org)
> 2. **Batch inserts** in transactions: wrapping 1000 INSERTs in a single transaction is ~50x faster than individual commits
> 3. **Proper indexing**: CREATE INDEX on frequently queried columns; use EXPLAIN QUERY PLAN to verify
> ...

## Tips
- Always check memory first — the user may have already researched this topic
- For time-sensitive topics, note when the research was conducted
- If sources conflict, present both sides rather than choosing one
- Store findings granularly so they can be retrieved independently later
