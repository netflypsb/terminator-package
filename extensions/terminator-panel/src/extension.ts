import * as vscode from "vscode";
import { TerminatorPanelProvider } from "./panel-provider";

let statusBarItem: vscode.StatusBarItem;
let schedulePoller: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Register the webview provider
  const provider = new TerminatorPanelProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("terminator.panel", provider)
  );

  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = "$(hubot) Terminator";
  statusBarItem.tooltip = "Click to open Terminator Panel";
  statusBarItem.command = "terminator.openPanel";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("terminator.openPanel", () => {
      vscode.commands.executeCommand("terminator.panel.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("terminator.newTask", () => {
      provider.postMessage({ command: "navigate", view: "schedules", action: "new" });
      vscode.commands.executeCommand("terminator.panel.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("terminator.checkSchedules", () => {
      provider.postMessage({ command: "navigate", view: "schedules" });
      vscode.commands.executeCommand("terminator.panel.focus");
      // Also trigger actual schedule check
      triggerScheduleCheck();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("terminator.openCommHub", () => {
      provider.postMessage({ command: "navigate", view: "communications" });
      vscode.commands.executeCommand("terminator.panel.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("terminator.searchMemory", () => {
      provider.postMessage({ command: "navigate", view: "memory" });
      vscode.commands.executeCommand("terminator.panel.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("terminator.toggleAutonomous", async () => {
      const config = vscode.workspace.getConfiguration("terminator");
      const current = config.get<boolean>("autonomousMode", false);
      await config.update("autonomousMode", !current, vscode.ConfigurationTarget.Workspace);
      const state = !current ? "ENABLED" : "DISABLED";
      vscode.window.showInformationMessage(`Terminator: Autonomous mode ${state}`);
      provider.postMessage({ command: "autonomousToggled", enabled: !current });
      
      // Start/stop schedule polling based on autonomous mode
      if (!current) {
        startSchedulePolling();
      } else {
        stopSchedulePolling();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("terminator.runDoctor", () => {
      const terminal = vscode.window.createTerminal("Terminator Doctor");
      terminal.show();
      terminal.sendText("node installer/dist/doctor.js");
    })
  );

  // Update status bar periodically
  updateStatusBar(provider);
  const interval = setInterval(() => updateStatusBar(provider), 30000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });

  // Start schedule polling if autonomous mode is enabled
  const config = vscode.workspace.getConfiguration("terminator");
  if (config.get<boolean>("autonomousMode", false)) {
    startSchedulePolling();
  }

  // Initial schedule check on startup
  setTimeout(() => triggerScheduleCheck(), 5000);
}

function updateStatusBar(provider: TerminatorPanelProvider) {
  // Request status from webview (which reads from workspace files)
  provider.postMessage({ command: "requestStatus" });
}

function startSchedulePolling() {
  if (schedulePoller) {
    clearInterval(schedulePoller);
  }
  // Check for pending tasks every minute
  schedulePoller = setInterval(() => {
    triggerScheduleCheck();
  }, 60000);
}

function stopSchedulePolling() {
  if (schedulePoller) {
    clearInterval(schedulePoller);
    schedulePoller = undefined;
  }
}

function triggerScheduleCheck() {
  // Send a notification to the webview to trigger schedule check
  // The webview will communicate with the MCP server
  const terminal = vscode.window.createTerminal("Terminator Scheduler");
  terminal.show();
  terminal.sendText('echo "Checking for pending scheduled tasks..." && npx -y @anthropic-ai/mcp-check-schedules 2>/dev/null || echo "To enable automatic schedule checking, ensure MCP tools are available"');
  // Hide terminal after a brief moment
  setTimeout(() => {
    terminal.dispose();
  }, 100);
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
  stopSchedulePolling();
}
