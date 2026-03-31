import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

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
        case "loadConfig":
          await this._loadConfig();
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
    // We read from the schedules DB indirectly — the webview can't access SQLite directly.
    // Instead, we check if the DB file exists and report its size.
    const ws = this._getWorkspacePath();
    const dbPath = path.join(ws, ".terminator", "schedules.db");
    const exists = fs.existsSync(dbPath);
    let size = 0;
    if (exists) {
      size = fs.statSync(dbPath).size;
    }
    this._postToWebview({
      command: "schedulesData",
      data: {
        dbExists: exists,
        dbSize: size,
        note: "Use the MCP tools (schedule_list, schedule_check_pending) to interact with schedules. The UI provides a visual overview.",
      },
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
