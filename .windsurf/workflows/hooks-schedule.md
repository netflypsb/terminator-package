---
description: Process pending scheduled tasks
---

# Schedule Trigger Hook

This workflow processes pending scheduled tasks. Invoke with /hooks-schedule.

## Instructions

A scheduled task is due for execution. Please do the following:
1. Use schedule_check_pending to get all pending tasks
2. For each pending task, read its payload and execute the appropriate action:
   - If payload contains 'action': 'research', use the research skill
   - If payload contains 'action': 'monitor', use browse_url to check the target and compare with previous results
   - If payload contains 'action': 'notify', send a notification via the specified channel
   - If payload contains 'action': 'chain', execute the referenced task chain
3. Use schedule_mark_done to mark each task as completed with the result
4. If notify_on_complete is set, send a summary via the specified channel