---
name: Planning
description: Project planning, task breakdown, and scheduling
triggers:
  - plan
  - organize
  - break down
  - task
  - project
  - roadmap
  - milestone
  - estimate
tools:
  - terminator-memory (memory_store, memory_search, memory_context)
  - terminator-files (files_template_render, files_workspace_scaffold)
  - terminator-scheduler (schedule_create, schedule_list, schedule_get)
---

# Planning Skill

## Purpose
Break down complex goals into actionable tasks, create project plans with milestones, estimate effort, and optionally schedule tasks for tracking and automation.

## When to Use
- User asks to plan a project or initiative
- User needs a task breakdown for a complex goal
- User wants to organize work with priorities and deadlines
- User asks for a roadmap or timeline
- User needs to estimate effort for a project

## Workflow

### Step 1: Understand the Goal
- What is the end objective?
- What are the constraints? (time, budget, resources)
- What is the scope? (MVP vs. full feature set)
- Check memory for related past plans with `memory_context`

### Step 2: Break Down into Tasks
Apply the **Work Breakdown Structure** approach:
1. Identify major phases or milestones
2. Break each phase into concrete tasks
3. Each task should be achievable in 1–4 hours
4. Identify dependencies between tasks

### Step 3: Estimate & Prioritize
For each task:
- **Effort**: Small (< 1hr), Medium (1-4hr), Large (4-8hr), XL (> 1 day)
- **Priority**: Critical, High, Medium, Low
- **Dependencies**: What must be done first?
- **Risk**: What could go wrong?

### Step 4: Create Plan Document
```markdown
# Project Plan: [Name]

## Objective
[Clear statement of what success looks like]

## Timeline
- **Phase 1**: [Name] — [Date range]
- **Phase 2**: [Name] — [Date range]

## Task Breakdown

### Phase 1: [Name]
| # | Task | Priority | Effort | Depends On | Status |
|---|------|----------|--------|------------|--------|
| 1 | [Task] | High | Medium | — | Pending |
| 2 | [Task] | High | Small | 1 | Pending |
| 3 | [Task] | Medium | Large | 1, 2 | Pending |

### Phase 2: [Name]
...

## Risks
- [Risk 1]: Mitigation strategy
- [Risk 2]: Mitigation strategy

## Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
```

### Step 5: Schedule (Optional)
- If the user wants automated tracking, use `schedule_create` to set up reminders
- Create recurring check-ins for milestone reviews
- Set up deadline reminders

### Step 6: Store Plan
- Save the plan to a file using file tools
- Store the plan summary in memory with `memory_store`
- Tag with `plan`, `project`, and the project name

## Tips
- Keep tasks small and concrete — "implement user auth" is too vague, "add JWT middleware to Express app" is specific
- Always identify the critical path — the sequence of dependent tasks that determines the minimum timeline
- Build in buffer time (add ~20% to estimates)
- Review and update plans regularly — plans are living documents
- Use memory to track plan progress across sessions
