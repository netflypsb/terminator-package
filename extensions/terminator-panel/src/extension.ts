import * as vscode from "vscode";
import { TerminatorPanelProvider } from "./panel-provider";

let statusBarItem: vscode.StatusBarItem;

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
}

function updateStatusBar(provider: TerminatorPanelProvider) {
  // Request status from webview (which reads from workspace files)
  provider.postMessage({ command: "requestStatus" });
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
