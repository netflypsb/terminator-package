import React from "react";
import type { VsCodeApi } from "../types";

interface CommunicationsProps {
  vscode: VsCodeApi;
}

const CHANNELS = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    envKeys: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
    desc: "Send and receive messages via Telegram bot",
  },
  {
    id: "discord",
    name: "Discord",
    icon: "🎮",
    envKeys: ["DISCORD_BOT_TOKEN", "DISCORD_CHANNEL_ID"],
    desc: "Send and read messages from Discord channels",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    envKeys: ["SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID"],
    desc: "Send and read messages from Slack channels",
  },
  {
    id: "email",
    name: "Email",
    icon: "📧",
    envKeys: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
    desc: "Send emails via SMTP",
  },
  {
    id: "webhook",
    name: "Webhooks",
    icon: "🔗",
    envKeys: [],
    desc: "POST data to any webhook URL (always available)",
  },
];

export function Communications({ vscode }: CommunicationsProps) {
  return (
    <div className="view comms-view">
      <h2 className="view-title">Communication Hub</h2>

      {/* Channel List */}
      <section className="section">
        <h3 className="section-title">Available Channels</h3>
        <div className="channel-list">
          {CHANNELS.map((ch) => (
            <div key={ch.id} className="channel-card">
              <div className="channel-header">
                <span className="channel-icon">{ch.icon}</span>
                <span className="channel-name">{ch.name}</span>
                {ch.envKeys.length === 0 && (
                  <span className="badge badge-success">Always available</span>
                )}
              </div>
              <div className="channel-desc">{ch.desc}</div>
              {ch.envKeys.length > 0 && (
                <div className="channel-keys">
                  <span className="text-muted">Required .env keys:</span>
                  {ch.envKeys.map((key) => (
                    <code key={key} className="env-key">{key}</code>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Remote Commands */}
      <section className="section">
        <h3 className="section-title">Remote Control Commands</h3>
        <p className="section-desc">
          Send these commands from any configured channel to control Terminator remotely.
        </p>
        <div className="command-list">
          <div className="command-item">
            <code className="command-code">/status</code>
            <span className="command-desc">Report current task status</span>
          </div>
          <div className="command-item">
            <code className="command-code">/tasks</code>
            <span className="command-desc">List scheduled and active tasks</span>
          </div>
          <div className="command-item">
            <code className="command-code">/do &lt;instruction&gt;</code>
            <span className="command-desc">Execute an instruction</span>
          </div>
          <div className="command-item">
            <code className="command-code">/pause</code>
            <span className="command-desc">Pause autonomous operations</span>
          </div>
          <div className="command-item">
            <code className="command-code">/resume</code>
            <span className="command-desc">Resume paused operations</span>
          </div>
          <div className="command-item">
            <code className="command-code">/memory &lt;query&gt;</code>
            <span className="command-desc">Search memory</span>
          </div>
        </div>
      </section>

      {/* Quick Send */}
      <section className="section">
        <h3 className="section-title">Sending Messages</h3>
        <p className="section-desc">
          Use the AI chat to send messages across channels:
        </p>
        <div className="command-list">
          <div className="command-item">
            <code className="command-code">"Send via Telegram: Hello!"</code>
            <span className="command-desc">Sends a Telegram message</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Read my recent Slack messages"</code>
            <span className="command-desc">Reads latest Slack messages</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Check all channels for new messages"</code>
            <span className="command-desc">Reads across all configured channels</span>
          </div>
        </div>
      </section>
    </div>
  );
}
