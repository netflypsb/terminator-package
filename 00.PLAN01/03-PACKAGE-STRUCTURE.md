# Terminator Package — Repository & Package Structure

## Top-Level Repository Structure

```
terminator-package/
│
├── README.md                          # User-facing docs, one-prompt install instructions
├── TERMINATOR.md                      # Master system prompt (the "brain" of Terminator)
├── LICENSE                            # Open source license (MIT recommended)
├── package.json                       # Root package.json for monorepo management
├── pnpm-workspace.yaml                # pnpm workspace config (monorepo)
├── tsconfig.base.json                 # Shared TypeScript config
├── .env.example                       # Template for API keys and secrets
├── .gitignore                         # Standard ignores + .env, node_modules, .terminator/
│
├── installer/                         # Cross-IDE installer and setup system
│   ├── install.ts                     # Main installer script (detects IDE, configures everything)
│   ├── detect-ide.ts                  # IDE detection logic
│   ├── configure-mcp.ts              # Generates .mcp.json for detected IDE
│   ├── configure-prompts.ts          # Generates IDE-specific prompt files
│   ├── configure-extension.ts        # Installs VS Code extension if applicable
│   ├── setup-env.ts                  # Interactive .env setup (API keys)
│   ├── doctor.ts                     # Diagnostic tool (checks health of installation)
│   └── uninstall.ts                  # Clean removal
│
├── mcp-servers/                       # Local MCP servers (the capability engine)
│   ├── terminator-memory/             # Persistent memory & context
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # MCP server entry point
│   │   │   ├── memory-store.ts       # SQLite-backed memory storage
│   │   │   ├── search.ts             # Semantic search over memories
│   │   │   └── context.ts            # Session context management
│   │   └── README.md
│   │
│   ├── terminator-scheduler/          # Task scheduling & automation
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # MCP server entry point
│   │   │   ├── cron.ts               # Cron-style recurring tasks
│   │   │   ├── queue.ts              # Task queue management
│   │   │   ├── chains.ts             # Task chain execution
│   │   │   └── persistence.ts        # SQLite task persistence
│   │   └── README.md
│   │
│   ├── terminator-comms/              # Communication bridge
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # MCP server entry point
│   │   │   ├── telegram.ts           # Telegram bot integration
│   │   │   ├── discord.ts            # Discord bot integration
│   │   │   ├── slack.ts              # Slack integration
│   │   │   ├── email.ts              # Email (SMTP/IMAP) integration
│   │   │   ├── webhook.ts            # Webhook sender/receiver
│   │   │   └── router.ts             # Message routing logic
│   │   └── README.md
│   │
│   ├── terminator-browser/            # Enhanced web browsing
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # MCP server entry point
│   │   │   ├── browse.ts             # URL navigation and content extraction
│   │   │   ├── extract.ts            # Structured data extraction
│   │   │   ├── monitor.ts            # Page change monitoring
│   │   │   └── screenshot.ts         # Page screenshots
│   │   └── README.md
│   │
│   ├── terminator-data/               # Data processing & storage
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # MCP server entry point
│   │   │   ├── sqlite.ts             # SQLite database operations
│   │   │   ├── csv.ts                # CSV read/write/transform
│   │   │   ├── excel.ts              # Excel read/write
│   │   │   ├── json-db.ts            # JSON document store
│   │   │   └── transform.ts          # Data transformation utilities
│   │   └── README.md
│   │
│   ├── terminator-files/              # Advanced file operations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # MCP server entry point
│   │   │   ├── templates.ts          # Template rendering (Handlebars/Mustache)
│   │   │   ├── bulk-ops.ts           # Bulk rename, move, copy
│   │   │   ├── archive.ts            # ZIP/TAR creation and extraction
│   │   │   └── workspace.ts          # Workspace scaffolding
│   │   └── README.md
│   │
│   └── terminator-system/             # System integration
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts              # MCP server entry point
│       │   ├── notify.ts             # Desktop notifications
│       │   ├── clipboard.ts          # Clipboard read/write
│       │   ├── process.ts            # Process management
│       │   └── env.ts                # Environment variable management
│       └── README.md
│
├── skills/                            # Prompt-based skills (SKILL.md files)
│   ├── research/
│   │   └── SKILL.md                  # Web research and synthesis skill
│   ├── writing/
│   │   └── SKILL.md                  # Document writing and editing skill
│   ├── analysis/
│   │   └── SKILL.md                  # Data analysis workflows
│   ├── communication/
│   │   └── SKILL.md                  # Message/email drafting skill
│   ├── planning/
│   │   └── SKILL.md                  # Project planning and task breakdown
│   ├── automation/
│   │   └── SKILL.md                  # Setting up schedules and automation
│   ├── coding/
│   │   └── SKILL.md                  # Enhanced coding workflows
│   ├── summarize/
│   │   └── SKILL.md                  # Summarization across formats
│   └── onboarding/
│       └── SKILL.md                  # Guide new users through setup
│
├── agents/                            # Subagent definitions
│   ├── researcher.md                  # Deep research agent (browser + memory)
│   ├── writer.md                      # Long-form content agent
│   ├── analyst.md                     # Data analysis agent (data + files)
│   ├── scheduler.md                   # Autonomous task management agent
│   ├── communicator.md                # Cross-channel communication agent
│   └── supervisor.md                  # Meta-agent that coordinates other agents
│
├── hooks/                             # Event-driven automation definitions
│   ├── on-workspace-open.ts          # Load context on workspace open
│   ├── on-schedule-trigger.ts        # Handle scheduled task execution
│   ├── on-message-received.ts        # Process incoming channel messages
│   └── README.md                      # How to create custom hooks
│
├── extensions/                        # VS Code extension (Terminator Panel)
│   └── terminator-panel/
│       ├── package.json               # Extension manifest
│       ├── tsconfig.json
│       ├── src/
│       │   ├── extension.ts           # Extension entry point
│       │   ├── panel/
│       │   │   ├── TerminatorPanel.ts # Main webview panel
│       │   │   └── webview/           # React-based UI
│       │   │       ├── App.tsx
│       │   │       ├── components/
│       │   │       │   ├── Dashboard.tsx
│       │   │       │   ├── ScheduleManager.tsx
│       │   │       │   ├── CommHub.tsx
│       │   │       │   ├── MemoryBrowser.tsx
│       │   │       │   ├── Settings.tsx
│       │   │       │   └── QuickActions.tsx
│       │   │       └── styles/
│       │   ├── statusbar/
│       │   │   └── StatusBar.ts       # Status bar integration
│       │   └── commands/
│       │       └── commands.ts        # VS Code command palette commands
│       ├── media/                     # Icons and assets
│       └── README.md
│
├── templates/                         # Workspace templates for different work types
│   ├── general-work/                  # General knowledge work workspace
│   │   ├── .terminator-workspace.json
│   │   └── README.md
│   ├── research-project/              # Research-focused workspace
│   │   ├── .terminator-workspace.json
│   │   └── README.md
│   ├── content-creation/              # Writing and content workspace
│   │   ├── .terminator-workspace.json
│   │   └── README.md
│   ├── data-analysis/                 # Data analysis workspace
│   │   ├── .terminator-workspace.json
│   │   └── README.md
│   └── autonomous-worker/             # Always-on autonomous workspace
│       ├── .terminator-workspace.json
│       └── README.md
│
├── resources/                         # Reference materials and databases
│   ├── prompt-library/                # Curated prompt templates
│   │   ├── research-prompts.md
│   │   ├── writing-prompts.md
│   │   └── analysis-prompts.md
│   └── guides/
│       ├── getting-started.md
│       ├── custom-skills.md
│       ├── custom-mcp-servers.md
│       ├── autonomous-mode.md
│       └── remote-control.md
│
├── config/                            # Default configuration files
│   ├── default-settings.json          # Default Terminator settings
│   ├── mcp-servers.json               # MCP server registry (what's available)
│   └── ide-templates/                 # IDE-specific config templates
│       ├── windsurf/
│       │   ├── .windsurfrules.template
│       │   └── .mcp.json.template
│       ├── cursor/
│       │   ├── .cursorrules.template
│       │   └── mcp.json.template
│       ├── claude-code/
│       │   ├── CLAUDE.md.template
│       │   └── .mcp.json.template
│       ├── cline/
│       │   ├── .clinerules.template
│       │   └── .mcp.json.template
│       └── vscode/
│           ├── copilot-instructions.md.template
│           └── .mcp.json.template
│
└── .terminator/                       # Generated at install time (gitignored)
    ├── config.json                    # User's Terminator configuration
    ├── state.json                     # Runtime state (active tasks, etc.)
    ├── memory.db                      # SQLite memory database
    ├── schedules.db                   # SQLite scheduler database
    └── logs/                          # Runtime logs
```

