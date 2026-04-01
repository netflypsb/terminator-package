---
name: coding
description: Software development, debugging, and testing workflows with research, testing, and documentation
triggers:
  - code
  - implement
  - build
  - develop
  - debug
  - fix bug
  - refactor
  - test
  - deploy
tools:
  - terminator-browser (browse_url, browse_search, browse_extract)
  - terminator-memory (memory_store, memory_search, memory_context)
  - terminator-data (data_query, data_json_store)
  - terminator-files (files_tree, files_search, files_workspace_scaffold)
  - terminator-system (system_clipboard_read, system_clipboard_write, system_info)
---

# Coding Skill

## Purpose
Enhance the development workflow with research-backed implementation, systematic debugging, automated testing patterns, and thorough documentation. Acts as a senior pair programmer.

## When to Use
- User is writing or modifying code
- User needs to debug an issue
- User wants to implement a feature with best practices
- User needs to scaffold a new project
- User wants to refactor or improve existing code

## Workflow

### Feature Implementation

#### Step 1: Understand Requirements
- What should the feature do?
- What are the inputs and expected outputs?
- What are the edge cases?
- Check memory for related implementations with `memory_context`

#### Step 2: Research (if needed)
- Use `browse_search` to find patterns, libraries, or examples
- Use `browse_url` to read documentation
- Store useful patterns in memory for reuse

#### Step 3: Plan the Implementation
- Identify affected files using `files_tree` and `files_search`
- Design the approach: data flow, interfaces, dependencies
- Break into small, testable steps

#### Step 4: Implement
- Write code incrementally — small, focused changes
- Follow existing code style and conventions
- Add types/interfaces before implementation
- Handle errors and edge cases

#### Step 5: Test
- Write or update tests alongside implementation
- Test edge cases and error paths
- Run existing tests to ensure no regressions

#### Step 6: Document
- Update relevant documentation
- Add inline comments for non-obvious logic only
- Update README if the change affects usage

### Debugging

#### Step 1: Reproduce
- Understand the exact steps to reproduce
- Identify the expected vs. actual behavior

#### Step 2: Isolate
- Use `files_search` to find relevant code paths
- Add targeted logging to narrow down the issue
- Check memory for known issues with `memory_search`

#### Step 3: Root Cause
- Trace the execution path
- Identify the exact line/condition causing the bug
- Understand *why* it's wrong, not just *what* is wrong

#### Step 4: Fix
- Make the minimal change that fixes the root cause
- Prefer upstream fixes over downstream workarounds
- Avoid over-engineering — single-line fixes when sufficient

#### Step 5: Verify
- Confirm the fix resolves the issue
- Check for regressions
- Add a test that would have caught this bug

### Project Scaffolding

Use `files_workspace_scaffold` to create new projects:
```json
{
  "root": "my-project",
  "structure": [
    {"path": "src/"},
    {"path": "src/index.ts", "content": "// entry point"},
    {"path": "tests/"},
    {"path": "package.json", "content": "..."},
    {"path": "tsconfig.json", "content": "..."},
    {"path": "README.md", "content": "# My Project"}
  ]
}
```

## Tips
- Always read existing code before modifying it
- Prefer editing existing files over creating new ones
- Keep changes focused — one concern per edit
- Store reusable code patterns in memory for future reference
- When stuck, research the specific error message or pattern
- Use `system_info` to understand the runtime environment
- For large refactors, plan the change sequence to avoid breaking intermediate states
