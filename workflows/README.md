# Terminator Workflow Templates

**Important**: These are workflow templates, not automated event-driven hooks. They provide structured prompts that you can manually invoke to perform common tasks. The templates are translated into IDE-specific workflows (Windsurf) or used as prompt guides (other IDEs).

## How Workflow Templates Work

Each template is a JSON file that specifies:
- **Trigger**: When this template should be used (workspace open, schedule due, etc.)
- **Action**: What prompt to send to the AI assistant
- **Instructions**: Step-by-step guidance for the AI

## Built-in Templates

| Template | When to Use | What It Does |
|----------|-------------|-------------|
| `on-workspace-open.json` | Starting a new session | Load context, check pending tasks, greet user |
| `on-schedule-trigger.json` | Processing scheduled tasks | Execute queued tasks, notify on completion |
| `on-message-received.json` | Handling incoming messages | Parse commands, execute, respond |

## Hook Specification

See `hook-schema.json` for the full JSON Schema. Key fields:

```json
{
  "name": "my-hook",
  "trigger": "on_workspace_open",
  "action": "prompt",
  "prompt": "Do something when the workspace opens",
  "enabled": true,
  "requires_confirmation": false,
  "description": "Human-readable description"
}
```

### Triggers

| Trigger | When It Fires |
|---------|--------------|
| `on_workspace_open` | IDE workspace/session starts |
| `on_workspace_close` | IDE workspace/session ends |
| `on_schedule_trigger` | A scheduled task reaches its due time |
| `on_message_received` | A message arrives on a configured channel |
| `on_file_change` | A watched file is modified |
| `on_manual` | User explicitly invokes the hook |
| `on_interval` | Repeating timer (minimum 60 seconds) |

### Actions

| Action | Description |
|--------|------------|
| `prompt` | Send a prompt to the AI assistant |
| `tool_call` | Directly invoke an MCP tool with arguments |
| `chain` | Execute a task chain (see Task Chains below) |

## IDE Registration

Hooks are registered differently per IDE:

### Windsurf
Hooks are translated into Windsurf workflows in `.windsurf/workflows/`. The `on_workspace_open` hook maps to a workflow that can be invoked via `/hooks-startup`.

### Cursor
Hooks are registered as rules in `.cursor/rules/`. The `on_workspace_open` hook is injected into the rules file.

### Claude Code
Hooks map natively to Claude Code's hook system in `.claude/settings.json`:
```json
{
  "hooks": {
    "on_workspace_open": {
      "command": "echo 'hook:check-schedules-on-open'"
    }
  }
}
```

### Others (Cline, VS Code)
Hooks use a polling-based fallback. The scheduler checks for pending hooks at configurable intervals.

## Creating Custom Hooks

1. Create a new `.json` file in the `hooks/` directory
2. Follow the schema in `hook-schema.json`
3. Run the installer to register the hook with your IDE
4. Test with `"trigger": "on_manual"` first

### Example: Monitor a Website Daily

```json
{
  "name": "check-competitor-pricing",
  "trigger": "on_schedule_trigger",
  "action": "prompt",
  "prompt": "Use browse_url to check https://competitor.com/pricing. Compare with the last stored version in memory. If changed, notify me via Telegram.",
  "enabled": true,
  "notify_on_complete": true,
  "notify_channel": "telegram",
  "description": "Daily check of competitor pricing page for changes"
}
```

### Example: Auto-Summarize Changed Files

```json
{
  "name": "summarize-on-change",
  "trigger": "on_file_change",
  "action": "prompt",
  "prompt": "A file was modified. Summarize the changes and store in memory.",
  "enabled": true,
  "conditions": {
    "file_patterns": ["docs/**/*.md", "README.md"]
  },
  "description": "Summarize documentation changes automatically"
}
```

## Disabling Hooks

Set `"enabled": false` in the hook JSON, or delete the file. Re-run the installer to update IDE registrations.
