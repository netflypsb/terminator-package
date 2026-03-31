---
description: Terminator startup — load context, check pending tasks
---

# Startup Hook

This workflow runs on workspace open. It is generated from hooks.

## Instructions

Session started. Please do the following:

1. Use `memory_context` to load relevant background for this workspace
2. **IMPORTANT**: Use `schedule_check_pending` to find any tasks that are due
3. If there are pending tasks, you MUST execute them immediately:
   - Read each task description
   - Execute the task as instructed
   - Use `schedule_mark_done` to mark each task as completed
4. Briefly greet the user and summarize:
   - Any pending items found and executed
   - Recent activity or status
   - Whether autonomous mode is enabled

**Note on Scheduled Tasks**: The scheduler stores tasks but requires an active agent to execute them. You are that agent. When a task's time comes due, it appears in `schedule_check_pending` - you must act on it.