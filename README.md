# Terminator Package

**Transform any agentic IDE into an autonomous AI Worker.**

Terminator brings the high-powered agentic capabilities of coding IDEs (Windsurf, Cursor, Claude Code, Cline, Codex) to **general knowledge work** — research, writing, data analysis, communications, scheduling, and full autonomous operation with remote control via Telegram, Discord, and Slack.

> **8 MCP servers · 68+ tools · 12 skills · 6 agents · 3 hooks · 3 task chains**

---

## One-Prompt Install

Open your project in an agentic IDE and give this single prompt:

> **"Read the INSTALL section in the README at https://github.com/netflypsb/terminator-package and set up Terminator in this workspace."**

That's it. Your AI agent will handle the rest. Terminator installs into a hidden `.terminator-package/` folder so your project stays clean.

### INSTALL

These are the exact steps the AI agent (or you) should follow to add Terminator to an **existing project**:

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
cd ..
node .terminator-package/installer/dist/install.js

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
- Installs all 10 skills, 6 agents, and 3 hooks
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

You should see `22+ passed, 0 failed — HEALTHY`.

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
| **Task Scheduling** | terminator-scheduler | 11 | Cron jobs, one-shot tasks, multi-step chains |
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
| **planning** | Project plans, task breakdowns, scheduling |
| **automation** | Schedules, hooks, recurring workflows |
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
# Embedded mode
node .terminator-package/installer/dist/uninstall.js

# Standalone mode
node installer/dist/uninstall.js
```

This removes generated config files (`.mcp.json`, system prompt files, `.terminator/`) but leaves your source code and `.terminator-package/` intact. Delete `.terminator-package/` manually for full removal.

---

## Troubleshooting

### Scheduled Tasks Not Running

**Problem**: You scheduled a task but it didn't execute at the scheduled time.

**Cause**: The Terminator scheduler stores tasks but requires an active agent session to execute them. Tasks are passive — they wait for `schedule_check_pending` to be called.

**Solutions**:
1. **Manual check**: Run `/hooks-schedule` (in Windsurf) or ask your agent to "check pending scheduled tasks"
2. **On startup**: The `on-workspace-open` hook automatically calls `schedule_check_pending` when you start a session
3. **Extension polling**: If using the VS Code extension with autonomous mode enabled, it will poll for pending tasks every minute
4. **Agent instruction**: When you see pending tasks, the agent must ACT on them — not just acknowledge they exist

### Terminator UI Not Visible in VS Code Forks (Windsurf, Antigravity, etc.)

**Problem**: The Terminator panel appears in VS Code but not in other IDEs like Windsurf or Antigravity.

**Cause**: VS Code extensions must be installed separately in each IDE. The `.vsix` file needs to be installed in each IDE individually.

**Solutions**:
1. **Install the extension in each IDE**:
   ```bash
   # Build the extension
   cd extensions/terminator-panel
   npm run build
   npm run package
   
   # Install in each IDE
   # Windsurf: Code → Preferences → Extensions → Install from VSIX
   # Antigravity: Similar process
   ```

2. **Verify extension compatibility**: The extension now supports VS Code 1.70+ with multiple activation events

3. **Check activation**: The extension activates on:
   - `onStartupFinished`
   - `onCommand:terminator.openPanel`
   - `onView:terminator.panel`

4. **Manual activation**: Use command palette → "Terminator: Open Panel"

### Extension Panel Shows But Empty

**Cause**: The extension webview requires the build output (`dist/webview.js` and `dist/webview.css`).

**Fix**: Rebuild the extension:
```bash
cd extensions/terminator-panel
npm install
npm run build
```

---

## License

MIT — see [LICENSE](LICENSE)

---

## Contributing

Contributions welcome! This is an open-source project. See the architecture docs in `00.PLAN01/` for design details.
