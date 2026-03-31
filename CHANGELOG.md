# Changelog

All notable changes to the Terminator Package will be documented in this file.

## [0.1.0] — 2025-03-31

### 🚀 Initial Release

The first complete release of Terminator Package — transforming agentic IDEs into autonomous AI knowledge workers.

### MCP Servers (7 servers, 48+ tools)

- **terminator-memory** — Persistent SQLite memory with store, search, retrieve, list, delete, context (6 tools)
- **terminator-scheduler** — Cron jobs, one-shot tasks, task chains with chain_load and chain_status (11 tools)
- **terminator-comms** — Telegram, Discord, Slack, Email, Webhooks with remote command parsing and auth (12 tools)
- **terminator-browser** — Web browsing, data extraction, search, page monitoring (4 tools)
- **terminator-data** — SQLite queries, CSV read/write, JSON store, statistical analysis (5 tools)
- **terminator-files** — Template rendering, bulk rename, directory tree, file search, archives, scaffolding (7 tools)
- **terminator-system** — Desktop notifications, clipboard, process list, env vars, system info, file opener (7 tools)

### Skills (9)

- research, writing, analysis, communication, planning, automation, coding, summarize, onboarding

### Agents (6)

- researcher, writer, analyst, scheduler, communicator, supervisor

### Hooks & Automation

- 3 built-in hooks: on-workspace-open, on-schedule-trigger, on-message-received
- 3 pre-built task chains: daily-briefing, website-monitor, inbox-processor
- Hook schema and chain schema for custom definitions
- IDE-specific hook registration (Windsurf workflows, Cursor rules, Claude Code settings)

### Remote Control

- Command parsing: /status, /tasks, /do, /pause, /resume, /memory
- Authentication: user ID whitelist + optional passphrase
- Works via Telegram, Discord, Slack

### Autonomous Mode

- Configurable auto-approve and require-confirmation action lists
- Token usage limits per task
- Completion notifications via any channel
- Remote kill switch (/pause)

### VS Code Extension (terminator-panel)

- React 18 webview with 5 views: Dashboard, Schedules, Communications, Memory, Settings
- Activity bar icon and status bar integration
- 7 command palette commands
- CSP-compliant, theme-aware UI

### Workspace Templates (5)

- general-work, research-project, content-creation, data-analysis, autonomous-worker

### Documentation

- Comprehensive README with one-prompt install
- 5 guides: getting-started, custom-skills, custom-mcp-servers, autonomous-mode, remote-control

### Installer

- Cross-IDE installer with auto-detection (Windsurf, Cursor, Claude Code, Cline, VS Code)
- Doctor with 22 health checks
- Uninstaller for clean removal
- Colorful terminal output with progress indicators

### IDE Support

- Windsurf (full support)
- Cursor (full support)
- Claude Code (full support + plugin wrapper)
- Cline (full support)
- VS Code + Copilot (full support)