---

## Key Configuration Files

### `.mcp.json` (Generated by Installer)

```json
{
  "mcpServers": {
    "terminator-memory": {
      "command": "node",
      "args": ["./mcp-servers/terminator-memory/dist/index.js"],
      "env": {
        "DB_PATH": "./.terminator/memory.db"
      }
    },
    "terminator-scheduler": {
      "command": "node",
      "args": ["./mcp-servers/terminator-scheduler/dist/index.js"],
      "env": {
        "DB_PATH": "./.terminator/schedules.db"
      }
    },
    "terminator-comms": {
      "command": "node",
      "args": ["./mcp-servers/terminator-comms/dist/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "${TELEGRAM_BOT_TOKEN}",
        "DISCORD_BOT_TOKEN": "${DISCORD_BOT_TOKEN}"
      }
    },
    "terminator-browser": {
      "command": "node",
      "args": ["./mcp-servers/terminator-browser/dist/index.js"]
    },
    "terminator-data": {
      "command": "node",
      "args": ["./mcp-servers/terminator-data/dist/index.js"],
      "env": {
        "DB_PATH": "./.terminator/data.db"
      }
    },
    "terminator-files": {
      "command": "node",
      "args": ["./mcp-servers/terminator-files/dist/index.js"]
    },
    "terminator-system": {
      "command": "node",
      "args": ["./mcp-servers/terminator-system/dist/index.js"]
    }
  }
}
```

