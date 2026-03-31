# Terminator Package

**Transform any agentic IDE into an autonomous AI Worker.**

Terminator brings the high-powered agentic capabilities of coding IDEs (Windsurf, Cursor, Claude Code, Cline, Codex) to **general knowledge work** — research, writing, data analysis, communications, scheduling, and full autonomous operation with remote control via Telegram, Discord, and Slack.

> **7 MCP servers · 48+ tools · 9 skills · 6 agents · 3 hooks · 3 task chains**

---

## One-Prompt Install

Open your agentic IDE, clone or open this repository, and give this single prompt:

> **"Read the INSTALL section in README.md and set up the Terminator Package in this workspace."**

That's it. Your AI agent will handle the rest.

### INSTALL

These are the exact steps the AI agent (or you) should follow:

```bash
# 1. Verify Node.js >= 20
node --version

# 2. Install pnpm if not present
npm install -g pnpm

# 3. Install all dependencies
pnpm install

# 4. Build all MCP servers and packages
pnpm build

# 5. Run the installer (detects your IDE, configures everything)
node installer/dist/install.js

# 6. Create your .env file for API keys (optional — only needed for communication channels)
cp .env.example .env
# Edit .env to add Telegram/Discord/Slack tokens if desired

# 7. Run the doctor to verify everything is healthy
node installer/dist/doctor.js
```

After installation, **restart your IDE** to load the new MCP server configurations.

The installer automatically:
- Detects your IDE (Windsurf, Cursor, Claude Code, Cline, VS Code)
- Generates the MCP server configuration file (`.mcp.json` or `.cursor/mcp.json`)
- Generates the IDE-specific system prompt (`.windsurfrules`, `.cursorrules`, `CLAUDE.md`, etc.)
- Creates the `.terminator/` runtime directory with default config
- Installs all 9 skills, 6 agents, and 3 hooks
- Sets up a skills index and hooks registry

### Verify Installation

```bash
node installer/dist/doctor.js
```

You should see `22 passed, 0 failed — HEALTHY`.

---

## What You Get

Once installed, your IDE agent becomes **Terminator** — a fully capable autonomous knowledge worker with these capabilities:

### MCP Servers (48+ tools)

| Capability | MCP Server | Tools | What It Does |
|---|---|---|---|
| **Persistent Memory** | terminator-memory | 6 | Store, search, retrieve context across sessions |
| **Task Scheduling** | terminator-scheduler | 11 | Cron jobs, one-shot tasks, multi-step chains |
| **Communications** | terminator-comms | 12 | Telegram, Discord, Slack, Email, Webhooks |
| **Web Browsing** | terminator-browser | 4 | Fetch pages, extract data, search, monitor changes |
| **Data Processing** | terminator-data | 5 | SQLite queries, CSV read/write, statistics |
| **File Operations** | terminator-files | 7 | Templates, bulk rename, archives, scaffolding |
| **System Integration** | terminator-system | 7 | Notifications, clipboard, processes, system info |

### Skills (prompt-based expertise)

| Skill | What It Does |
|---|---|
| **research** | Web research, multi-source gathering, synthesis |
| **writing** | Documents, reports, articles, editing |
| **analysis** | Data analysis, pattern finding, statistics |
| **communication** | Drafting and sending messages across channels |
| **planning** | Project plans, task breakdowns, scheduling |
| **automation** | Schedules, hooks, recurring workflows |
| **coding** | Software development, debugging, testing |
| **summarize** | Condensing documents, pages, conversations |
| **onboarding** | Guiding new users through capabilities |

### Agents (specialized subagents)

| Agent | Role |
|---|---|
| **researcher** | Deep multi-source research with synthesis |
| **writer** | Long-form content creation |
| **analyst** | Data analysis and statistics |
| **scheduler** | Task management and automation |
| **communicator** | Cross-channel messaging |
| **supervisor** | Coordinates multi-domain tasks across agents |

### Hooks & Automation

| Hook | Trigger | Action |
|---|---|---|
| **on-workspace-open** | IDE session starts | Load context, check pending tasks |
| **on-schedule-trigger** | Scheduled task is due | Execute task, notify on completion |
| **on-message-received** | Message arrives | Parse remote commands, respond |

### Task Chains (pre-built workflows)

| Chain | What It Does |
|---|---|
| **daily-briefing** | Check email → monitor sites → compile → send briefing |
| **website-monitor** | Periodically check URLs for changes, alert on diff |
| **inbox-processor** | Process incoming messages, route to actions |

---

## Quick Start

After installation, try these prompts:

```
"Remember that my preferred communication channel is Telegram and my timezone is UTC+8"
```

```
"Research the latest developments in AI agents and save a summary to findings.md"
```

```
"Schedule a daily task at 9am to check my monitored websites for changes"
```

```
"What capabilities do you have as a Terminator?"
```

