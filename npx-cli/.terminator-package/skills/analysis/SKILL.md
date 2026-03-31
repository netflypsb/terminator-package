---
name: Analysis
description: Data analysis, pattern finding, and report generation
triggers:
  - analyze
  - analysis
  - find patterns
  - statistics
  - data
  - compare
  - report on
tools:
  - terminator-data (data_query, data_csv_read, data_csv_write, data_json_store, data_analyze)
  - terminator-files (files_template_render, files_tree)
  - terminator-memory (memory_store, memory_search)
---

# Analysis Skill

## Purpose
Process, analyze, and derive insights from structured and unstructured data. Generate clear reports with statistical summaries and actionable findings.

## When to Use
- User asks to analyze data from a CSV, database, or other source
- User wants to find patterns, trends, or anomalies
- User needs statistical summaries (mean, median, distribution)
- User wants to compare datasets or track changes over time
- User asks for a data-driven report

## Workflow

### Step 1: Identify Data Source
- Where is the data? (CSV file, SQL database, JSON, web page)
- What format is it in?
- How large is the dataset?
- Use `data_csv_read` or `data_query` to load and preview

### Step 2: Explore & Clean
- Preview first rows to understand the schema
- Identify column types (numeric, categorical, date)
- Check for missing values and outliers
- Clean data if needed (SQL transforms or CSV rewrite)

### Step 3: Analyze
Use the appropriate approach:

**Statistical Summary:**
- Use `data_analyze` for count, min, max, mean, median, std dev
- Run SQL aggregations for grouped statistics

**Pattern Finding:**
- Use SQL GROUP BY for categorical distributions
- Sort by key metrics to find top/bottom items
- Compare time periods for trends

**Comparison:**
- Side-by-side metrics across categories
- Percentage changes and ratios
- Ranking and scoring

### Step 4: Visualize (Text-Based)
Present data visually using text:
```
Revenue by Quarter:
Q1: ████████████████ $1.2M
Q2: ████████████████████ $1.5M
Q3: ██████████████ $1.1M
Q4: ██████████████████████████ $2.0M
```

### Step 5: Report
```markdown
## Data Analysis: [Topic]

### Dataset
- Source: [file/query]
- Records: [count]
- Time Period: [range]

### Key Metrics
| Metric | Value |
|--------|-------|
| Total  | X     |
| Mean   | Y     |
| Median | Z     |

### Findings
1. [Key insight with supporting data]
2. [Key insight with supporting data]

### Recommendations
- [Action based on data]
```

### Step 6: Store & Persist
- Save analysis results using `data_json_store`
- Store key findings in memory with `memory_store`
- Export processed data with `data_csv_write` if needed

## Tips
- Always preview data before analyzing — understand the schema first
- Use SQL for complex aggregations; it's faster than manual processing
- Present numbers with context (percentages, comparisons, benchmarks)
- Store intermediate results so analysis can be resumed later
- For large datasets, work with samples first, then run full analysis
