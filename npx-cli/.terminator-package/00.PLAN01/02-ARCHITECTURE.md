# Terminator Package — Architecture Design

## Recommended Architecture: "Layered Package" Approach

After researching MCP, Claude Plugins, OpenClaw, and cross-IDE compatibility, the recommended architecture is a **GitHub-distributed layered package** — not a single plugin or extension, but a composable repository that contains MCP servers, skills, agents, hooks, a VS Code extension, and an intelligent installer that adapts to whatever IDE the user runs.

### Why This Approach Wins

| Alternative | Pros | Cons | Verdict |
|---|---|---|---|
| **Claude Plugin only** | Native packaging, marketplace distribution | Claude Code-only, excludes Windsurf/Cursor/Cline | Too narrow |
| **VS Code Extension only** | Great UI, broad IDE support | Can't bundle MCP servers, skills, or agents natively | Too limited |
| **MCP Server only** | Universal compatibility | No UI, no skills, no automation hooks | Too bare |
| **GitHub Package (recommended)** | Contains ALL of the above, universal, one-prompt install | Requires an installer script | Best of all worlds |

The GitHub Package approach lets us ship everything — MCP servers, skills, agents, hooks, a VS Code extension, prompt templates, and an installer — in a single repo that the IDE agent can analyze and install with one prompt.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER                    │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │  VS Code Extension  │  │  IDE Native Chat Interface   │  │
│  │  (Terminator Panel) │  │  (Windsurf/Cursor/Claude)    │  │
│  │  - Task Dashboard   │  │  - Full agent capabilities   │  │
│  │  - Schedule Manager │  │  - Direct skill invocation   │  │
│  │  - Comm Channels    │  │  - MCP tool access           │  │
│  │  - Settings UI      │  │                              │  │
│  └─────────┬───────────┘  └──────────────┬───────────────┘  │
│            │                              │                  │
├────────────┴──────────────────────────────┴──────────────────┤
│                   INTELLIGENCE LAYER                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │    Skills     │ │    Agents    │ │   TERMINATOR.md      │ │
│  │  (SKILL.md)  │ │  (agent.md)  │ │  (Master System      │ │
│  │              │ │              │ │   Prompt)             │ │
│  │ - Research   │ │ - Researcher │ │                      │ │
│  │ - Writing    │ │ - Writer     │ │  Injected into every │ │
│  │ - Analysis   │ │ - Analyst    │ │  session, defines    │ │
│  │ - Comms      │ │ - Scheduler  │ │  Terminator persona  │ │
│  │ - Planning   │ │ - Comms      │ │  and capabilities    │ │
│  └──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘ │
│         │                │                     │             │
├─────────┴────────────────┴─────────────────────┴─────────────┤
│                   AUTOMATION LAYER                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │    Hooks      │ │  Scheduler   │ │  Event Triggers      │ │
│  │              │ │  (Cron MCP)  │ │                      │ │
│  │ - on_save    │ │              │ │  - File watchers     │ │
│  │ - on_commit  │ │ - Recurring  │ │  - Webhook listeners │ │
│  │ - on_error   │ │ - One-shot   │ │  - Channel messages  │ │
│  │ - on_message │ │ - Chains     │ │  - System events     │ │
│  └──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘ │
│         │                │                     │             │
├─────────┴────────────────┴─────────────────────┴─────────────┤
│                   CAPABILITY LAYER (MCP Servers)              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │  Memory    │ │  Scheduler │ │  Comms     │ │  Browser  │ │
│  │  Server    │ │  Server    │ │  Bridge    │ │  Server   │ │
│  │           │ │           │ │  Server    │ │           │ │
│  │ -Store/   │ │ -Cron jobs│ │           │ │ -Navigate │ │
│  │  Retrieve │ │ -Timers   │ │ -Telegram  │ │ -Extract  │ │
│  │ -Search   │ │ -Chains   │ │ -Discord   │ │ -Fill     │ │
│  │ -Context  │ │ -Queues   │ │ -Slack     │ │ -Screenshot│ │
│  └────────────┘ └────────────┘ │ -Email    │ └───────────┘ │
│  ┌────────────┐ ┌────────────┐ │ -Webhooks │ ┌───────────┐ │
│  │  File Mgr  │ │  Data      │ └────────────┘ │  System   │ │
│  │  Server    │ │  Server    │                 │  Server   │ │
│  │           │ │           │                 │           │ │
│  │ -Advanced │ │ -SQLite   │                 │ -Process  │ │
│  │  file ops │ │ -JSON DB  │                 │ -Env      │ │
│  │ -Templates│ │ -CSV/Excel│                 │ -Notify   │ │
│  │ -Workspace│ │ -Transform│                 │ -Clipboard│ │
│  └────────────┘ └────────────┘                 └───────────┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                   FOUNDATION LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  IDE Agent Runtime (Windsurf / Cursor / Claude Code /    ││
│  │  Cline / VS Code + Copilot / Codex)                     ││
│  │                                                          ││
│  │  Provides: LLM inference, file system, terminal,         ││
│  │  MCP client, extension host, workspace management        ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Foundation Layer (Provided by the IDE)

