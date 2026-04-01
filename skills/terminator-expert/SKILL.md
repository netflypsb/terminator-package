---
name: terminator-expert
description: Expert knowledge of Terminator setup, configuration, and troubleshooting, and usage
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
│   ├── agents/                   # 5 agent configurations
│   ├── hooks/                    # 2 hooks
│   ├── installer/                # Install, doctor, uninstall scripts
│   ├── templates/                # 5 workspace templates
│   ├── resources/guides/         # 5 documentation guides
│   ├── .env.example              # Environment variable template
│   └── package.json              # Dependencies
├── .terminator/                  # Runtime state (at project root)
│   ├── config.json               # User settings & autonomous mode
│   ├── memory.db                 # Persistent memory database
│   ├── skills-index.json         # Installed skills registry
│   ├── hooks-registry.json       # Active hooks registry
│   └── logs/                     # Activity logs
├── .mcp.json                     # MCP server configuration (generated)
├── .windsurfrules                # IDE system prompt (generated, IDE-specific)
├── .env                          # API keys (user-managed, never committed)
└── ... (user's project files)
```

---

## User Interfaces

### 1. IDE Chat Panel (Primary)
The main way to interact with Terminator. Works in all supported IDEs:
- **Windsurf**: Chat panel with MCP tool support
- **Cursor**: Composer with agent mode
- **Claude Code**: Terminal-based chat
- **Cline**: Sidebar chat panel
- **VS Code**: GitHub Copilot chat or Cline extension

### 2. Remote Control (Mobile/External)
Control Terminator from outside the IDE via messaging channels:
- Telegram bot commands
- Discord bot commands
- Slack slash commands

See Remote Control section below for command reference.

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

### 2. terminator-comms (12 tools)
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

### 3. terminator-browser (4 tools)
Web browsing and data extraction using fetch + cheerio + turndown.
- `browse_url` — Fetch URL, convert to clean markdown
- `browse_extract` — Extract structured data with CSS selectors
- `browse_search` — Search web via DuckDuckGo
- `browse_monitor` — Monitor page for changes vs. cached version

### 4. terminator-data (5 tools)
Database queries, CSV/JSON processing, statistics.
- `data_query` — Run SQL against SQLite databases
- `data_csv_read` — Read and parse CSV files
- `data_csv_write` — Write data to CSV
- `data_json_store` — Key-value JSON storage
- `data_analyze` — Statistical analysis (count, min, max, mean, median, std dev)

### 5. terminator-files (7 tools)
Template rendering, bulk operations, archives.
- `files_template_render` — Render Handlebars templates with data
- `files_bulk_rename` — Rename files with patterns
- `files_tree` — Directory tree with size info
- `files_search` — Search file contents with regex
- `files_archive_create` — Create ZIP archives
- `files_archive_extract` — Extract ZIP archives
- `files_workspace_scaffold` — Create directory structures from JSON

### 6. terminator-office (6 tools)
Office document management (Word, Excel, PowerPoint, PDF).
- `office_word_create` — Create Word documents
- `office_excel_create` — Create Excel spreadsheets
- `office_powerpoint_create` — Create PowerPoint presentations
- `office_pdf_read` — Read PDF content and metadata
- `office_convert` — Convert between document formats
- `office_extract` — Extract content from office documents

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
| coding | Software development | "write a function", "debug this code" |
| summarize | Summarization across formats | "summarize this page", "give me key points" |
| office-documents | Office document lifecycle | "create Word doc", "convert PDF" |
| office-automation | Document workflows | "automate reports", "batch process" |
| onboarding | Setup and capability guidance | "what can you do", "help me get started" |
| terminator-expert | Terminator knowledge & troubleshooting | "how to use terminator", "terminator setup" |

---

## Agents (5)

| Agent | Role | When to Delegate |
|---|---|---|
| researcher | Deep multi-source research | Complex research spanning multiple sources |
| writer | Long-form content creation | Documents, reports, articles requiring structure |
| analyst | Data analysis & statistics | CSV analysis, SQL queries, pattern finding |
| communicator | Cross-channel messaging | Multi-channel notifications, message routing |
| supervisor | Meta-agent coordinator | Complex tasks spanning multiple domains |

---

## Hooks & Automation

### Built-in Hooks
- **on-workspace-open** — Load memory context, greet user
- **on-message-received** — Process remote commands, execute if authenticated

### Hook Configuration
Hooks are configured in `.terminator/hooks-registry.json`. Each hook has:
- `trigger` — Event that activates the hook
- `actions` — List of actions to execute
- `enabled` — Whether the hook is active

---

## Installation Methods

### Method 1: NPX (Recommended)
```bash
npx terminator-ai
```
Single command installs everything automatically. Detects IDE, downloads package, installs dependencies, configures integration.

### Method 2: Manual Install
```bash
git clone https://github.com/netflypsb/terminator-package.git .terminator-package
cd .terminator-package && pnpm install && pnpm build && cd ..
node .terminator-package/installer/dist/install.js
```

### Method 3: IDE Agent Install
Ask your AI agent:
> "Read the INSTALL section in the README at https://github.com/netflypsb/terminator-package and set up Terminator in this workspace."

---

## Configuration

### Environment Variables (.env)
Copy `.env.example` to `.env` and configure:
- **Telegram**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **Discord**: `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`
- **Slack**: `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`
- **Email**: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

### Autonomous Mode
Enable in `.terminator/config.json`:
```json
{
  "autonomous": {
    "enabled": true,
    "confirmDestructive": true
  }
}
```

---

## Troubleshooting

### Common Issues

**Problem**: Terminator not responding after installation.
**Solution**: Restart IDE to load MCP configurations.

**Problem**: MCP servers not loading.
**Solution**: Run `node .terminator-package/installer/dist/doctor.js` to check health.

**Problem**: Skills showing naming warnings.
**Solution**: Ensure skill names are lowercase alphanumeric with hyphens only.

---

## Development

### Project Structure
- `mcp-servers/` — Individual MCP server implementations
- `skills/` — Skill definitions with triggers and workflows
- `agents/` — Agent configurations for task delegation
- `installer/` — Cross-platform installation scripts
- `templates/` — Workspace templates for quick starts

### Adding New Components
- **MCP Server**: Add to `mcp-servers/`, update `pnpm-workspace.yaml`
- **Skill**: Create directory in `skills/` with `SKILL.md`
- **Agent**: Add configuration in `agents/`
- **Hook**: Add workflow in `workflows/`

---

## Version History

- **v0.2.x** — Streamlined version (no UI extension, no scheduling)
- **v0.1.x** — Legacy version (with UI extension and scheduling)

---

**For more information, visit: https://github.com/netflypsb/terminator-package**
