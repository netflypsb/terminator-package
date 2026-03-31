#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { detectIDE } from "./detect-ide.js";
import { configureMcp } from "./configure-mcp.js";
import { configurePrompts } from "./configure-prompts.js";

const BANNER = `
╔══════════════════════════════════════════════╗
║         TERMINATOR PACKAGE INSTALLER         ║
║     Transforming your IDE into an AI Worker  ║
╚══════════════════════════════════════════════╝
`;

function log(msg: string) {
  console.log(`  [Terminator] ${msg}`);
}

function logSuccess(msg: string) {
  console.log(`  [OK] ${msg}`);
}

function logWarn(msg: string) {
  console.log(`  [WARN] ${msg}`);
}

function logError(msg: string) {
  console.error(`  [ERROR] ${msg}`);
}

function ensureTerminatorDir(workspacePath: string): void {
  const terminatorDir = path.join(workspacePath, ".terminator");
  if (!fs.existsSync(terminatorDir)) {
    fs.mkdirSync(terminatorDir, { recursive: true });
  }

  // Create subdirectories
  const subdirs = ["logs"];
  for (const sub of subdirs) {
    const subPath = path.join(terminatorDir, sub);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
    }
  }

  // Create default config.json if it doesn't exist
  const configPath = path.join(terminatorDir, "config.json");
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      version: "0.1.0",
      autonomous: {
        enabled: false,
        requireConfirmation: ["delete", "send_message"],
        autoApprove: ["read", "write_file", "search", "browse"],
        notifyOnCompletion: true,
        defaultNotificationChannel: "telegram",
      },
      memory: {
        enabled: true,
      },
      scheduler: {
        enabled: false,
      },
      comms: {
        enabled: false,
        defaultChannel: null,
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf-8");
  }
}

function setupEnvFile(workspacePath: string): void {
  const envPath = path.join(workspacePath, ".env");
  const examplePath = path.join(workspacePath, ".env.example");

  if (fs.existsSync(envPath)) {
    log(".env file already exists, skipping");
    return;
  }

  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    logSuccess("Created .env from .env.example (edit to add your API keys)");
  }
}

function verifyMcpServerBuilt(workspacePath: string): boolean {
  const memoryDist = path.join(
    workspacePath,
    "mcp-servers",
    "terminator-memory",
    "dist",
    "index.js"
  );
  return fs.existsSync(memoryDist);
}

async function main() {
  console.log(BANNER);

  const workspacePath = process.cwd();
  log(`Workspace: ${workspacePath}`);

  // Step 1: Verify we're in the terminator-package root
  const terminatorMd = path.join(workspacePath, "TERMINATOR.md");
  if (!fs.existsSync(terminatorMd)) {
    logError(
      "TERMINATOR.md not found. Are you running this from the terminator-package root?"
    );
    process.exit(1);
  }
  logSuccess("Found TERMINATOR.md");

  // Step 2: Check MCP server is built
  if (!verifyMcpServerBuilt(workspacePath)) {
    logError(
      "terminator-memory MCP server not built. Run 'pnpm build' first."
    );
    process.exit(1);
  }
  logSuccess("terminator-memory MCP server is built");

  // Step 3: Detect IDE
  const detection = detectIDE(workspacePath);
  log(`Detected IDE: ${detection.label} (confidence: ${detection.confidence})`);
  log(`  Reason: ${detection.reason}`);

  // Step 4: Create .terminator/ directory
  ensureTerminatorDir(workspacePath);
  logSuccess("Created .terminator/ runtime directory");

  // Step 5: Configure MCP servers
  const mcpPath = configureMcp(workspacePath, detection.ide);
  logSuccess(`MCP config written to: ${path.relative(workspacePath, mcpPath)}`);

  // Step 6: Configure IDE-specific prompt file
  const promptPath = configurePrompts(workspacePath, detection.ide);
  if (promptPath) {
    logSuccess(
      `System prompt written to: ${path.relative(workspacePath, promptPath)}`
    );
  } else {
    logWarn("Could not determine IDE-specific prompt file location");
  }

  // Step 7: Set up .env file
  setupEnvFile(workspacePath);

  // Done
  console.log("");
  console.log("  ══════════════════════════════════════════════");
  console.log("  Installation complete!");
  console.log("");
  console.log("  Next steps:");
  console.log("  1. Restart your IDE to pick up the new MCP config");
  console.log("  2. Edit .env to add API keys for Telegram/Discord/etc (optional)");
  console.log('  3. Try: "What capabilities do you have as a Terminator?"');
  console.log("");
  console.log("  Run 'node installer/dist/doctor.js' to verify your installation.");
  console.log("  ══════════════════════════════════════════════");
}

main().catch((err) => {
  logError(`Installation failed: ${err.message}`);
  process.exit(1);
});
