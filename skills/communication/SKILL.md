---
name: communication
description: Drafting and sending messages across channels
triggers:
  - send message
  - email
  - notify
  - communicate
  - telegram
  - discord
  - slack
  - tell
  - message
tools:
  - terminator-comms (telegram_send, telegram_read, discord_send, discord_read, slack_send, slack_read, email_send, webhook_send, comms_status)
  - terminator-memory (memory_store, memory_search, memory_context)
---

# Communication Skill

## Purpose
Draft, review, and send messages across multiple channels (Telegram, Discord, Slack, Email, Webhooks). Manage cross-channel communication with appropriate tone and formatting per platform.

## When to Use
- User asks to send a message, email, or notification
- User wants to check messages from a channel
- User wants to broadcast information across channels
- User needs a message drafted in a specific tone
- User wants to set up notification workflows

## Workflow

### Step 1: Understand Intent
- What is the message about?
- Who is the recipient?
- Which channel? (Telegram, Discord, Slack, Email, Webhook)
- What tone? (professional, casual, urgent)
- Check available channels with `comms_status`

### Step 2: Check Context
- Use `memory_context` for relevant background
- Check previous communications on this topic
- Understand the relationship with the recipient

### Step 3: Draft Message
Adapt format per channel:

**Telegram** — Short, direct, supports Markdown:
```
*Task Complete*: Research on SQLite optimization
Key findings saved to memory. Want me to send the full report?
```

**Discord** — Casual, supports embeds via Markdown:
```
**Research Complete** 🔍
Found 5 key insights on SQLite optimization.
Use `/memory search sqlite` to review findings.
```

**Slack** — Professional, supports mrkdwn:
```
*Research Report Ready*
Topic: SQLite Performance Optimization
Status: Complete — 5 key findings stored in memory
```

**Email** — Formal, with subject line:
```
Subject: Research Report — SQLite Performance Optimization
Body: Please find the summary of our research findings...
```

### Step 4: Confirm Before Sending
- Always show the draft to the user before sending
- Confirm the channel and recipient
- **Never send without explicit user approval** unless in autonomous mode

### Step 5: Send
- Use the appropriate tool (`telegram_send`, `discord_send`, `slack_send`, `email_send`, `webhook_send`)
- Report delivery status

### Step 6: Log
- Store the communication in memory with `memory_store`
- Tag with `communication`, channel name, and topic

## Channel Quick Reference

| Channel | Token Env Var | Best For |
|---------|--------------|----------|
| Telegram | `TELEGRAM_BOT_TOKEN` | Quick notifications, remote control |
| Discord | `DISCORD_BOT_TOKEN` | Team updates, community |
| Slack | `SLACK_BOT_TOKEN` | Workspace/professional |
| Email | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Formal, external |
| Webhook | (none needed) | Integrations, automation |

## Tips
- Always check `comms_status` first to know which channels are available
- Match tone to channel: casual for Telegram/Discord, professional for Email/Slack
- For urgent notifications, prefer Telegram (fastest delivery)
- Keep Telegram/Discord messages under 300 words; use Email for longer content
- Log all sent messages in memory for continuity
- **Never send messages without user confirmation** unless autonomous mode is explicitly enabled
