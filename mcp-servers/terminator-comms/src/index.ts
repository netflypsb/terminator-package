#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  telegramSend,
  telegramRead,
  discordSend,
  discordRead,
  slackSend,
  slackRead,
  emailSend,
  webhookSend,
  getAvailableChannels,
} from "./channels.js";

const server = new McpServer({
  name: "terminator-comms",
  version: "0.1.0",
});

// --- Tool: comms_status ---
server.tool(
  "comms_status",
  "Check which communication channels are configured and available. Returns a list of channels that have their API keys/tokens set in .env.",
  {},
  async () => {
    const channels = getAvailableChannels();
    return {
      content: [
        {
          type: "text" as const,
          text: channels.length > 0
            ? `Available channels: ${channels.join(", ")}`
            : "No communication channels configured. Add API keys to .env file.",
        },
      ],
    };
  }
);

// --- Tool: telegram_send ---
server.tool(
  "telegram_send",
  "Send a message via Telegram. Requires TELEGRAM_BOT_TOKEN in .env. Optionally specify a chat_id, or it defaults to TELEGRAM_CHAT_ID from .env.",
  {
    message: z.string().describe("The message text to send (supports Markdown)"),
    chat_id: z.string().optional().describe("Telegram chat ID. Defaults to TELEGRAM_CHAT_ID from .env"),
  },
  async ({ message, chat_id }) => {
    try {
      const result = await telegramSend(chat_id ?? "", message);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Telegram error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: telegram_read ---
server.tool(
  "telegram_read",
  "Read recent messages sent to the Telegram bot. Returns the latest messages from bot updates.",
  {
    chat_id: z.string().optional().describe("Telegram chat ID. Defaults to TELEGRAM_CHAT_ID from .env"),
    limit: z.number().optional().describe("Number of recent messages to fetch (default: 10)"),
  },
  async ({ chat_id, limit }) => {
    try {
      const result = await telegramRead(chat_id ?? "", limit ?? 10);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Telegram error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: discord_send ---
server.tool(
  "discord_send",
  "Send a message to a Discord channel. Requires DISCORD_BOT_TOKEN in .env.",
  {
    message: z.string().describe("The message text to send"),
    channel_id: z.string().optional().describe("Discord channel ID. Defaults to DISCORD_CHANNEL_ID from .env"),
  },
  async ({ message, channel_id }) => {
    try {
      const result = await discordSend(channel_id ?? "", message);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Discord error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: discord_read ---
server.tool(
  "discord_read",
  "Read recent messages from a Discord channel.",
  {
    channel_id: z.string().optional().describe("Discord channel ID. Defaults to DISCORD_CHANNEL_ID from .env"),
    limit: z.number().optional().describe("Number of recent messages (default: 10)"),
  },
  async ({ channel_id, limit }) => {
    try {
      const result = await discordRead(channel_id ?? "", limit ?? 10);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Discord error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: slack_send ---
server.tool(
  "slack_send",
  "Send a message to a Slack channel. Requires SLACK_BOT_TOKEN in .env.",
  {
    message: z.string().describe("The message text to send"),
    channel_id: z.string().optional().describe("Slack channel ID. Defaults to SLACK_CHANNEL_ID from .env"),
  },
  async ({ message, channel_id }) => {
    try {
      const result = await slackSend(channel_id ?? "", message);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Slack error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: slack_read ---
server.tool(
  "slack_read",
  "Read recent messages from a Slack channel.",
  {
    channel_id: z.string().optional().describe("Slack channel ID. Defaults to SLACK_CHANNEL_ID from .env"),
    limit: z.number().optional().describe("Number of recent messages (default: 10)"),
  },
  async ({ channel_id, limit }) => {
    try {
      const result = await slackRead(channel_id ?? "", limit ?? 10);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Slack error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: email_send ---
server.tool(
  "email_send",
  "Send an email via SMTP. Requires SMTP_HOST, SMTP_USER, SMTP_PASS in .env.",
  {
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Email body (plain text)"),
  },
  async ({ to, subject, body }) => {
    try {
      const result = await emailSend(to, subject, body);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Email error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: webhook_send ---
server.tool(
  "webhook_send",
  "Send an HTTP request to a webhook URL. Always available, no API key needed.",
  {
    url: z.string().describe("The webhook URL to send to"),
    data: z.record(z.any()).describe("JSON data payload to send"),
    method: z.enum(["POST", "PUT", "PATCH"]).optional().describe("HTTP method (default: POST)"),
  },
  async ({ url, data, method }) => {
    try {
      const result = await webhookSend(url, data, method ?? "POST");
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Webhook error: ${err.message}` }], isError: true };
    }
  }
);

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("terminator-comms MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
