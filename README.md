# Terminator Package

**Transform any agentic IDE into an autonomous AI Worker.**

Terminator Package brings the high-powered agentic capabilities of coding IDEs (Windsurf, Cursor, Claude Code, Cline, Codex) to **general knowledge work** — and adds autonomous, remote-controllable operation via Telegram, Discord, Slack, and more.

## One-Prompt Install

Open your agentic IDE on this repository folder and prompt:

> **"Read the INSTALL section below and set up the Terminator Package in this workspace."**

### Installation Steps (for the AI agent)

1. Ensure Node.js >= 20 is installed: `node --version`
2. Install pnpm if not present: `npm install -g pnpm`
3. Install dependencies: `pnpm install`
4. Build all packages: `pnpm build`
5. Run the installer: `node installer/dist/install.js`
6. Copy `.env.example` to `.env` and configure any API keys you want to use
7. Restart your IDE to pick up the new MCP server configurations

The installer will:
- Detect which IDE you're using (Windsurf, Cursor, Claude Code, Cline, VS Code)
- Generate the appropriate MCP server configuration (`.mcp.json`)
- Generate the IDE-specific system prompt file
- Create the `.terminator/` runtime directory
- Verify all MCP servers can start

## What You Get

Once installed, your IDE agent gains these capabilities via MCP servers:

| Capability | MCP Server | What It Does |
|---|---|---|
| **Persistent Memory** | terminator-memory | Store, search, and retrieve context across sessions |
| **Task Scheduling** | terminator-scheduler | Cron jobs, one-shot tasks, task chains *(Phase 2)* |
| **Communications** | terminator-comms | Send/receive via Telegram, Discord, Slack, Email *(Phase 2)* |
| **Web Browsing** | terminator-browser | Navigate, extract data, monitor pages *(Phase 2)* |
| **Data Processing** | terminator-data | SQLite, CSV, Excel, JSON transforms *(Phase 2)* |
| **File Operations** | terminator-files | Templates, bulk ops, archives *(Phase 2)* |
| **System Integration** | terminator-system | Notifications, clipboard, processes *(Phase 2)* |

Plus **skills** (prompt-based expertise), **agents** (specialized subagents), and **hooks** (event-driven automation).

## Quick Test

After installation, try these prompts in your IDE:

- *"Remember that my preferred communication channel is Telegram and my timezone is UTC+8"*
- *"What do you know about my preferences?"*
- *"What capabilities do you have as a Terminator?"*

## Supported IDEs

| IDE | MCP Servers | System Prompt | UI Extension |
|---|---|---|---|
| **Windsurf** | `.mcp.json` | `.windsurfrules` | *(Phase 5)* |
| **Cursor** | `.cursor/mcp.json` | `.cursorrules` | *(Phase 5)* |
| **Claude Code** | `.mcp.json` | `CLAUDE.md` | N/A (terminal) |
| **Cline** | `.mcp.json` | `.clinerules` | *(Phase 5)* |
| **VS Code + Copilot** | `.mcp.json` | `.github/copilot-instructions.md` | *(Phase 5)* |

## Project Structure

```
terminator-package/
├── TERMINATOR.md              # Master system prompt (the "brain")
├── mcp-servers/               # Local MCP servers
│   └── terminator-memory/     # Persistent memory (Phase 1)
├── skills/                    # Prompt-based skills
├── agents/                    # Subagent definitions
├── hooks/                     # Event-driven automation
├── installer/                 # Cross-IDE installer
├── templates/                 # Workspace templates
├── resources/                 # Guides and references
└── 00.PLAN01/                 # Architecture and planning docs
```

## Configuration

All Terminator runtime state lives in `.terminator/` (gitignored):

```
.terminator/
├── config.json     # User settings
├── memory.db       # Persistent memory database
├── schedules.db    # Scheduled tasks database
└── logs/           # Runtime logs
```

API keys and secrets go in `.env` (gitignored). See `.env.example` for available options.

## License

MIT - see [LICENSE](LICENSE)
