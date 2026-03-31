# Terminator Package — Quick Reference & Decision Log

## Document Index

| File | Contents |
|---|---|
| `00-SUMMARY.md` | Executive summary — what Terminator is, the one-prompt promise, architecture at a glance |
| `01-RESEARCH-FINDINGS.md` | Research synthesis — MCP protocol, Claude plugins, OpenClaw, cross-IDE compatibility |
| `02-ARCHITECTURE.md` | System architecture — layered design, component details, data flows, security model |
| `03-PACKAGE-STRUCTURE.md` | Repository file/folder structure — every file, its purpose, example configs |
| `04-DETAILED-PLAN.md` | Step-by-step implementation plan — 6 phases, ~60 tasks, timeline, tech stack |
| `05-QUICK-REFERENCE.md` | This file — decision log, key choices, and rationale |

---

## Key Architectural Decisions

### Decision 1: GitHub Repository Package (not a single plugin or extension)

**Choice**: Distribute as a GitHub repository containing MCP servers, skills, agents, hooks, a VS Code extension, and an installer.

**Rationale**:
- A Claude Code plugin only works in Claude Code
- A VS Code extension can't bundle MCP servers or skills natively
- An MCP-only approach has no UI and no skills
- A GitHub repo can contain ALL of the above and work across ALL agentic IDEs
- The "one-prompt install" UX is achieved via README instructions the IDE agent follows

**Trade-off**: Requires an installer script vs. one-click marketplace install. Worth it for universal compatibility.

### Decision 2: MCP Servers as the Universal Capability Layer

**Choice**: Every core capability (memory, scheduling, communications, browser, data, files, system) is an MCP server using stdio transport.

**Rationale**:
- MCP is the ONE standard all agentic IDEs support (Windsurf, Cursor, Claude Code, Cline, VS Code + Copilot, Codex)
- Stdio transport = local, fast, no network dependency
- Each server is independent = users can enable/disable individually
- TypeScript + Node.js = runs everywhere

### Decision 3: Skills as Markdown Files

**Choice**: Skills are plain markdown `SKILL.md` files — no code required.

**Rationale**:
- This is already the standard across Claude Code, OpenClaw, Cursor, and the LobeHub marketplace
- Anyone can create or modify skills, including non-developers
- Skills are version-controllable, shareable, and composable
- The intelligence comes from the LLM interpreting the skill instructions + the MCP tools available

### Decision 4: VS Code Extension for UI (not a web app)

**Choice**: Build a VS Code extension (Terminator Panel) for the clean UI layer.

**Rationale**:
- All VS Code-fork IDEs (Windsurf, Cursor, Cline) support VS Code extensions
- No separate runtime or server needed — it runs inside the IDE
- Native look and feel with VS Code theming
- Access to VS Code API for deep integration (commands, status bar, file watchers)
- Claude Code users (terminal-based) can use the CLI/chat interface instead

### Decision 5: Workspace-Based Organization

**Choice**: Each "job" or "project" is a workspace folder with its own `.terminator/` state directory.

**Rationale**:
- All IDEs already use workspace/folder-based workflows
- Non-developers are already familiar with folder-based organization
- State isolation between projects (each workspace has its own memory, schedules, etc.)
- Easy to back up, share, or archive a complete workspace

### Decision 6: Polling-Based Scheduling (Phase 1), Events Later

**Choice**: Start with the agent polling `schedule_check_pending` tool, evolve to file-based triggers and daemon processes later.

**Rationale**:
- MCP servers are passive (respond to tool calls, can't push)
- Polling is the simplest approach that works across all IDEs today
- More sophisticated event systems can be added incrementally
- The hook system will eventually enable true event-driven automation

### Decision 7: TypeScript for Everything

**Choice**: All MCP servers, installer, and extension code in TypeScript.

**Rationale**:
- MCP SDK is TypeScript-first
- VS Code extensions are TypeScript
- Node.js runs on all platforms
- Single language reduces cognitive load and dependency management
- pnpm monorepo keeps everything organized

---

## Minimum Viable Product (MVP) Definition

The MVP that proves the concept and delivers real value:

### Must Have (Phase 1-2)
- [ ] TERMINATOR.md master system prompt
- [ ] Installer that works on at least Windsurf + Cursor
- [ ] terminator-memory MCP server (persistent memory)
- [ ] terminator-scheduler MCP server (basic scheduling)
- [ ] terminator-comms MCP server (Telegram only)
- [ ] terminator-browser MCP server (basic browsing)
- [ ] 3 core skills (research, writing, communication)
- [ ] README with one-prompt install instructions

### Should Have (Phase 3-4)
- [ ] All 7 MCP servers
- [ ] All 9 skills
- [ ] All 6 agents
- [ ] Hook system
- [ ] Autonomous mode
- [ ] Remote control via Telegram

### Nice to Have (Phase 5-6)
- [ ] VS Code extension (Terminator Panel)
- [ ] Workspace templates
- [ ] Claude Code plugin wrapper
- [ ] Comprehensive documentation

---

## Success Metrics

| Metric | Target |
|---|---|
| One-prompt install success rate | >80% on first try across 3 IDEs |
| MCP server startup time | <2 seconds per server |
| Memory retrieval latency | <100ms for keyword search |
| Scheduled task execution reliability | >95% tasks execute on time |
| Remote command response time | <10 seconds Telegram round-trip |
| Non-developer usability | Can complete 3 tasks without reading docs |

---

## Open Questions

1. **Scheduling daemon**: Should the scheduler run as a separate background process outside the IDE, or strictly within IDE sessions? (Impacts always-on capability)
2. **Memory sharing**: Should memory be workspace-scoped or globally shared? (Current design: workspace-scoped with optional global layer)
3. **Cost management**: Should Terminator track LLM token usage and enforce budgets? (Important for autonomous mode)
4. **Multi-workspace coordination**: Can a Terminator in one workspace delegate to another? (Future consideration)
5. **OpenClaw integration**: Should Terminator optionally use OpenClaw as its communication/autonomy backend instead of building its own? (Could accelerate Phase 4)
