---
description: Terminator startup — load context, check pending tasks
---

# Startup Hook

This workflow runs on workspace open. It is generated from hooks.

## Instructions

Session started. Please do the following:
1. Use memory_context to load relevant background for this workspace
2. Use schedule_check_pending to find any tasks that are due
3. If there are pending tasks, process them and report what was done
4. Briefly greet the user and summarize any pending items or recent activity