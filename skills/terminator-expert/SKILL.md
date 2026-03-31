---
name: terminator-expert
description: Expert knowledge of the Terminator Package — all components, configuration, troubleshooting, and usage
triggers:
  - how to use terminator
  - terminator setup
  - terminator help
  - what can terminator do
  - terminator configuration
  - terminator troubleshooting
  - explain terminator
  - terminator features
  - terminator capabilities
---

# Terminator Expert Skill

You are an expert on the Terminator Package. Use this skill when users ask about Terminator's capabilities, setup, configuration, troubleshooting, or how to use specific features.

---

## Architecture Overview

Terminator transforms an agentic IDE into an autonomous AI knowledge worker. It consists of:

### Installation Modes
- **Embedded mode (recommended)**: Terminator lives in `.terminator-package/` hidden folder inside the user's project. Keeps the project directory clean.
- **Standalone mode**: Terminator IS the project root. Used for Terminator development or dedicated worker workspaces.

### Directory Structure (Embedded Mode)
```
user-project/
├── .terminator-package/          # Hidden — all Terminator source code
│   ├── TERMINATOR.md             # Master system prompt
│   ├── mcp-servers/              # 7 MCP servers (48+ tools)
│   ├── skills/                   # 10 skill definitions
│   ├── agents/                   # 6 agent configurations
│   ├── hooks/                    # 3 hooks + 3 task chains
│   ├── installer/                # Install, doctor, uninstall scripts
│   ├── templates/                # 5 workspace templates
│   ├── resources/guides/         # 5 documentation guides
│   ├── extensions/               # VS Code extension
│   ├── .env.example              # Environment variable template
│   └── package.json              # Dependencies
├── .terminator/                  # Runtime state (at project root)
│   ├── config.json               # User settings & autonomous mode
│   ├── memory.db                 # Persistent memory database
│   ├── schedules.db              # Scheduler database
│   ├── skills-index.json         # Installed skills registry
│   ├── hooks-registry.json       # Active hooks registry
│   └── logs/                     # Activity logs
├── .mcp.json                     # MCP server configuration (generated)
├── .windsurfrules                # IDE system prompt (generated, IDE-specific)
├── .env                          # API keys (user-managed, never committed)
└── ... (user's project files)
```

---

## MCP Servers (7 servers, 48+ tools)

### 1. terminator-memory (6 tools)
Persistent SQLite memory that survives across sessions.
- `memory_store` — Store key-value with tags and metadata
- `memory_search` — Search by keyword or tag
- `memory_retrieve` — Get specific memory by key
- `memory_list` — List all, optionally filtered by tag
- `memory_delete` — Remove a memory
- `memory_context` — Auto-retrieve relevant context for current conversation

**Best practice**: Always call `memory_context` at the start of non-trivial tasks.

### 2. terminator-scheduler (11 tools)
Cron jobs, one-shot tasks, and multi-step task chains.
- `schedule_create` — Create recurring (cron) or one-shot task
- `schedule_list` — List all tasks
- `schedule_get` — Get task details
- `schedule_cancel` — Cancel a task
- `schedule_pause` / `schedule_resume` — Pause/resume
- `schedule_check_pending` — Find due tasks
- `schedule_mark_done` — Mark completed with result
- `schedule_history` — View execution history
- `chain_load` — Load a chain definition from file
- `chain_status` — Check chain execution status

**Cron patterns**: `*/5 * * * *` (every 5 min), `0 9 * * *` (daily 9am), `0 0 * * 1` (weekly Monday)

### 3. terminator-comms (12 tools)
Multi-channel communication: Telegram, Discord, Slack, Email, Webhooks.
- `comms_status` — Check configured channels
- `telegram_send` / `telegram_read` — Telegram messaging
- `discord_send` / `discord_read` — Discord messaging
- `slack_send` / `slack_read` — Slack messaging
- `email_send` — Send email via SMTP
- `webhook_send` — POST data to webhook URL
- `comms_parse_command` — Parse remote control commands
- `comms_check_auth` — Verify user authentication

