# Autonomous Worker Workspace

A fully autonomous workspace with all Terminator capabilities enabled, pre-configured schedules, hooks, and remote control. This template is designed for hands-off operation where Terminator proactively manages tasks, monitors sources, and communicates results.

## Folder Structure

```
tasks/   — Active task definitions and working files
inbox/   — Incoming items (messages, files, triggers)
outbox/  — Outgoing deliverables and reports
logs/    — Execution logs and audit trail
```

## Prerequisites

Before using autonomous mode, configure your `.env` with at least one communication channel:

```env
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TERMINATOR_ALLOWED_USER_IDS=your_telegram_user_id
```

## Getting Started

1. Copy this template folder to your desired location
2. Open in your agentic IDE
3. Prompt: *"Set up Terminator in this workspace with autonomous mode"*
4. Configure `.env` with your channel API keys
5. Prompt: *"Load the daily-briefing chain and schedule it for 8am"*

## Pre-configured Automation

### Task Chains
- **daily-briefing** — Check email, monitor sites, compile and send a morning briefing
- **website-monitor** — Periodically check configured URLs for changes
- **inbox-processor** — Process incoming messages and route to appropriate actions

### Hooks
- **on-workspace-open** — Auto-load context, check pending tasks
- **on-schedule-trigger** — Execute scheduled tasks automatically
- **on-message-received** — Parse remote commands from messaging channels

### Remote Control Commands
Send these via Telegram/Discord/Slack:
- `/status` — Get current task status
- `/tasks` — List scheduled tasks
- `/do <instruction>` — Execute an instruction
- `/pause` — Pause all operations
- `/resume` — Resume operations
- `/memory <query>` — Search memory

## Safety

Even with autonomous mode enabled, Terminator will:
- **Always confirm** deletions and financial actions
- **Log every action** to memory with tag `autonomous_action`
- **Notify you** via your default channel when tasks complete
- **Stop and ask** if it encounters an unrecoverable error
