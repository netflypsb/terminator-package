import { Bot } from "grammy";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { WebClient } from "@slack/web-api";
import nodemailer from "nodemailer";

// ─── Telegram ───────────────────────────────────────────────

let telegramBot: Bot | null = null;

function getTelegramBot(): Bot {
  if (telegramBot) return telegramBot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured in .env");
  telegramBot = new Bot(token);
  return telegramBot;
}

export async function telegramSend(
  chatId: string,
  message: string
): Promise<string> {
  const bot = getTelegramBot();
  const cid = chatId || process.env.TELEGRAM_CHAT_ID;
  if (!cid) throw new Error("No chat ID provided and TELEGRAM_CHAT_ID not set in .env");
  const result = await bot.api.sendMessage(cid, message, { parse_mode: "Markdown" });
  return `Message sent (id: ${result.message_id})`;
}

export async function telegramRead(
  chatId: string,
  limit: number = 10
): Promise<string> {
  const bot = getTelegramBot();
  const cid = chatId || process.env.TELEGRAM_CHAT_ID;
  if (!cid) throw new Error("No chat ID provided and TELEGRAM_CHAT_ID not set in .env");
  // Telegram Bot API doesn't support reading chat history directly.
  // We use getUpdates to get recent messages sent to the bot.
  const updates = await bot.api.getUpdates({ limit, allowed_updates: ["message"] });
  if (updates.length === 0) return "No recent messages.";

  const messages = updates
    .filter((u) => u.message)
    .map((u) => {
      const m = u.message!;
      const from = m.from?.first_name || "Unknown";
      const text = m.text || "[non-text message]";
      const date = new Date((m.date || 0) * 1000).toISOString();
      return `[${date}] ${from}: ${text}`;
    });

  return messages.length > 0
    ? messages.join("\n")
    : "No text messages in recent updates.";
}

// ─── Discord ────────────────────────────────────────────────

let discordClient: Client | null = null;
let discordReady = false;

async function getDiscordClient(): Promise<Client> {
  if (discordClient && discordReady) return discordClient;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not configured in .env");

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  await new Promise<void>((resolve, reject) => {
    discordClient!.once("ready", () => {
      discordReady = true;
      resolve();
    });
    discordClient!.once("error", reject);
    discordClient!.login(token);
  });

  return discordClient;
}

export async function discordSend(
  channelId: string,
  message: string
): Promise<string> {
  const client = await getDiscordClient();
  const cid = channelId || process.env.DISCORD_CHANNEL_ID;
  if (!cid) throw new Error("No channel ID provided and DISCORD_CHANNEL_ID not set in .env");
  const channel = await client.channels.fetch(cid);
  if (!channel || !(channel instanceof TextChannel)) {
    throw new Error(`Channel ${cid} not found or not a text channel`);
  }
  const sent = await channel.send(message);
  return `Message sent (id: ${sent.id})`;
}

export async function discordRead(
  channelId: string,
  limit: number = 10
): Promise<string> {
  const client = await getDiscordClient();
  const cid = channelId || process.env.DISCORD_CHANNEL_ID;
  if (!cid) throw new Error("No channel ID provided and DISCORD_CHANNEL_ID not set in .env");
  const channel = await client.channels.fetch(cid);
  if (!channel || !(channel instanceof TextChannel)) {
    throw new Error(`Channel ${cid} not found or not a text channel`);
  }
  const messages = await channel.messages.fetch({ limit });
  const lines = messages.map(
    (m) => `[${m.createdAt.toISOString()}] ${m.author.displayName}: ${m.content}`
  );
  return lines.length > 0 ? lines.join("\n") : "No messages in channel.";
}

// ─── Slack ──────────────────────────────────────────────────

let slackClient: WebClient | null = null;

function getSlackClient(): WebClient {
  if (slackClient) return slackClient;
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN not configured in .env");
  slackClient = new WebClient(token);
  return slackClient;
}

export async function slackSend(
  channelId: string,
  message: string
): Promise<string> {
  const client = getSlackClient();
  const cid = channelId || process.env.SLACK_CHANNEL_ID;
  if (!cid) throw new Error("No channel ID provided and SLACK_CHANNEL_ID not set in .env");
  const result = await client.chat.postMessage({ channel: cid, text: message });
  return `Message sent (ts: ${result.ts})`;
}

export async function slackRead(
  channelId: string,
  limit: number = 10
): Promise<string> {
  const client = getSlackClient();
  const cid = channelId || process.env.SLACK_CHANNEL_ID;
  if (!cid) throw new Error("No channel ID provided and SLACK_CHANNEL_ID not set in .env");
  const result = await client.conversations.history({ channel: cid, limit });
  const messages = result.messages || [];
  if (messages.length === 0) return "No messages in channel.";
  const lines = messages.map(
    (m: any) => `[${new Date(parseFloat(m.ts) * 1000).toISOString()}] ${m.user || "bot"}: ${m.text}`
  );
  return lines.join("\n");
}

// ─── Email ──────────────────────────────────────────────────

function getSmtpTransport(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured in .env");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function emailSend(
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const transport = getSmtpTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await transport.sendMail({ from, to, subject, text: body });
  return `Email sent (messageId: ${info.messageId})`;
}

// ─── Webhook ────────────────────────────────────────────────

export async function webhookSend(
  url: string,
  data: Record<string, any>,
  method: string = "POST"
): Promise<string> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const status = response.status;
  let responseText: string;
  try {
    responseText = await response.text();
    if (responseText.length > 500) responseText = responseText.substring(0, 500) + "...";
  } catch {
    responseText = "(no response body)";
  }
  return `Webhook ${method} to ${url} — Status: ${status}\nResponse: ${responseText}`;
}

// ─── Channel Availability ───────────────────────────────────

export function getAvailableChannels(): string[] {
  const channels: string[] = [];
  if (process.env.TELEGRAM_BOT_TOKEN) channels.push("telegram");
  if (process.env.DISCORD_BOT_TOKEN) channels.push("discord");
  if (process.env.SLACK_BOT_TOKEN) channels.push("slack");
  if (process.env.SMTP_HOST && process.env.SMTP_USER) channels.push("email");
  channels.push("webhook"); // always available
  return channels;
}