The IDE already provides:
- LLM inference (Claude, GPT, Gemini, etc. depending on IDE)
- File system read/write
- Terminal/shell command execution
- MCP client (connects to our MCP servers)
- Extension host (runs our VS Code extension)
- Workspace management

**Terminator adds no runtime here** — it leverages what exists.

### 2. Capability Layer (MCP Servers)

Local MCP servers are the **core capability engine**. They use **stdio transport** (no network dependency) and are written in **TypeScript** (Node.js) for maximum portability.

| MCP Server | Purpose | Key Tools |
|---|---|---|
| **terminator-memory** | Persistent memory across sessions | `memory_store`, `memory_search`, `memory_retrieve`, `memory_context` |
| **terminator-scheduler** | Task scheduling and automation | `schedule_create`, `schedule_list`, `schedule_cancel`, `schedule_chain` |
| **terminator-comms** | Communication bridge | `telegram_send`, `discord_send`, `slack_send`, `email_send`, `webhook_fire` |
| **terminator-browser** | Enhanced web browsing | `browse_url`, `extract_data`, `fill_form`, `screenshot`, `monitor_page` |
| **terminator-data** | Data processing | `db_query`, `csv_process`, `json_transform`, `excel_read`, `data_analyze` |
| **terminator-files** | Advanced file operations | `template_render`, `bulk_rename`, `archive_create`, `workspace_scaffold` |
| **terminator-system** | System integration | `notify_desktop`, `clipboard_read`, `process_list`, `env_manage` |

Each MCP server:
- Is a standalone Node.js program
- Communicates via stdio (JSON-RPC 2.0)
- Has its own `package.json` with dependencies
- Is configured in `.mcp.json` (auto-generated by installer)

### 3. Automation Layer

#### Hooks
Event-driven triggers that fire on specific IDE events:
- `on_file_save` — run linting, formatting, or analysis
- `on_workspace_open` — load context, check schedules
- `on_error` — auto-diagnose and attempt fix
- `on_message_received` — process incoming Telegram/Discord messages
- `on_schedule_trigger` — execute scheduled tasks

#### Scheduler (via MCP Server)
- Cron-style recurring tasks
- One-shot delayed tasks  
- Task chains (do X, then Y, then Z)
- Persisted to local SQLite database
- Survives IDE restarts

#### Event Triggers
- File system watchers (new files, changes)
- Webhook listeners (receive external events)
- Channel message listeners (Telegram commands, etc.)

### 4. Intelligence Layer

#### TERMINATOR.md (Master System Prompt)
The master prompt file injected into every agent session. It:
- Defines the Terminator persona and capabilities
- Lists all available MCP tools and when to use them
- Provides workflow guidance for common tasks
- Sets behavioral rules (autonomous vs. interactive mode)
- Is the equivalent of `CLAUDE.md` / `AGENTS.md` / `.cursorrules`

#### Skills (Markdown-based)
Each skill is a `SKILL.md` file providing expertise for a specific domain:

```
skills/
├── research/SKILL.md          # Web research and synthesis
├── writing/SKILL.md           # Document writing and editing
├── analysis/SKILL.md          # Data analysis workflows
├── communication/SKILL.md     # Drafting messages, emails
├── planning/SKILL.md          # Project planning and task breakdown
├── automation/SKILL.md        # Setting up schedules and hooks
├── coding/SKILL.md            # Enhanced coding workflows
└── custom/                    # User-created skills
```

