import * as vscode from "vscode";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import type { VsCodeApi } from "./webview/types.js";

export class TerminatorPanelProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "dist"),
        vscode.Uri.joinPath(this._extensionUri, "media"),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.command) {
        case "readFile":
          await this._handleReadFile(message.filePath);
          break;
        case "writeFile":
          await this._handleWriteFile(message.filePath, message.content);
          break;
        case "runDoctor":
          vscode.commands.executeCommand("terminator.runDoctor");
          break;
        case "showInfo":
          vscode.window.showInformationMessage(message.text);
          break;
        case "showError":
          vscode.window.showErrorMessage(message.text);
          break;
        case "statusUpdate":
          this._updateStatusBar(message.data);
          break;
        case "getWorkspacePath":
          this._postToWebview({
            command: "workspacePath",
            path: this._getWorkspacePath(),
          });
          break;
        case "loadDashboardData":
          await this._loadDashboardData();
          break;
        case "loadSchedules":
          await this._loadSchedules();
          break;
        case "loadMemories":
          await this._loadMemories();
          break;
        case "loadCommunications":
          await this._loadCommunications();
          break;
        case "saveConfig":
          await this._handleWriteFile(
            path.join(this._getWorkspacePath(), ".terminator", "config.json"),
            JSON.stringify(message.config, null, 2)
          );
          break;
      }
    });
  }

  public postMessage(message: any) {
    if (this._view) {
      this._postToWebview(message);
    }
  }

  private _postToWebview(message: any) {
    this._view?.webview.postMessage(message);
  }

  private _getWorkspacePath(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      return folders[0].uri.fsPath;
    }
    return process.cwd();
  }

  private async _handleReadFile(filePath: string) {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this._getWorkspacePath(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        this._postToWebview({
          command: "fileContent",
          filePath,
          content,
        });
      } else {
        this._postToWebview({
          command: "fileContent",
          filePath,
          content: null,
          error: "File not found",
        });
      }
    } catch (err: any) {
      this._postToWebview({
        command: "fileContent",
        filePath,
        content: null,
        error: err.message,
      });
    }
  }

  private async _handleWriteFile(filePath: string, content: string) {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this._getWorkspacePath(), filePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, "utf-8");
      this._postToWebview({ command: "fileSaved", filePath, success: true });
    } catch (err: any) {
      this._postToWebview({
        command: "fileSaved",
        filePath,
        success: false,
        error: err.message,
      });
    }
  }

  private async _loadDashboardData() {
    const ws = this._getWorkspacePath();

    // Load config
    const configPath = path.join(ws, ".terminator", "config.json");
    let config: any = {};
    if (fs.existsSync(configPath)) {
      try { config = JSON.parse(fs.readFileSync(configPath, "utf-8")); } catch {}
    }

    // Load skills index
    const indexPath = path.join(ws, ".terminator", "skills-index.json");
    let skillsIndex: any = {};
    if (fs.existsSync(indexPath)) {
      try { skillsIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8")); } catch {}
    }

    // Load hooks registry
    const hooksPath = path.join(ws, ".terminator", "hooks-registry.json");
    let hooks: any = {};
    if (fs.existsSync(hooksPath)) {
      try { hooks = JSON.parse(fs.readFileSync(hooksPath, "utf-8")); } catch {}
    }

    // Check MCP server builds
    const servers = [
      "terminator-memory", "terminator-scheduler", "terminator-comms",
      "terminator-browser", "terminator-data", "terminator-files", "terminator-system",
    ];
    const serverStatus = servers.map((name) => ({
      name,
      built: fs.existsSync(path.join(ws, "mcp-servers", name, "dist", "index.js")),
    }));

    // Check channels from .env
    const envPath = path.join(ws, ".env");
    const channels: string[] = [];
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, "utf-8");
      if (env.includes("TELEGRAM_BOT_TOKEN=") && !env.includes("# TELEGRAM_BOT_TOKEN")) channels.push("telegram");
      if (env.includes("DISCORD_BOT_TOKEN=") && !env.includes("# DISCORD_BOT_TOKEN")) channels.push("discord");
      if (env.includes("SLACK_BOT_TOKEN=") && !env.includes("# SLACK_BOT_TOKEN")) channels.push("slack");
      if (env.includes("SMTP_HOST=") && !env.includes("# SMTP_HOST")) channels.push("email");
    }

    this._postToWebview({
      command: "dashboardData",
      data: {
        config,
        skillsIndex,
        hooks,
        serverStatus,
        channels,
        autonomousEnabled: config?.autonomous?.enabled ?? false,
      },
    });
  }

  private async _loadSchedules() {
    const ws = this._getWorkspacePath();
    
    // Initialize empty data structure
    const data = {
      tasks: [],
      queue: [],
      daemonStatus: {
        running: false,
        started_at: undefined,
        pid: undefined,
        executions_completed: 0,
        executions_failed: 0,
        last_execution: undefined,
        last_error: undefined
      }
    };

    // Check daemon status
    const daemonStatusPath = path.join(ws, ".terminator", "daemon-status.json");
    if (fs.existsSync(daemonStatusPath)) {
      try {
        const daemonStatus = JSON.parse(fs.readFileSync(daemonStatusPath, "utf-8"));
        data.daemonStatus = { ...data.daemonStatus, ...daemonStatus };
      } catch (error) {
        console.error("Failed to read daemon status:", error);
      }
    }

    // Check if scheduler is built
    const schedulerPath = path.join(ws, "mcp-servers", "terminator-scheduler", "dist", "index.js");
    if (!fs.existsSync(schedulerPath)) {
      this._postToWebview({
        command: "schedulesData",
        data: {
          ...data,
          note: "Scheduler not built. Run 'pnpm build:memory' to build the scheduler MCP server.",
        },
      });
      return;
    }

    try {
      // Fetch tasks via MCP
      const tasks = await this._invokeMcpTool(schedulerPath, "schedule_list", {});
      if (tasks && tasks.content && tasks.content[0]) {
        // Parse tasks from response
        const tasksText = tasks.content[0].text;
        // Simple parsing - in production, this would be more robust
        const taskLines = tasksText.split('\n').filter((line: string) => line.includes('|'));
        data.tasks = taskLines.map((line: string) => {
          const parts = line.split('|').map((p: string) => p.trim());
          return {
            id: parts[1] || '',
            name: parts[2] || '',
            type: parts[3] || 'once',
            status: parts[4] || 'active',
            next_run: parts[5] || null,
            last_run: parts[6] || null,
            description: parts[7] || '',
            run_count: parseInt(parts[8]) || 0,
            max_runs: parts[9] ? parseInt(parts[9]) : null,
            cron_expression: parts[10] || null,
            chain_tasks: parts[11] || null,
            chain_index: parseInt(parts[12]) || 0,
            created_at: parts[13] || '',
            updated_at: parts[14] || ''
          };
        });
      }

      // Fetch execution queue
      const queue = await this._invokeMcpTool(schedulerPath, "schedule_get_pending_executions", {});
      if (queue && queue.content && queue.content[0]) {
        const queueText = queue.content[0].text;
        const queueLines = queueText.split('\n').filter((line: string) => line.includes('Execution #'));
        data.queue = queueLines.map((line: string) => {
          const idMatch = line.match(/Execution #(\d+)/);
          const taskMatch = line.match(/\*\*(.+?)\*\*/);
          const scheduledMatch = line.match(/Scheduled: (.+?)(?:\s|$)/);
          const statusMatch = line.match(/Status: (\w+)/);
          
          return {
            id: idMatch ? parseInt(idMatch[1]) : 0,
            task_id: '',
            task_name: taskMatch ? taskMatch[1] : '',
            task_description: '',
            scheduled_for: scheduledMatch ? scheduledMatch[1] : '',
            queued_at: '',
            claimed_at: null,
            claimed_by: null,
            completed_at: null,
            status: statusMatch ? statusMatch[1] as any : 'pending',
            result: null,
            retry_count: 0
          };
        });
      }

    } catch (error) {
      console.error("Failed to load schedule data:", error);
      // Add note to data
      (data as any).note = "Failed to load schedule data. Check that the scheduler is running.";
    }

    this._postToWebview({
      command: "schedulesData",
      data,
    });
  }

  private async _invokeMcpTool(schedulerPath: string, toolName: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn("node", [schedulerPath], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: this._getWorkspacePath(),
        env: {
          ...process.env,
          SCHEDULER_DB_PATH: path.join(this._getWorkspacePath(), ".terminator", "schedules.db")
        }
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`MCP process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse MCP response
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          
          if (lastLine) {
            const response = JSON.parse(lastLine);
            resolve(response);
          } else {
            resolve(null);
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse MCP response: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
        }
      });

      // Send the tool invocation request
      const request = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      child.stdin.write(JSON.stringify(request) + "\n");
      child.stdin.end();
    });
  }

  private async _loadCommunications() {
    const ws = this._getWorkspacePath();
    
    // Check channels from .env
    const envPath = path.join(ws, ".env");
    const channels: any[] = [];
    const recentMessages: any[] = [];
    
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, "utf-8");
      const envLines = env.split('\n');
      
      // Check each channel
      const channelConfigs = [
        {
          id: "telegram",
          name: "Telegram",
          icon: "✈️",
          envKeys: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
          configured: env.includes("TELEGRAM_BOT_TOKEN=") && !env.includes("# TELEGRAM_BOT_TOKEN")
        },
        {
          id: "discord",
          name: "Discord",
          icon: "🎮",
          envKeys: ["DISCORD_BOT_TOKEN", "DISCORD_CHANNEL_ID"],
          configured: env.includes("DISCORD_BOT_TOKEN=") && !env.includes("# DISCORD_BOT_TOKEN")
        },
        {
          id: "slack",
          name: "Slack",
          icon: "💬",
          envKeys: ["SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID"],
          configured: env.includes("SLACK_BOT_TOKEN=") && !env.includes("# SLACK_BOT_TOKEN")
        },
        {
          id: "email",
          name: "Email",
          icon: "📧",
          envKeys: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
          configured: env.includes("SMTP_HOST=") && !env.includes("# SMTP_HOST")
        },
        {
          id: "webhook",
          name: "Webhooks",
          icon: "🔗",
          envKeys: [],
          configured: true // Always available
        }
      ];
      
      for (const config of channelConfigs) {
        channels.push({
          ...config,
          credentials: config.envKeys,
          lastMessage: null,
          lastCheck: new Date().toISOString()
        });
      }
    }

    this._postToWebview({
      command: "communicationsData",
      data: {
        channels,
        recentMessages
      }
    });
  }

  private async _loadMemories() {
    const ws = this._getWorkspacePath();
    const dbPath = path.join(ws, ".terminator", "memory.db");
    const exists = fs.existsSync(dbPath);
    let size = 0;
    if (exists) {
      size = fs.statSync(dbPath).size;
    }
    this._postToWebview({
      command: "memoriesData",
      data: {
        dbExists: exists,
        dbSize: size,
        note: "Use the MCP tools (memory_search, memory_list) to browse memories. The UI provides a visual overview.",
      },
    });
  }

  private async _loadConfig() {
    const ws = this._getWorkspacePath();
    const configPath = path.join(ws, ".terminator", "config.json");
    let config: any = {};
    if (fs.existsSync(configPath)) {
      try { config = JSON.parse(fs.readFileSync(configPath, "utf-8")); } catch {}
    }

    const envPath = path.join(ws, ".env");
    let envKeys: string[] = [];
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, "utf-8");
      envKeys = env
        .split("\n")
        .filter((l) => l.includes("=") && !l.startsWith("#"))
        .map((l) => l.split("=")[0].trim());
    }

    this._postToWebview({
      command: "configData",
      data: { config, envKeys },
    });
  }

  private _updateStatusBar(data: any) {
    // This is handled by the extension.ts status bar item
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview.js")
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${cssUri}">
  <title>Terminator</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --accent: var(--vscode-button-background);
      --accent-fg: var(--vscode-button-foreground);
      --accent-hover: var(--vscode-button-hoverBackground);
      --border: var(--vscode-panel-border);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border);
      --badge-bg: var(--vscode-badge-background);
      --badge-fg: var(--vscode-badge-foreground);
      --success: var(--vscode-testing-iconPassed, #4caf50);
      --warning: var(--vscode-editorWarning-foreground, #ff9800);
      --error: var(--vscode-errorForeground, #f44336);
      --card-bg: var(--vscode-editorWidget-background);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size, 13px);
      color: var(--fg);
      background: var(--bg);
      padding: 0;
      overflow-x: hidden;
    }

    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
