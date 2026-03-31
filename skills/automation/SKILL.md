---
name: Automation
description: Setting up schedules, recurring tasks, and automated workflows
triggers:
  - automate
  - schedule
  - recurring
  - every day
  - every hour
  - cron
  - monitor
  - watch
  - remind me
tools:
  - terminator-scheduler (schedule_create, schedule_list, schedule_get, schedule_cancel, schedule_pause, schedule_resume, schedule_check_pending, schedule_mark_done, schedule_history)
  - terminator-comms (telegram_send, discord_send, slack_send, email_send, webhook_send, comms_status)
  - terminator-memory (memory_store, memory_search)
---

# Automation Skill

## Purpose
Set up scheduled tasks, recurring workflows, monitoring jobs, and automated notification pipelines. Turn manual routines into hands-off automation.

## When to Use
- User asks to schedule a recurring task
- User wants to be reminded about something
- User wants to monitor a website or data source for changes
- User asks to automate a workflow
- User wants to set up a daily/weekly routine

## Workflow

### Step 1: Understand the Automation
- **What** should happen? (the action)
- **When** should it happen? (schedule/trigger)
- **How often**? (one-shot, daily, weekly, custom cron)
- **What happens with the result?** (notify, store, execute further)

### Step 2: Design the Schedule
Convert user intent to cron expressions:

| User Says | Cron Expression | Type |
|-----------|----------------|------|
| "every morning at 8am" | `0 8 * * *` | cron |
| "every hour" | `0 * * * *` | cron |
| "every Monday" | `0 9 * * 1` | cron |
| "in 30 minutes" | (calculated ISO timestamp) | one_shot |
| "tomorrow at 3pm" | (calculated ISO timestamp) | one_shot |
| "every 5 minutes" | `*/5 * * * *` | cron |

### Step 3: Create the Task
Use `schedule_create` with:
```json
{
  "name": "descriptive-task-name",
  "type": "cron",
  "description": "What this task does and why",
  "cron_expression": "0 8 * * *",
  "payload": "{\"action\": \"check_website\", \"url\": \"https://example.com\"}"
}
```

### Step 4: Set Up Notification (if needed)
- Check available channels with `comms_status`
- Configure which channel to notify on completion
- Store notification preferences in memory

### Step 5: Verify
- Use `schedule_list` to confirm the task was created
- Use `schedule_get` to show task details
- Explain to the user when the next execution will occur

### Step 6: Monitor
- Use `schedule_check_pending` to find tasks ready for execution
- Use `schedule_history` to review past executions
- Use `schedule_pause`/`schedule_resume` to control tasks

## Common Automation Patterns

### Website Monitor
```
Schedule: every 4 hours
Action: browse_url → compare with last snapshot → notify if changed
```

### Daily Briefing
```
Schedule: every day at 8am
Action: check emails → check calendar → check monitored sites → compile summary → send via Telegram
```

### Reminder
```
Schedule: one-shot at specific time
Action: send notification via preferred channel
```

### Data Collection
```
Schedule: every hour
Action: browse_extract data from URL → store in database → alert if threshold exceeded
```

## Tips
- Always confirm the schedule with the user before creating
- Use descriptive task names — they appear in `schedule_list`
- For monitoring tasks, set reasonable intervals (not too frequent)
- Store automation configs in memory so they survive across sessions
- Use `schedule_pause` instead of `schedule_cancel` when the user wants to temporarily stop a task
- Check `schedule_check_pending` at the start of each session to process any due tasks