#### Agents (Subagent Definitions)
Specialized agent configurations for complex multi-step tasks:

```
agents/
├── researcher.md              # Deep research agent
├── writer.md                  # Long-form content agent
├── analyst.md                 # Data analysis agent
├── scheduler.md               # Autonomous task management agent
├── communicator.md            # Cross-channel communication agent
└── custom/                    # User-created agents
```

### 5. UI Layer (VS Code Extension)

The **Terminator Panel** extension provides a clean interface for non-developers:

- **Task Dashboard** — view active tasks, scheduled jobs, recent completions
- **Schedule Manager** — create/edit/delete scheduled tasks via UI
- **Communication Hub** — view/manage connected channels (Telegram, Discord, etc.)
- **Memory Browser** — search and manage persistent memory
- **Settings** — configure MCP servers, API keys, preferences
- **Quick Actions** — one-click buttons for common tasks
- **Status Bar** — shows Terminator status, active tasks, next scheduled run

The extension communicates with MCP servers and the IDE agent via:
- VS Code extension API
- Direct MCP server communication
- Workspace file read/write

---

## Data Flow Examples

### Example 1: User Prompts "Research competitors and email me a summary"

```
User Prompt → IDE Agent
  → Agent reads TERMINATOR.md (knows capabilities)
  → Agent invokes research skill
  → Agent uses terminator-browser MCP to browse competitor sites
  → Agent uses terminator-data MCP to organize findings
  → Agent uses terminator-memory MCP to store research
  → Agent uses writing skill to draft summary
  → Agent uses terminator-comms MCP to send email
  → Agent updates task dashboard via workspace files
```

### Example 2: Scheduled Autonomous Task "Check website every hour"

```
User sets schedule via UI panel or prompt
  → terminator-scheduler MCP creates cron job
  → Every hour: scheduler triggers IDE agent
  → Agent uses terminator-browser MCP to check website
  → Agent uses terminator-memory MCP to compare with last check
  → If changes detected: agent uses terminator-comms MCP to notify via Telegram
  → Task dashboard shows last run status
```

### Example 3: Remote Command via Telegram "Send me the project status"

```
Telegram message received
  → terminator-comms MCP processes incoming message
  → Hook fires: on_message_received
  → Agent reads workspace context
  → Agent generates project status summary
  → Agent uses terminator-comms MCP to reply via Telegram
```

---

## Cross-IDE Compatibility Strategy

### Universal Components (Work Everywhere)
- MCP servers (all IDEs support MCP)
- Skill markdown files (all IDEs can read files and use them as context)
- Agent markdown files (same as above)
- TERMINATOR.md system prompt

### IDE-Specific Configurations (Auto-Generated)

| IDE | System Prompt | MCP Config | Skills Location | Extension |
|---|---|---|---|---|
| **Windsurf** | `.windsurfrules` | `.mcp.json` | `.windsurf/workflows/` | VS Code ext |
| **Cursor** | `.cursorrules` | `.cursor/mcp.json` | `.cursor/rules/` | VS Code ext |
| **Claude Code** | `CLAUDE.md` | `.mcp.json` | `.claude/skills/` | N/A (terminal) |
| **Cline** | `.clinerules` | `.mcp.json` | `.cline/` | VS Code ext |
| **VS Code + Copilot** | `.github/copilot-instructions.md` | `.mcp.json` | `.vscode/` | VS Code ext |

The installer detects the IDE and generates the appropriate config files.

---

## Security Model

1. **Local-first** — all MCP servers run locally via stdio, no data leaves the machine by default
2. **Explicit opt-in for comms** — Telegram/Discord/Slack connections require user-configured API keys
3. **Sandboxed MCP servers** — each server has minimal permissions, only accesses what it needs
4. **No hardcoded API keys** — all secrets stored in `.env` file (gitignored) or system keychain
5. **User approval for destructive actions** — file deletion, sending messages, etc. require confirmation unless in autonomous mode
6. **Autonomous mode requires explicit activation** — not enabled by default
