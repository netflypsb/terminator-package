---
name: Writing
description: Document writing, editing, and content creation
triggers:
  - write
  - draft
  - edit
  - create content
  - article
  - report
  - document
tools:
  - terminator-files (files_template_render, files_workspace_scaffold)
  - terminator-memory (memory_store, memory_search, memory_context)
---

# Writing Skill

## Purpose
Create, draft, edit, and refine written content including documents, reports, articles, emails, README files, and any other text-based output.

## When to Use
- User asks to write, draft, or create a document
- User asks to edit, revise, or improve existing content
- User needs a report, article, README, proposal, or any structured text
- User wants content formatted in a specific style or template

## Workflow

### Step 1: Understand Requirements
- What type of document? (report, article, README, email, etc.)
- Who is the audience? (technical, business, general)
- What tone? (formal, casual, technical, persuasive)
- What length? (brief, standard, comprehensive)
- Any specific format or template?

### Step 2: Gather Context
- Use `memory_search` and `memory_context` to find relevant background
- Check if similar documents were written before
- Identify key information that should be included

### Step 3: Outline
Create a structured outline before writing:
```
1. Introduction / Hook
2. Main Section 1
   - Key point A
   - Key point B
3. Main Section 2
   ...
4. Conclusion / Call to Action
```

### Step 4: Draft
- Write the first draft following the outline
- Focus on content completeness over polish
- Use appropriate markdown formatting
- Include all necessary sections

### Step 5: Revise
- Review for clarity, conciseness, and flow
- Check for consistency in tone and style
- Verify all claims and references
- Ensure proper formatting

### Step 6: Deliver
- Use `files_template_render` if using a template
- Save to file if requested
- Store key content in memory for future reference using `memory_store`

## Document Templates

### Report
```markdown
# [Title]

## Executive Summary
[Brief overview of findings and recommendations]

## Background
[Context and why this report exists]

## Findings
### [Finding 1]
### [Finding 2]

## Recommendations
1. [Action item]
2. [Action item]

## Appendix
[Supporting data, references]
```

### README
```markdown
# Project Name

Brief description of what this project does.

## Features
- Feature 1
- Feature 2

## Installation
[Step-by-step instructions]

## Usage
[Examples and code snippets]

## Configuration
[Environment variables, options]

## Contributing
[How to contribute]

## License
[License information]
```

## Tips
- Always confirm the audience and tone before writing
- Use active voice and concise sentences
- Break long documents into scannable sections with headers
- For technical content, include code examples
- Store reusable templates in memory for future use
