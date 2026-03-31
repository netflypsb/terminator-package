---
description: Terminator startup — load context, check pending tasks
---

# Startup Hook

This workflow runs on workspace open. It is generated from hooks.

## Instructions

Session started. Please do the following:

1. Use `memory_context` to load relevant background for this workspace
2. **CRITICAL**: Use `schedule_queue_pending` to queue any due tasks to the execution queue
3. Use `schedule_get_pending_executions` to see what tasks are waiting
4. For each pending execution:
   - Use `schedule_claim_execution` to claim it
   - **EXECUTE** the task description (research, browse, notify, etc.)
   - Use `schedule_complete_execution` to mark it done
5. Check `schedule_get_missed_executions` to catch any overlooked tasks
6. Briefly greet the user and summarize what was executed

**Why this matters**: The execution queue ensures tasks are NEVER missed. Even if you're late, queue_pending will catch overdue tasks and add them to the queue. You then claim and execute them. This is far more reliable than simple polling.