---

## Remote Control

Control Terminator from your phone via Telegram, Discord, or Slack:

| Command | Action |
|---|---|
| `/status` | Get current task status |
| `/tasks` | List scheduled tasks |
| `/do <instruction>` | Execute any instruction |
| `/pause` | Pause autonomous operations |
| `/resume` | Resume operations |
| `/memory <query>` | Search memory |

See [resources/guides/remote-control.md](resources/guides/remote-control.md) for setup instructions.

---

## Workspace Templates

Start new projects from pre-built templates in `templates/`:

| Template | Focus | Servers |
|---|---|---|
| **general-work** | All-purpose knowledge work | All 7 |
| **research-project** | Research and analysis | Memory, Browser, Data, Files |
| **content-creation** | Writing and publishing | Memory, Browser, Files |
| **data-analysis** | Data processing and reports | Memory, Browser, Data, Files |
| **autonomous-worker** | Hands-off autonomous operation | All 7 + autonomous mode |

---

## Supported IDEs

| IDE | MCP Config | System Prompt | Status |
|---|---|---|---|
| **Windsurf** | `.mcp.json` | `.windsurfrules` | Full support |
| **Cursor** | `.cursor/mcp.json` | `.cursorrules` | Full support |
| **Claude Code** | `.mcp.json` | `CLAUDE.md` | Full support |
| **Cline** | `.mcp.json` | `.clinerules` | Full support |
| **VS Code + Copilot** | `.mcp.json` | `.github/copilot-instructions.md` | Full support |

---

## Project Structure

```
terminator-package/
├── TERMINATOR.md                  # System prompt — the AI's "brain"
├── .env.example                   # API key template
├── mcp-servers/                   # 7 local MCP servers
│   ├── terminator-memory/         # Persistent memory (SQLite)
│   ├── terminator-scheduler/      # Task scheduling (cron, chains)
│   ├── terminator-comms/          # Messaging (Telegram, Discord, Slack, Email)
│   ├── terminator-browser/        # Web browsing and extraction
│   ├── terminator-data/           # SQL, CSV, statistics
│   ├── terminator-files/          # File operations and templates
│   └── terminator-system/         # System integration
├── skills/                        # 9 prompt-based skills
├── agents/                        # 6 specialized subagents
├── hooks/                         # Event-driven automation
│   ├── chains/                    # 3 pre-built task chains
│   ├── on-workspace-open.json
│   ├── on-schedule-trigger.json
│   └── on-message-received.json
├── extensions/                    # VS Code extension (UI panel)
│   └── terminator-panel/
├── installer/                     # Cross-IDE installer & doctor
├── templates/                     # 5 workspace templates
├── resources/                     # Guides and documentation
│   └── guides/
└── .terminator/                   # Runtime state (gitignored)
    ├── config.json
    ├── memory.db
    ├── schedules.db
    └── logs/
```

---

## Configuration

### Runtime State

All runtime state lives in `.terminator/` (gitignored, created by installer):

| File | Purpose |
|---|---|
| `config.json` | User settings, autonomous mode config |
| `memory.db` | Persistent memory database |
| `schedules.db` | Scheduled tasks database |
| `hooks-registry.json` | Registered hooks |
| `skills-index.json` | Skills metadata |

### API Keys

API keys go in `.env` (gitignored). See `.env.example` for all options:

- **Telegram**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **Discord**: `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`
- **Slack**: `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`
- **Email**: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `IMAP_*`
- **Remote Control**: `TERMINATOR_ALLOWED_USER_IDS`, `TERMINATOR_COMMAND_PASSPHRASE`

---

## Autonomous Mode

Terminator can operate autonomously — executing tasks, monitoring sources, and communicating results without step-by-step confirmation.

**Enable via prompt**: *"Enable autonomous mode"*

**Safety**: Even in autonomous mode, destructive actions (delete, spend money) always require confirmation. All actions are logged to memory.

See [resources/guides/autonomous-mode.md](resources/guides/autonomous-mode.md) for details.

---

## Guides

| Guide | Description |
|---|---|
| [Getting Started](resources/guides/getting-started.md) | First-use walkthrough with examples |
| [Custom Skills](resources/guides/custom-skills.md) | Create your own skills |
| [Custom MCP Servers](resources/guides/custom-mcp-servers.md) | Add or build MCP servers |
| [Autonomous Mode](resources/guides/autonomous-mode.md) | Configure autonomous operation |
| [Remote Control](resources/guides/remote-control.md) | Telegram/Discord setup |

---

## Uninstall

```bash
node installer/dist/uninstall.js
```

This removes generated config files (`.mcp.json`, system prompt files, `.terminator/`) but leaves your source code intact.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Contributing

Contributions welcome! This is an open-source project. See the architecture docs in `00.PLAN01/` for design details.
