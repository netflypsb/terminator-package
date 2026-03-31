#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync, exec } from "child_process";
import os from "os";
import path from "path";

const server = new McpServer({
  name: "terminator-system",
  version: "0.1.0",
});

const platform = os.platform();

// --- Tool: system_notify ---
server.tool(
  "system_notify",
  "Show a desktop notification to the user. Works on Windows, macOS, and Linux.",
  {
    title: z.string().describe("Notification title"),
    message: z.string().describe("Notification body text"),
  },
  async ({ title, message }) => {
    try {
      // Use native OS notification commands (avoids node-notifier native dep issues)
      if (platform === "win32") {
        const ps = `
          [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
          [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
          $template = @"
          <toast>
            <visual>
              <binding template="ToastGeneric">
                <text>${title.replace(/"/g, "&quot;")}</text>
                <text>${message.replace(/"/g, "&quot;")}</text>
              </binding>
            </visual>
          </toast>
"@
          $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
          $xml.LoadXml($template)
          $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
          [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Terminator").Show($toast)
        `.trim();
        execSync(`powershell -Command "${ps.replace(/\n/g, "; ")}"`, { timeout: 5000 });
      } else if (platform === "darwin") {
        execSync(
          `osascript -e 'display notification "${message.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}"'`,
          { timeout: 5000 }
        );
      } else {
        // Linux: try notify-send
        execSync(`notify-send "${title}" "${message}"`, { timeout: 5000 });
      }
      return { content: [{ type: "text" as const, text: `Notification sent: "${title}"` }] };
    } catch (err: any) {
      // Fallback: just report it
      return { content: [{ type: "text" as const, text: `Notification (fallback): ${title} — ${message}\n(Native notification failed: ${err.message})` }] };
    }
  }
);

// --- Tool: system_clipboard_read ---
server.tool(
  "system_clipboard_read",
  "Read the current contents of the system clipboard.",
  {},
  async () => {
    try {
      let content: string;
      if (platform === "win32") {
        content = execSync("powershell -Command Get-Clipboard", { encoding: "utf-8", timeout: 3000 }).trim();
      } else if (platform === "darwin") {
        content = execSync("pbpaste", { encoding: "utf-8", timeout: 3000 });
      } else {
        content = execSync("xclip -selection clipboard -o", { encoding: "utf-8", timeout: 3000 });
      }
      if (!content) return { content: [{ type: "text" as const, text: "Clipboard is empty." }] };
      if (content.length > 5000) content = content.substring(0, 5000) + "\n...(truncated)";
      return { content: [{ type: "text" as const, text: `Clipboard contents:\n\n${content}` }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Clipboard read error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: system_clipboard_write ---
server.tool(
  "system_clipboard_write",
  "Write text to the system clipboard.",
  {
    text: z.string().describe("Text to copy to clipboard"),
  },
  async ({ text }) => {
    try {
      if (platform === "win32") {
        execSync(`powershell -Command "Set-Clipboard -Value '${text.replace(/'/g, "''")}'"`  , { timeout: 3000 });
      } else if (platform === "darwin") {
        execSync(`echo ${JSON.stringify(text)} | pbcopy`, { timeout: 3000 });
      } else {
        execSync(`echo ${JSON.stringify(text)} | xclip -selection clipboard`, { timeout: 3000 });
      }
      return { content: [{ type: "text" as const, text: `Copied ${text.length} characters to clipboard.` }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Clipboard write error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: system_process_list ---
server.tool(
  "system_process_list",
  "List running processes with their PID, name, and memory usage.",
  {
    filter: z.string().optional().describe("Filter processes by name (case-insensitive substring match)"),
    limit: z.number().optional().describe("Maximum processes to return (default: 30)"),
  },
  async ({ filter, limit }) => {
    try {
      let output: string;
      if (platform === "win32") {
        output = execSync("tasklist /FO CSV /NH", { encoding: "utf-8", timeout: 5000 });
      } else {
        output = execSync("ps aux --sort=-%mem", { encoding: "utf-8", timeout: 5000 });
      }

      let lines = output.trim().split("\n");
      if (filter) {
        const f = filter.toLowerCase();
        lines = lines.filter((l) => l.toLowerCase().includes(f));
      }

      const maxLines = limit ?? 30;
      lines = lines.slice(0, maxLines);

      if (lines.length === 0) {
        return { content: [{ type: "text" as const, text: filter ? `No processes matching "${filter}"` : "No processes found." }] };
      }

      return { content: [{ type: "text" as const, text: `Processes (${lines.length}):\n\n${lines.join("\n")}` }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Process list error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: system_env_get ---
server.tool(
  "system_env_get",
  "Get the value of an environment variable.",
  {
    name: z.string().describe("Environment variable name"),
  },
  async ({ name }) => {
    const value = process.env[name];
    if (value === undefined) {
      return { content: [{ type: "text" as const, text: `Environment variable "${name}" is not set.` }] };
    }
    // Mask sensitive values
    const sensitive = /token|key|secret|password|pass/i;
    const display = sensitive.test(name) ? value.substring(0, 4) + "..." + value.substring(value.length - 4) : value;
    return { content: [{ type: "text" as const, text: `${name}=${display}` }] };
  }
);

// --- Tool: system_info ---
server.tool(
  "system_info",
  "Get system information: OS, architecture, CPU, memory, uptime, and Node.js version.",
  {},
  async () => {
    const info = [
      `**OS**: ${os.type()} ${os.release()} (${os.arch()})`,
      `**Hostname**: ${os.hostname()}`,
      `**CPUs**: ${os.cpus().length}x ${os.cpus()[0]?.model || "unknown"}`,
      `**Memory**: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB total, ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB free`,
      `**Uptime**: ${(os.uptime() / 3600).toFixed(1)} hours`,
      `**Node.js**: ${process.version}`,
      `**Platform**: ${platform}`,
      `**Home**: ${os.homedir()}`,
      `**CWD**: ${process.cwd()}`,
    ];
    return { content: [{ type: "text" as const, text: info.join("\n") }] };
  }
);

// --- Tool: system_open ---
server.tool(
  "system_open",
  "Open a file or URL with the system's default application. For example, open a PDF, a web URL, or a folder in the file explorer.",
  {
    target: z.string().describe("File path or URL to open"),
  },
  async ({ target }) => {
    try {
      let cmd: string;
      if (platform === "win32") {
        cmd = `start "" "${target}"`;
      } else if (platform === "darwin") {
        cmd = `open "${target}"`;
      } else {
        cmd = `xdg-open "${target}"`;
      }

      await new Promise<void>((resolve, reject) => {
        exec(cmd, { timeout: 5000 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return { content: [{ type: "text" as const, text: `Opened: ${target}` }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Open error: ${err.message}` }], isError: true };
    }
  }
);

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("terminator-system MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
