---
description: Process pending scheduled tasks
---

# Schedule Trigger Hook

This workflow processes pending scheduled tasks. Invoke with /hooks-schedule or let the automatic poller trigger it.

## Instructions

Scheduled tasks need to be executed. Please do the following:

1. Use `schedule_queue_pending` to ensure all due tasks are in the execution queue (catches missed/overdue tasks)
2. Use `schedule_get_pending_executions` to see the queue
3. Use `schedule_get_missed_executions` to check for overlooked tasks
4. While there are pending executions:
   - Call `schedule_claim_execution` to claim the next task
   - **READ** the task description carefully
   - **EXECUTE** the task (research, browse, notify, run analysis, etc.)
   - Call `schedule_complete_execution` with the result
5. If any executions failed, use `schedule_claim_execution` again with `status: "failed"` and consider retrying

**Important**: You MUST actually execute each task - just acknowledging it exists is not enough. The user expects the work to be performed.

**About the Execution Queue**: This system ensures tasks are never missed. Even if you're late or the system was down, `schedule_queue_pending` will catch overdue tasks and add them. You then work through the queue by claiming and completing each execution.