### `TERMINATOR.md` (Master System Prompt — excerpt)

```markdown
# Terminator — AI Worker System Prompt

You are **Terminator**, an AI Worker powered by the Terminator Package. You are not just 
a coding assistant — you are a fully capable knowledge worker that can perform any complex 
task using the tools and capabilities installed in this workspace.

## Your Capabilities

### MCP Tools Available
- **Memory**: Store, search, and retrieve persistent context across sessions
- **Scheduler**: Create cron jobs, one-shot tasks, and task chains
- **Communications**: Send/receive via Telegram, Discord, Slack, Email
- **Browser**: Navigate web, extract data, monitor pages, take screenshots
- **Data**: Query databases, process CSV/Excel, transform JSON
- **Files**: Render templates, bulk operations, create archives
- **System**: Desktop notifications, clipboard, process management

### Skills Available
Use /research, /write, /analyze, /communicate, /plan, /automate, /code

### Agents Available
Delegate to: @researcher, @writer, @analyst, @scheduler, @communicator

## Behavioral Rules
1. Always check memory for relevant context before starting a task
2. Store important findings and decisions in memory
3. When creating recurring work, offer to set up a schedule
4. When work is complete, offer to notify the user via their preferred channel
5. In autonomous mode, proceed without confirmation unless destructive
6. Always update the task dashboard after completing work
```

### `.terminator-workspace.json` (Workspace Template Config)

```json
{
  "name": "My Project",
  "type": "general-work",
  "created": "2026-03-31T00:00:00Z",
  "settings": {
    "autonomousMode": false,
    "defaultChannel": "telegram",
    "memoryEnabled": true,
    "schedulerEnabled": true
  },
  "activeMcpServers": [
    "terminator-memory",
    "terminator-scheduler",
    "terminator-comms",
    "terminator-browser",
    "terminator-data",
    "terminator-files",
    "terminator-system"
  ],
  "activeSkills": ["research", "writing", "analysis", "communication", "planning"],
  "activeAgents": ["researcher", "writer", "analyst"]
}
```
