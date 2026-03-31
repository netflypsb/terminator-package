---
description: Process pending scheduled tasks
---

# Schedule Trigger Hook

This workflow processes pending scheduled tasks. Invoke with /hooks-schedule or let the automatic poller trigger it.

## Instructions

A scheduled task is due for execution. Please do the following:

1. Use `schedule_check_pending` to get all pending tasks
2. For each pending task:
   - Read the task description carefully
   - Execute the task by following the description instructions
   - The task might ask you to: research something, browse a URL, send a notification, run analysis, or any other action
3. Use `schedule_mark_done` to mark each task as completed with a summary of what was done
4. If the task has `notify_on_complete` set, send a summary via the specified channel

**Important**: You MUST actually execute the task - just checking that it exists is not enough. The user expects the task to be performed.