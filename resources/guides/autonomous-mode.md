# Autonomous Mode

Autonomous mode lets Terminator execute tasks without step-by-step confirmation. It will proactively work through scheduled tasks, process incoming messages, and complete multi-step workflows.

---

## Enabling Autonomous Mode

### Via Prompt

> *"Enable autonomous mode"*

Terminator will update `.terminator/config.json` and confirm:

> "Autonomous mode enabled. I will auto-approve: read, write_file, search, browse. I will still confirm: delete, send_message."

### Via Config

Edit `.terminator/config.json`:

```json
{
  "autonomous": {
    "enabled": true,
    "requireConfirmation": ["delete", "send_message", "spend_money"],
    "autoApprove": ["read", "write_file", "search", "browse"],
    "maxTokensPerTask": 100000,
    "notifyOnCompletion": true,
    "defaultNotificationChannel": "telegram"
  }
}
```

---

## How It Works

### When Autonomous Mode is DISABLED (default)

- Every action requires user confirmation
- Drafts and plans are shown before execution
- Messages are shown before sending
- This is the safest mode for learning and testing

### When Autonomous Mode is ENABLED

- Actions in `autoApprove` execute without confirmation
- Actions in `requireConfirmation` still require approval
- Every autonomous action is logged to memory with tag `autonomous_action`
- Completion notifications sent to `defaultNotificationChannel`
- Token usage tracked against `maxTokensPerTask`
- Stops and asks on unrecoverable errors

---

## Configuration Options

| Option | Type | Description |
|---|---|---|
| `enabled` | boolean | Master switch for autonomous mode |
| `requireConfirmation` | string[] | Actions that always need approval |
| `autoApprove` | string[] | Actions that proceed without asking |
| `maxTokensPerTask` | number | Maximum tokens per autonomous run |
| `notifyOnCompletion` | boolean | Send notification when tasks finish |
| `defaultNotificationChannel` | string | Channel for notifications (telegram, discord, slack, email) |

### Action Types

| Action | Description | Default |
|---|---|---|
| `read` | Reading files, browsing, searching | Auto-approve |
| `write_file` | Creating or editing files | Auto-approve |
| `search` | Web search and data queries | Auto-approve |
| `browse` | Fetching web pages | Auto-approve |
| `send_message` | Sending via any channel | Require confirmation |
| `delete` | Deleting files or data | Require confirmation |
| `spend_money` | API calls with costs | Require confirmation |

---

## Safety Guarantees

Even with autonomous mode fully enabled:

1. **Destructive actions are always gated** — `requireConfirmation` actions cannot be auto-approved
2. **All actions are logged** — Every autonomous action is stored in memory for audit
3. **Token limits enforced** — Prevents runaway execution
4. **Error handling** — Stops and asks the user on unrecoverable errors
5. **User can always override** — Autonomous mode can be disabled at any time
6. **Remote kill switch** — Send `/pause` via any channel to stop operations

---

## Recommended Setup for Beginners

Start conservative and expand as you gain confidence:

```json
{
  "autonomous": {
    "enabled": true,
    "requireConfirmation": ["delete", "send_message", "spend_money"],
    "autoApprove": ["read", "search", "browse"],
    "maxTokensPerTask": 50000,
    "notifyOnCompletion": true,
    "defaultNotificationChannel": "telegram"
  }
}
```

This allows Terminator to research and read freely, but still asks before writing files or sending messages.

---

## Monitoring Autonomous Activity

### Check Activity Log

> *"Show me all autonomous actions from today"*

This searches memory for entries tagged `autonomous_action`.

### Remote Status Check

Send `/status` via Telegram/Discord to get a real-time update.

### View Scheduled Tasks

> *"List all active scheduled tasks"*

---

## Disabling Autonomous Mode

### Via Prompt

> *"Disable autonomous mode"*

### Via Remote Control

Send `/pause` via any configured channel.

### Via Config

Set `"enabled": false` in `.terminator/config.json`.
