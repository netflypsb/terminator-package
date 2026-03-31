# Getting Started with Terminator

Welcome to Terminator! This guide walks you through your first session and shows you what's possible.

---

## Prerequisites

- **Node.js >= 20** — [Download](https://nodejs.org/)
- **An agentic IDE** — Windsurf, Cursor, Claude Code, Cline, or VS Code with Copilot
- **pnpm** — Install with `npm install -g pnpm`

---

## Installation

1. Clone or download the repository:
   ```bash
   git clone https://github.com/netflypsb/terminator-package.git
   cd terminator-package
   ```

2. Install dependencies and build:
   ```bash
   pnpm install
   pnpm build
   ```

3. Run the installer:
   ```bash
   node installer/dist/install.js
   ```

4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

5. Restart your IDE.

6. Verify with the doctor:
   ```bash
   node installer/dist/doctor.js
   ```

---

## Try This! — Your First 10 Minutes

### 1. Test Memory (30 seconds)

Prompt your IDE agent:

> *"Remember that my name is Alex, my timezone is UTC+8, and I prefer Telegram for notifications."*

Then ask:

> *"What do you know about me?"*

Terminator stores this in persistent memory and recalls it across sessions.

### 2. Research Something (2 minutes)

> *"Research the top 5 AI code editors in 2025 and save a summary to findings.md"*

Terminator will:
- Search the web using the browser tools
- Synthesize findings
- Save a markdown file to your workspace
- Store key findings in memory

### 3. Explore Capabilities (1 minute)

> *"What capabilities do you have as a Terminator?"*

This triggers the onboarding skill, which gives you a comprehensive overview of all available tools, skills, and agents.

### 4. Work with Data (2 minutes)

Create a simple CSV file, then:

> *"Analyze the CSV file I just created and show me summary statistics"*

### 5. Schedule a Task (1 minute)

> *"Create a one-shot task called 'test-reminder' that triggers in 5 minutes with the message 'Hello from Terminator!'"*

### 6. Try a Skill (2 minutes)

> *"Using the writing skill, draft a professional email thanking a client for their business"*

### 7. Check System Status (30 seconds)

> *"Run the Terminator doctor to check system health"*

---

## Setting Up Communication Channels

To enable Telegram, Discord, or Slack, edit your `.env` file:

### Telegram (recommended for personal use)

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the token to `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   TELEGRAM_CHAT_ID=your_chat_id
   ```
4. To get your chat ID, message your bot and visit `https://api.telegram.org/bot<token>/getUpdates`

### Discord

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Add to `.env`:
   ```
   DISCORD_BOT_TOKEN=your_token
   DISCORD_CHANNEL_ID=your_channel_id
   ```

### Slack

1. Create a Slack app at [api.slack.com](https://api.slack.com/apps)
2. Add to `.env`:
   ```
   SLACK_BOT_TOKEN=xoxb-your-token
   SLACK_CHANNEL_ID=C01234567
   ```

---

## What's Next?

- **[Custom Skills](custom-skills.md)** — Create your own domain-specific skills
- **[Autonomous Mode](autonomous-mode.md)** — Let Terminator work independently
- **[Remote Control](remote-control.md)** — Control Terminator from your phone
- **[Custom MCP Servers](custom-mcp-servers.md)** — Extend with new capabilities

---

## Troubleshooting

### "MCP server not found" errors

Run `pnpm build` to rebuild all servers, then restart your IDE.

### Doctor shows failures

Run `node installer/dist/doctor.js` and follow the suggestions for each failed check.

### IDE doesn't detect Terminator tools

Make sure you've restarted the IDE after running the installer. The MCP config file must be loaded fresh.

### Memory not persisting

Check that `.terminator/` directory exists and `config.json` has `memory.enabled: true`.