**Required env vars**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`

### 4. terminator-browser (4 tools)
Web browsing and data extraction using fetch + cheerio + turndown.
- `browse_url` — Fetch URL, convert to clean markdown
- `browse_extract` — Extract structured data with CSS selectors
- `browse_search` — Search web via DuckDuckGo
- `browse_monitor` — Monitor page for changes vs. cached version

### 5. terminator-data (5 tools)
Database queries, CSV/JSON processing, statistics.
- `data_query` — Run SQL against SQLite databases
- `data_csv_read` — Read and parse CSV files
- `data_csv_write` — Write data to CSV
- `data_json_store` — Key-value JSON storage
- `data_analyze` — Statistical analysis (count, min, max, mean, median, std dev)

### 6. terminator-files (7 tools)
Template rendering, bulk operations, archives.
- `files_template_render` — Render Handlebars templates with data
- `files_bulk_rename` — Rename files with patterns
- `files_tree` — Directory tree with size info
- `files_search` — Search file contents with regex
- `files_archive_create` — Create ZIP archives
- `files_archive_extract` — Extract ZIP archives
- `files_workspace_scaffold` — Create directory structures from JSON

### 7. terminator-system (7 tools)
Desktop notifications, clipboard, process management.
- `system_notify` — Desktop notifications (title + message)
- `system_clipboard_read` / `system_clipboard_write` — Clipboard access
- `system_process_list` — List running processes
- `system_env_get` — Read environment variables
- `system_info` — OS, CPU, memory, disk info
- `system_open` — Open files/URLs with default application

---

## Skills (10)

| Skill | Domain | Trigger Examples |
|---|---|---|
| research | Web research, information gathering | "research X", "find info about Y" |
| writing | Documents, reports, articles | "write a report", "draft an email" |
| analysis | Data analysis, patterns | "analyze this CSV", "find patterns in" |
| communication | Messages, emails, notifications | "send a message", "notify the team" |
| planning | Project plans, task breakdowns | "plan the project", "break down tasks" |
| automation | Schedules, hooks, recurring tasks | "automate this", "schedule a daily" |
| coding | Software development | "write a function", "debug this code" |
| summarize | Summarization across formats | "summarize this page", "give me key points" |
| onboarding | Setup and capability guidance | "what can you do", "help me get started" |
| terminator-expert | Terminator knowledge & troubleshooting | "how to use terminator", "terminator setup" |

---

## Agents (6)

| Agent | Role | When to Delegate |
|---|---|---|
| researcher | Deep multi-source research | Complex research spanning multiple sources |
| writer | Long-form content creation | Documents, reports, articles requiring structure |
| analyst | Data analysis & statistics | CSV analysis, SQL queries, pattern finding |
| scheduler | Task management & automation | Complex scheduling, chain creation |
| communicator | Cross-channel messaging | Multi-channel notifications, message routing |
| supervisor | Meta-agent coordinator | Complex tasks spanning multiple domains |

---

## Hooks & Task Chains

### Built-in Hooks
- **on-workspace-open** — Load memory context, check pending tasks, greet user
- **on-schedule-trigger** — Execute due tasks, notify on completion
- **on-message-received** — Parse remote commands, authenticate, execute

### Pre-built Task Chains
- **daily-briefing** — Check email → monitor sites → compile summary → send via Telegram
- **website-monitor** — Check URLs → compare snapshots → alert on changes
- **inbox-processor** — Read messages → classify → route to appropriate handler

---

## Configuration

### .terminator/config.json
```json
{
  "version": "0.1.0",
  "autonomous": {
    "enabled": false,
    "requireConfirmation": ["delete", "send_message"],
    "autoApprove": ["read", "write_file", "search", "browse"],
    "maxTokensPerTask": 100000,
    "notifyOnCompletion": true,
    "defaultNotificationChannel": "telegram"
  },
  "memory": { "enabled": true },
  "scheduler": { "enabled": false },
  "comms": { "enabled": false, "defaultChannel": null }
}
```

### Autonomous Mode
- **Disabled (default)**: Confirm every destructive action
- **Enabled**: Auto-approve safe actions, still gate dangerous ones
- User must explicitly say "enable autonomous mode" to activate
- Cannot be self-enabled by the AI

### Remote Control Commands
| Command | Action |
|---|---|
| `/status` | Report current status |
| `/tasks` | List scheduled and active tasks |
| `/do <instruction>` | Execute an instruction |
| `/pause` | Pause autonomous operations |
| `/resume` | Resume paused operations |
| `/memory <query>` | Search memory |

---

## Common User Questions

### "How do I install Terminator?"
1. Open your project in an agentic IDE (Windsurf, Cursor, Claude Code, Cline, VS Code)
2. Tell your AI agent: "Clone https://github.com/netflypsb/terminator-package into .terminator-package/ and set it up"
3. The agent runs: `git clone`, `pnpm install`, `pnpm build`, `node .terminator-package/installer/dist/install.js`
4. Restart the IDE

### "How do I add API keys?"
Edit `.env` in your project root. Copy from `.terminator-package/.env.example` for the template. Key services: Telegram, Discord, Slack, Email (SMTP).

### "How do I enable autonomous mode?"
Say "enable autonomous mode" and the AI will update `.terminator/config.json`. Or edit the file directly setting `autonomous.enabled` to `true`.

### "How do I schedule a recurring task?"
Ask: "Schedule a daily briefing every morning at 9am" — the automation skill + scheduler will handle it.

### "How do I check if everything is working?"
Run: `node .terminator-package/installer/dist/doctor.js` — it checks 22+ health points.

### "How do I uninstall Terminator?"
Run: `node .terminator-package/installer/dist/uninstall.js` — removes generated configs but preserves source and .env.

### "How do I update Terminator?"
```bash
cd .terminator-package
git pull
pnpm install
pnpm build
node installer/dist/install.js
```

---

## Troubleshooting

### MCP servers not connecting
1. Run the doctor: `node .terminator-package/installer/dist/doctor.js`
2. Check that all servers are built (look for dist/index.js in each server)
3. Verify `.mcp.json` paths point to the correct locations
4. Restart the IDE after any config change

### Memory not persisting
- Check `.terminator/memory.db` exists
- Verify `DB_PATH` in `.mcp.json` points to the correct path
- Run `memory_list` to check if the database is accessible

### Communication channels not working
- Check `.env` has the required tokens/IDs
- Run `comms_status` to see which channels are configured
- For Telegram: ensure bot token is valid and chat ID is correct

### Skills/agents not found
- Check `.terminator/skills-index.json` for correct paths
- In embedded mode, paths should start with `.terminator-package/`
- Re-run the installer to regenerate the index

---

## Workspace Templates

Five pre-built templates for common use cases:
1. **general-work** — All-purpose with all servers enabled
2. **research-project** — Browser + Memory + Data focused
3. **content-creation** — Writing + Browser + Files focused
4. **data-analysis** — Data + Files + Memory focused
5. **autonomous-worker** — Full autonomous mode with hooks and chains

To use a template, copy its `.terminator-workspace.json` to your project root.
