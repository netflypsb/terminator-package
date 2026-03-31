# Terminator Package — Research Findings

## 1. Model Context Protocol (MCP)

**Source**: https://modelcontextprotocol.io/docs/getting-started/intro

### What It Is
MCP is an open-source standard for connecting AI applications to external systems — "USB-C for AI applications." It provides a standardized way for AI agents to access data sources, tools, and workflows.

### Key Architecture
- **Client-Server model**: An MCP Host (the IDE) creates MCP Clients that connect to MCP Servers
- **Two transports**: 
  - **Stdio** — local process communication (no network overhead, ideal for local MCP servers)
  - **Streamable HTTP** — remote servers over HTTP with SSE streaming
- **Three primitives**:
  - **Tools** — executable functions the AI can invoke (file ops, API calls, DB queries)
  - **Resources** — data sources for context (files, DB records, API responses)
  - **Prompts** — reusable templates for structured interactions

### Why It Matters for Terminator
- **Universal support**: All major agentic IDEs support MCP (Windsurf, Cursor, Claude Code, Cline, VS Code + Copilot, etc.)
- **Language agnostic**: MCP servers can be built in TypeScript, Python, Rust, Go, etc.
- **Local-first**: Stdio transport means zero network dependency for core features
- **Composable**: Multiple MCP servers can run simultaneously, each providing different capabilities
- **Standard configuration**: `.mcp.json` or `settings.json` — IDEs auto-discover and connect

### Implication for Terminator
MCP servers should be the **primary capability delivery mechanism** for Terminator. They are the one technology that works across ALL agentic IDEs. Every core capability (scheduling, memory, file management, communications, browser control) should be an MCP server.

---

## 2. Claude Plugins Architecture

**Sources**: Claude Code official docs, DeepWiki analysis, systemprompt.io comparison guide, Dean Blank's mental model article

### Three Extension Mechanisms in Claude Code

| Mechanism | What It Is | Built By | Language | Best For |
|---|---|---|---|---|
| **Plugins** | Packaged extensions from marketplace | Plugin authors | Any (packaged) | Pre-built solutions, distribution |
| **MCP Servers** | Protocol-based tool servers | Your team | Any | Custom integrations, APIs |
| **Skills** | Slash commands from markdown | Anyone | Markdown only | Team workflows, prompt templates |

### Plugin Structure (Claude Code)
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Manifest (name, version, description)
├── commands/                # Slash commands
├── agents/                  # Subagent definitions
├── skills/                  # SKILL.md files
├── hooks/                   # Event-driven automation
└── mcp-servers/             # Bundled MCP servers
```

### Key Plugin Concepts
- **plugin.json** manifest defines metadata and capabilities
- **${CLAUDE_PLUGIN_ROOT}** provides portable path references
- **Auto-discovery** mechanism finds components in standard directories
- Plugins can bundle: tools, prompts, skills, MCP servers, hooks, agents
- Install via `/install` command or `--plugin-dir ./path`
- Can be distributed via marketplace or private git repos
- Plugins namespace their components to avoid collisions

### Skills System
- Markdown files in `.claude/skills/<skill-name>/SKILL.md`
- Define slash commands that expand into prompts
- Support `$ARGUMENTS` placeholder for user input
- Support YAML frontmatter for configuration (auto-invocation, context forking, etc.)
- Can be committed to project repo = shared with team
- **No code required** — most accessible extension mechanism

### Agents / Subagents
- Separate Claude instances running in their own context windows
- Prevent context window bloat in the main session
- Defined as markdown files in `.claude/agents/`
- YAML frontmatter specifies: name, description, tools, model, skills
- Can be injected with skills via `skills:` frontmatter field
- **Agent Teams** (experimental) — multiple agents that communicate and coordinate

### Hooks System
- Event-driven automation triggers
- Can respond to file changes, commands, time-based events
- Configured in plugin manifest or project settings

### Implication for Terminator
The Claude Code plugin format is the **most sophisticated packaging format** available. However, it is currently Claude Code-specific. Terminator should:
1. Use **MCP servers** as the universal capability layer (works everywhere)
2. Use **Skills/Agents** in formats compatible with multiple IDEs (`.claude/`, `.cursor/`, `.agents/`)  
3. Provide a **plugin wrapper** for Claude Code users that bundles everything
4. Provide equivalent configurations for other IDEs (Windsurf, Cursor, etc.)

---

## 3. Gemini Discussion

**Source**: https://gemini.google.com/share/d622562e08e7 (requires sign-in, content not directly accessible)

Based on the prompt.md context, the discussion covered:
- Combining Claude Cowork capabilities with Openclaw autonomous agent patterns
- Creating a distributable package that works across agentic IDEs
- Using workspace-based workflow as the organizational paradigm
- Making the package installable via a single prompt to the IDE agent
- Extensibility through MCP servers, skills, and modular components

---

## 4. OpenClaw Architecture

**Source**: https://github.com/openclaw/openclaw (342k+ stars)

### What It Is
OpenClaw is an open-source personal AI assistant that runs on your own devices. It's a gateway-based system that connects to messaging channels (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, etc.) and provides autonomous AI capabilities.

### Architecture
```
Messaging Channels (WhatsApp/Telegram/Slack/Discord/etc.)
         │
         ▼
