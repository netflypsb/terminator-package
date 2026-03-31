import fs from "fs";
import path from "path";
import type { IDE } from "./detect-ide.js";

interface Hook {
  name: string;
  trigger: string;
  action: string;
  prompt?: string;
  tool?: string;
  tool_args?: Record<string, unknown>;
  chain?: string;
  enabled?: boolean;
  requires_confirmation?: boolean;
  notify_on_complete?: boolean;
  notify_channel?: string;
  conditions?: Record<string, unknown>;
  description?: string;
}

function loadHooks(sourcePath: string): Hook[] {
  const hooksDir = path.join(sourcePath, "hooks");
  if (!fs.existsSync(hooksDir)) return [];

  const hooks: Hook[] = [];
  const files = fs.readdirSync(hooksDir).filter(
    (f) => f.endsWith(".json") && f !== "hook-schema.json"
  );

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(hooksDir, file), "utf-8");
      const hook = JSON.parse(content) as Hook;
      if (hook.name && hook.trigger && hook.action) {
        hooks.push(hook);
      }
    } catch {
      // Skip invalid hook files
    }
  }

  return hooks;
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function registerWindsurfHooks(workspacePath: string, hooks: Hook[]): number {
  const workflowsDir = path.join(workspacePath, ".windsurf", "workflows");
  ensureDir(workflowsDir);
  let count = 0;

  // Create a startup workflow for on_workspace_open hooks
  const startupHooks = hooks.filter(
    (h) => h.trigger === "on_workspace_open" && h.enabled !== false
  );
  if (startupHooks.length > 0) {
    const prompts = startupHooks
      .map((h) => h.prompt || h.description || h.name)
      .join("\n\n");
    const workflow = [
      "---",
      "description: Terminator startup — load context, check pending tasks",
      "---",
      "",
      "# Startup Hook",
      "",
      "This workflow runs on workspace open. It is generated from hooks.",
      "",
      "## Instructions",
      "",
      prompts,
    ].join("\n");
    fs.writeFileSync(path.join(workflowsDir, "hooks-startup.md"), workflow, "utf-8");
    count++;
  }

  // Create a schedule-check workflow for on_schedule_trigger hooks
  const scheduleHooks = hooks.filter(
    (h) => h.trigger === "on_schedule_trigger" && h.enabled !== false
  );
  if (scheduleHooks.length > 0) {
    const prompts = scheduleHooks
      .map((h) => h.prompt || h.description || h.name)
      .join("\n\n");
    const workflow = [
      "---",
      "description: Process pending scheduled tasks",
      "---",
      "",
      "# Schedule Trigger Hook",
      "",
      "This workflow processes pending scheduled tasks. Invoke with /hooks-schedule.",
      "",
      "## Instructions",
      "",
      prompts,
    ].join("\n");
    fs.writeFileSync(path.join(workflowsDir, "hooks-schedule.md"), workflow, "utf-8");
    count++;
  }

  // Create a message-handler workflow for on_message_received hooks
  const messageHooks = hooks.filter(
    (h) => h.trigger === "on_message_received" && h.enabled !== false
  );
  if (messageHooks.length > 0) {
    const prompts = messageHooks
      .map((h) => h.prompt || h.description || h.name)
      .join("\n\n");
    const workflow = [
      "---",
      "description: Process incoming messages and commands",
      "---",
      "",
      "# Message Handler Hook",
      "",
      "This workflow processes incoming messages. Invoke with /hooks-messages.",
      "",
      "## Instructions",
      "",
      prompts,
    ].join("\n");
    fs.writeFileSync(path.join(workflowsDir, "hooks-messages.md"), workflow, "utf-8");
    count++;
  }

  return count;
}

function registerCursorHooks(workspacePath: string, hooks: Hook[]): number {
  const rulesDir = path.join(workspacePath, ".cursor", "rules");
  ensureDir(rulesDir);

  const enabledHooks = hooks.filter((h) => h.enabled !== false);
  if (enabledHooks.length === 0) return 0;

  const sections = enabledHooks.map((h) => {
    const lines = [
      `## Hook: ${h.name}`,
      `Trigger: ${h.trigger}`,
      h.description ? `Description: ${h.description}` : "",
      "",
      h.prompt || "",
    ];
    return lines.filter(Boolean).join("\n");
  });

  const content = [
    "# Terminator Hooks",
    "",
    "The following hooks define automated behaviors. Follow these instructions when the trigger conditions are met.",
    "",
    ...sections,
  ].join("\n");

  fs.writeFileSync(path.join(rulesDir, "terminator-hooks.md"), content, "utf-8");
  return enabledHooks.length;
}

function registerClaudeCodeHooks(workspacePath: string, hooks: Hook[]): number {
  const claudeDir = path.join(workspacePath, ".claude");
  ensureDir(claudeDir);

  const settingsPath = path.join(claudeDir, "settings.json");
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      settings = {};
    }
  }

  const hookEntries: Record<string, unknown> = {};
  let count = 0;

  for (const hook of hooks) {
    if (hook.enabled === false) continue;
    hookEntries[hook.name] = {
      trigger: hook.trigger,
      action: hook.action,
      prompt: hook.prompt,
      description: hook.description,
    };
    count++;
  }

  settings.terminator_hooks = hookEntries;
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  return count;
}

function registerGenericHooks(workspacePath: string, hooks: Hook[]): number {
  // For unknown IDEs, write a hooks registry to .terminator/
  const registryPath = path.join(workspacePath, ".terminator", "hooks-registry.json");
  ensureDir(path.dirname(registryPath));

  const registry = {
    hooks: hooks.filter((h) => h.enabled !== false).map((h) => ({
      name: h.name,
      trigger: h.trigger,
      action: h.action,
      description: h.description,
    })),
    registeredAt: new Date().toISOString(),
    note: "This is a fallback registry. Hooks are best used with IDE-native integration.",
  };

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), "utf-8");
  return registry.hooks.length;
}

export interface HookInstallResult {
  hooksLoaded: number;
  hooksRegistered: number;
  method: string;
}

export function configureHooks(
  workspacePath: string,
  ide: IDE,
  sourcePath?: string
): HookInstallResult {
  const hooks = loadHooks(sourcePath || workspacePath);

  if (hooks.length === 0) {
    return { hooksLoaded: 0, hooksRegistered: 0, method: "none" };
  }

  let registered = 0;
  let method = "generic";

  // Always write the generic registry
  registerGenericHooks(workspacePath, hooks);

  switch (ide) {
    case "windsurf":
      registered = registerWindsurfHooks(workspacePath, hooks);
      method = "windsurf-workflows";
      break;
    case "cursor":
      registered = registerCursorHooks(workspacePath, hooks);
      method = "cursor-rules";
      break;
    case "claude-code":
      registered = registerClaudeCodeHooks(workspacePath, hooks);
      method = "claude-settings";
      break;
    case "cline":
    case "vscode":
    default:
      registered = hooks.filter((h) => h.enabled !== false).length;
      method = "polling-fallback";
      break;
  }

  return {
    hooksLoaded: hooks.length,
    hooksRegistered: registered,
    method,
  };
}
