# Remote Control Setup

Control Terminator from your phone or any device via Telegram, Discord, or Slack. Send commands, check status, and trigger tasks remotely.

---

## Available Commands

| Command | Action |
|---|---|
| `/status` | Get current task status and system health |
| `/tasks` | List all scheduled and active tasks |
| `/do <instruction>` | Execute any instruction (e.g., `/do research AI trends`) |
| `/pause` | Pause all autonomous operations |
| `/resume` | Resume paused operations |
| `/memory <query>` | Search memory (e.g., `/memory meeting notes`) |

---

## Telegram Setup (Recommended)

Telegram is the easiest channel to set up for personal use.

### Step 1: Create a Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Choose a name (e.g., "My Terminator Bot")
4. Choose a username (e.g., "my_terminator_bot")
5. Copy the **bot token** — it looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### Step 2: Get Your Chat ID

1. Message your new bot (send any message like "hello")
2. Visit this URL in your browser (replace `<TOKEN>` with your bot token):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
3. Find the `"chat":{"id":` value — that's your chat ID

### Step 3: Configure .env

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=your_chat_id_here
```

### Step 4: Secure with Authentication

Add your Telegram user ID to the whitelist:

```env
TERMINATOR_ALLOWED_USER_IDS=your_user_id
TERMINATOR_COMMAND_PASSPHRASE=optional_passphrase
```

Your user ID can be found from the same `getUpdates` response under `"from":{"id":`.

### Step 5: Test

In your IDE, prompt:

> *"Send a test message via Telegram: Hello from Terminator!"*

You should receive the message on your phone.

---

## Discord Setup

### Step 1: Create a Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → name it → go to "Bot" tab
3. Click "Add Bot" → copy the **bot token**
4. Under "Privileged Gateway Intents", enable **Message Content Intent**

### Step 2: Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`
3. Select permissions: `Send Messages`, `Read Messages/View Channels`
4. Copy the URL and open it to invite the bot to your server

### Step 3: Get Channel ID

1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click the channel → "Copy Channel ID"

### Step 4: Configure .env

```env
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id
```

---

## Slack Setup

### Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "Terminator" and select your workspace

### Step 2: Configure Permissions

1. Go to "OAuth & Permissions"
2. Add Bot Token Scopes:
   - `chat:write`
   - `channels:read`
   - `channels:history`
3. Install to workspace
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Step 3: Get Channel ID

1. Open Slack
2. Right-click a channel → "View channel details"
3. Copy the Channel ID from the bottom of the details panel

### Step 4: Configure .env

```env
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C01234567
```

---

## Security Best Practices

### Whitelist Users

Only allow specific user IDs to send commands:

```env
TERMINATOR_ALLOWED_USER_IDS=user_id_1,user_id_2
```

If not set, **all users** can send commands (not recommended for production).

### Require Passphrase

Add an extra layer of security with a command passphrase:

```env
TERMINATOR_COMMAND_PASSPHRASE=my_secret_phrase
```

### Limit Autonomous Actions

Keep `requireConfirmation` restrictive in `.terminator/config.json`:

```json
{
  "autonomous": {
    "requireConfirmation": ["delete", "send_message", "spend_money"]
  }
}
```

---

## How Remote Control Works

1. Terminator periodically checks for new messages on configured channels
2. When a message starts with `/`, it's parsed as a command
3. The sender's ID is checked against `TERMINATOR_ALLOWED_USER_IDS`
4. If authorized, the command is executed and the result sent back
5. All remote commands are logged to memory

### Architecture

```
Your Phone → Telegram/Discord/Slack → terminator-comms → Parse Command → Execute → Respond
```

The `on-message-received` hook handles incoming messages automatically when autonomous mode is enabled.

---

## Troubleshooting

### Bot doesn't respond

- Verify API tokens in `.env` are correct
- Test with `comms_status` tool to check channel connectivity
- Ensure the bot has proper permissions in the channel

### "Unauthorized" response

- Check `TERMINATOR_ALLOWED_USER_IDS` includes your user ID
- User IDs are numeric — don't use usernames

### Commands not parsed

- Commands must start with `/` (e.g., `/status`, not `status`)
- Check for extra whitespace in messages