┌─────────────────────────────┐
│        Gateway              │
│    (control plane)          │
│  ws://127.0.0.1:18789      │
└─────────────┬───────────────┘
              │
              ├── Pi agent (RPC)
              ├── CLI (openclaw ...)
              ├── WebChat UI
              ├── macOS app
              └── iOS / Android nodes
```

### Key Features
- **Local-first Gateway** — single control plane for sessions, channels, tools, events
- **Multi-channel inbox** — 25+ messaging platforms supported
- **Multi-agent routing** — route channels/accounts to isolated agents
- **Skills platform** — bundled, managed, and workspace skills
- **Cron + automation** — scheduled tasks, webhooks, event-driven automation
- **Browser control** — can browse web, fill forms, extract data
- **Full system access** — file I/O, shell commands, scripts
- **Persistent memory** — remembers context across sessions
- **Companion apps** — macOS menu bar, iOS/Android nodes

### Key Design Patterns Worth Adopting
1. **Gateway as control plane** — centralized coordination
2. **Channel abstraction** — multiple communication surfaces, one agent
3. **Skills as markdown** — `.openclaw/workspace/skills/<skill>/SKILL.md`
4. **Agent workspace** — `~/.openclaw/workspace/` with injected prompt files
5. **Onboarding flow** — `openclaw onboard` for guided setup
6. **Doctor command** — `openclaw doctor` for diagnostics
7. **Cron + webhooks** — for autonomous operation

### Implication for Terminator
Openclaw proves the autonomous agent pattern works at scale. For Terminator, we should adopt:
- **Communication bridge as MCP server** — expose Telegram/Discord/Slack connectivity as MCP tools
- **Scheduling/Cron as MCP server** — enable autonomous task execution on schedules
- **Skills-as-markdown pattern** — already standard across Claude Code, Openclaw, and others
- **Onboarding pattern** — guided setup that configures everything
- **Remote control pattern** — but via the IDE's existing agent, not a separate runtime

---

## 5. Cross-IDE Compatibility Analysis

### What All Agentic IDEs Support
| Feature | Windsurf | Cursor | Claude Code | Cline | VS Code + Copilot |
|---|---|---|---|---|---|
| **MCP Servers** | Yes | Yes | Yes | Yes | Yes |
| **VS Code Extensions** | Yes | Yes | No* | Yes | Yes |
| **Skills/Commands** | Workflows | Rules | Skills | Prompts | Instructions |
| **Custom Prompts** | Yes | Yes | Yes | Yes | Yes |
| **File system access** | Yes | Yes | Yes | Yes | Yes |
| **Terminal commands** | Yes | Yes | Yes | Yes | Yes |

*Claude Code is terminal-native, not VS Code-based

### The Universal Layer
- **MCP servers** = universal tool layer (ALL IDEs support this)
- **Markdown skill files** = universal knowledge layer (all IDEs can read and use them)
- **VS Code extensions** = universal UI layer (all VS Code-fork IDEs support this)
- **Configuration files** = IDE-specific but auto-generable per IDE

### Conclusion
The architecture should be:
1. **MCP servers** for all capabilities (universal)
2. **Markdown files** for all skills/agents/prompts (universal)
3. **VS Code extension** for UI (works in Windsurf, Cursor, Cline, VS Code)
4. **IDE-specific config generators** for each IDE's settings format
5. **Installer script** that detects the IDE and configures appropriately
