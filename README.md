# Terminator Package

**Transform any agentic IDE into an autonomous AI Worker.**

Terminator brings the high-powered agentic capabilities of coding IDEs (Windsurf, Cursor, Claude Code, Cline, Codex) to **general knowledge work** — research, writing, data analysis, communications, and full autonomous operation with remote control via Telegram, Discord, and Slack.

> **7 MCP servers · 48+ tools · 10 skills · 5 agents · 2 hooks**

---

## One-Prompt Install (Recommended)

### Option 1: NPX Super-Easy Install ⭐ (Fastest)
```bash
npx terminator-ai
```
That's it! This single command will:
- ✅ Detect your IDE automatically (VS Code, Cursor, Windsurf, Claude Code)
- ✅ Download and install all 7 MCP servers with 48+ tools
- ✅ Set up all 10 skills and 5 agents
- ✅ Configure IDE integration
- ✅ Transform your AI agent into Terminator

### Option 2: IDE Agent Install (Easy)
Open your project in an agentic IDE and give this single prompt:

> **"Read the INSTALL section in the README at https://github.com/netflypsb/terminator-package and set up Terminator in this workspace."**

Your AI agent will handle the complete installation automatically. Terminator installs into a hidden `.terminator-package/` folder so your project stays clean.

### Option 3: Manual Install (Advanced)
If you prefer manual installation or need custom configuration:

```bash
# 1. Clone Terminator into a hidden subfolder (keeps your project clean)
git clone https://github.com/netflypsb/terminator-package.git .terminator-package

# 2. Verify Node.js >= 20
node --version

# 3. Install pnpm if not present
npm install -g pnpm

# 4. Install all dependencies (this also rebuilds native SQLite modules)
cd .terminator-package && pnpm install

# 5. Build all MCP servers and packages
pnpm build

# 6. Go back to project root and run the installer
cd .. && node .terminator-package/installer/dist/install.js

# 7. Restart your IDE to pick up MCP server configurations
# 8. Run the doctor to verify everything is healthy
node .terminator-package/installer/dist/doctor.js
```

After installation, **restart your IDE** to load the new MCP server configurations.

The installer automatically:
- Detects **embedded mode** (source in `.terminator-package/`, configs at project root)
- Detects your IDE (Windsurf, Cursor, Claude Code, Cline, VS Code)
- Generates the MCP server configuration (`.mcp.json` or `.cursor/mcp.json`) with paths pointing into `.terminator-package/`
- Generates the IDE-specific system prompt (`.windsurfrules`, `.cursorrules`, `CLAUDE.md`, etc.) with Terminator path awareness
- Creates `.terminator/` runtime directory with default config at project root
- Installs all 10 skills, 5 agents, and 2 hooks
- Sets up a skills index and hooks registry

**Your project directory stays clean** — only these hidden items are added:
- `.terminator-package/` — Terminator source (hidden folder)
- `.terminator/` — Runtime state (hidden folder)
- `.mcp.json` — MCP server config (hidden file)
- `.windsurfrules` / `.cursorrules` / etc. — IDE system prompt (hidden file)
- `.env` — API keys (optional, hidden file)

### Verify Installation

```bash
node .terminator-package/installer/dist/doctor.js
```

You should see `20+ passed, 0 failed — HEALTHY`.

### Alternative: Standalone Install

If you want Terminator as the project root (e.g., for a dedicated worker workspace):

```bash
git clone https://github.com/netflypsb/terminator-package.git my-workspace
cd my-workspace
pnpm install && pnpm build
node installer/dist/install.js
```

---

## What You Get

Once installed, your IDE agent becomes **Terminator** — a fully capable autonomous knowledge worker with these capabilities:

### MCP Servers (48+ tools)

