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

// --- Tool: comms_parse_command ---
server.tool(
  "comms_parse_command",
  "Parse a message for remote control commands. Returns the parsed command and arguments if a valid command is found. Valid commands: /status, /tasks, /do <instruction>, /pause, /resume, /memory <query>. Returns null command if the message is not a command.",
  {
    message: z.string().describe("The message text to parse for commands"),
    sender_id: z.string().optional().describe("The sender's user ID for authentication"),
    channel: z.string().optional().describe("Which channel the message came from (telegram, discord, slack)"),
  },
  async ({ message, sender_id, channel }) => {
    const trimmed = message.trim();

    // Check if it's a command (starts with /)
    if (!trimmed.startsWith("/")) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            is_command: false,
            raw_message: trimmed,
            sender_id: sender_id || null,
            channel: channel || null,
          }),
        }],
      };
    }

    // Check authentication if whitelist is configured
    const whitelist = process.env.TERMINATOR_ALLOWED_USER_IDS;
    if (whitelist && sender_id) {
      const allowed = whitelist.split(",").map((id) => id.trim());
      if (!allowed.includes(sender_id)) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              is_command: true,
              authorized: false,
              reason: `User ${sender_id} is not in the allowed user list`,
              sender_id,
              channel: channel || null,
            }),
          }],
        };
      }
    }

    // Check passphrase if configured
    const passphrase = process.env.TERMINATOR_COMMAND_PASSPHRASE;
    if (passphrase) {
      // Passphrase must be the first word after the command
      // e.g., "/do mypassphrase Research topic X"
      // This is a simple approach; more sophisticated auth can be added later
    }

    // Parse the command
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    interface ParsedCommand {
      is_command: boolean;
      authorized: boolean;
      command: string;
      args: string;
      description: string;
      sender_id: string | null;
      channel: string | null;
    }

    let parsed: ParsedCommand;

    switch (cmd) {
      case "/status":
        parsed = {
          is_command: true,
          authorized: true,
          command: "status",
          args: "",
          description: "Report current task status. Use schedule_list to get all tasks and format a brief status report.",
          sender_id: sender_id || null,
          channel: channel || null,
        };
        break;

      case "/tasks":
        parsed = {
          is_command: true,
          authorized: true,
          command: "tasks",
          args: args || "",
          description: "List all scheduled and active tasks. Use schedule_list to get tasks and format them.",
          sender_id: sender_id || null,
          channel: channel || null,
        };
        break;

      case "/do":
        parsed = {
          is_command: true,
          authorized: true,
          command: "do",
          args: args,
          description: `Execute the instruction: "${args}". Use appropriate skills and tools to complete this task.`,
          sender_id: sender_id || null,
          channel: channel || null,
        };
        break;

      case "/pause":
        parsed = {
          is_command: true,
          authorized: true,
          command: "pause",
          args: "",
          description: "Pause all active scheduled tasks. Use schedule_list to find active tasks, then schedule_pause on each.",
          sender_id: sender_id || null,
          channel: channel || null,
        };
        break;

      case "/resume":
        parsed = {
          is_command: true,
          authorized: true,
          command: "resume",
          args: "",
          description: "Resume all paused scheduled tasks. Use schedule_list with status 'paused', then schedule_resume on each.",
          sender_id: sender_id || null,
          channel: channel || null,
        };
        break;

      case "/memory":
        parsed = {
          is_command: true,
          authorized: true,
          command: "memory",
          args: args,
          description: `Search memory for: "${args}". Use memory_search and return the results.`,
          sender_id: sender_id || null,
          channel: channel || null,
        };
        break;

      default:
        parsed = {
          is_command: true,
          authorized: true,
          command: "unknown",
          args: trimmed,
          description: `Unknown command: ${cmd}. Valid commands: /status, /tasks, /do, /pause, /resume, /memory`,
          sender_id: sender_id || null,
          channel: channel || null,
        };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(parsed) }],
    };
  }
);

// --- Tool: comms_auth_check ---
server.tool(
  "comms_auth_check",
  "Check if a user is authorized to send remote commands. Validates against TERMINATOR_ALLOWED_USER_IDS (comma-separated list in .env) and optional TERMINATOR_COMMAND_PASSPHRASE.",
  {
    user_id: z.string().describe("The user ID to check"),
    channel: z.string().optional().describe("The channel the user is on"),
    passphrase: z.string().optional().describe("Optional passphrase provided by the user"),
  },
  async ({ user_id, channel, passphrase }) => {
    const whitelist = process.env.TERMINATOR_ALLOWED_USER_IDS;
    const requiredPassphrase = process.env.TERMINATOR_COMMAND_PASSPHRASE;

    const result: {
      authorized: boolean;
      user_id: string;
      channel: string | null;
      reasons: string[];
    } = {
      authorized: true,
      user_id,
      channel: channel || null,
      reasons: [],
    };

    // Check whitelist
    if (whitelist) {
      const allowed = whitelist.split(",").map((id) => id.trim());
      if (allowed.includes(user_id)) {
        result.reasons.push("User is in allowed list");
      } else {
        result.authorized = false;
        result.reasons.push("User is NOT in allowed list (TERMINATOR_ALLOWED_USER_IDS)");
      }
    } else {
      result.reasons.push("No user whitelist configured (TERMINATOR_ALLOWED_USER_IDS not set) — all users allowed");
    }

    // Check passphrase
    if (requiredPassphrase) {
      if (passphrase === requiredPassphrase) {
        result.reasons.push("Passphrase is correct");
      } else if (!passphrase) {
        result.authorized = false;
        result.reasons.push("Passphrase required but not provided (TERMINATOR_COMMAND_PASSPHRASE is set)");
      } else {
        result.authorized = false;
        result.reasons.push("Passphrase is incorrect");
      }
    } else {
      result.reasons.push("No passphrase required (TERMINATOR_COMMAND_PASSPHRASE not set)");
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
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