| Capability | MCP Server | Tools | What It Does |
|---|---|---|---|
| **Persistent Memory** | terminator-memory | 6 | Store, search, retrieve context across sessions |
| **Communications** | terminator-comms | 12 | Telegram, Discord, Slack, Email, Webhooks |
| **Web Browsing** | terminator-browser | 4 | Fetch pages, extract data, search, monitor changes |
| **Data Processing** | terminator-data | 5 | SQLite queries, CSV read/write, statistics |
| **File Operations** | terminator-files | 7 | Templates, bulk rename, archives, scaffolding |
| **Office Documents** | terminator-office | 20+ | Word, Excel, PowerPoint, PDF creation, analysis, conversion |
| **System Integration** | terminator-system | 7 | Notifications, clipboard, processes, system info |

### Skills (prompt-based expertise)

| Skill | What It Does |
|---|---|
| **research** | Web research, multi-source gathering, synthesis |
| **writing** | Documents, reports, articles, editing |
| **analysis** | Data analysis, pattern finding, statistics |
| **communication** | Drafting and sending messages across channels |
| **coding** | Software development, debugging, testing |
| **summarize** | Condensing documents, pages, conversations |
| **office-documents** | Word, Excel, PowerPoint, PDF lifecycle management |
| **office-automation** | Document workflows, recurring report generation |
| **onboarding** | Guiding new users through capabilities |
| **terminator-expert** | Expert knowledge of Terminator setup, config, troubleshooting |

### Agents (specialized subagents)

| Agent | Role |
|---|---|
| **researcher** | Deep multi-source research with synthesis |
| **writer** | Long-form content creation |
| **analyst** | Data analysis and statistics |
| **communicator** | Cross-channel messaging |
| **supervisor** | Coordinates multi-domain tasks across agents |

### Hooks & Automation

| Hook | Trigger | Action |
|---|---|---|
| **on-workspace-open** | IDE session starts | Load context, initialize workspace |
| **on-message-received** | Message arrives | Parse remote commands, respond |

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
"What capabilities do you have as a Terminator?"
```

---

## Remote Control

Control Terminator from your phone via Telegram, Discord, or Slack:

| Command | Action |
|---|---|
| `/status` | Get current status |
| `/tasks` | List active tasks |
| `/do <instruction>` | Execute any instruction |
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
│   ├── terminator-comms/          # Messaging (Telegram, Discord, Slack, Email)
│   ├── terminator-browser/        # Web browsing and extraction
│   ├── terminator-data/           # SQL, CSV, statistics
│   ├── terminator-files/          # File operations and templates
│   ├── terminator-office/         # Office document management
│   └── terminator-system/         # System integration
├── skills/                        # 10 prompt-based skills
├── agents/                        # 5 specialized subagents
├── workflows/                     # Event-driven automation
│   ├── on-workspace-open.json
│   └── on-message-received.json
├── installer/                     # Cross-IDE installer & doctor
├── templates/                     # 5 workspace templates
├── resources/                     # Guides and documentation
│   └── guides/
└── .terminator/                   # Runtime state (gitignored)
    ├── config.json
    ├── memory.db
    └── logs/
```

---

## Configuration

### Runtime State

All runtime state lives in `.terminator/` (gitignored, created by installer):
- `config.json` - Runtime configuration
- `memory.db` - Persistent memory SQLite database
- `hooks-registry.json` - Registered hooks
- `skills-index.json` - Skills metadata

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
# Embedded mode
node .terminator-package/installer/dist/uninstall.js

# Standalone mode
node installer/dist/uninstall.js
```

This removes generated config files (`.mcp.json`, system prompt files, `.terminator/`) but leaves your source code and `.terminator-package/` intact. Delete `.terminator-package/` manually for full removal.

---

## Troubleshooting

### Common Issues

**Problem**: Terminator not responding after installation.

**Solution**: 
1. Restart your IDE to load MCP configurations
2. Run `node .terminator-package/installer/dist/doctor.js` to check health
3. Check that `.mcp.json` exists and is properly configured

**Problem**: MCP servers not loading.

**Solution**: 
1. Verify Node.js >= 20 is installed
2. Check that all MCP servers are built in `.terminator-package/mcp-servers/*/dist/`
3. Rebuild with `cd .terminator-package && pnpm build`

---

## License

MIT — see [LICENSE](LICENSE)

---

## Contributing

Contributions welcome! This is an open-source project. See the architecture docs in `00.PLAN01/` for design details.
