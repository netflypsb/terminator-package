#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { detectIDE } from "./detect-ide.js";
import { configureMcp } from "./configure-mcp.js";
import { configurePrompts } from "./configure-prompts.js";
import { configureSkills } from "./configure-skills.js";
import { configureHooks } from "./configure-hooks.js";

const BANNER = `
╔══════════════════════════════════════════════╗
║         TERMINATOR PACKAGE INSTALLER         ║
║     Transforming your IDE into an AI Worker  ║
╚══════════════════════════════════════════════╝
`;

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[90m${s}\x1b[0m`;

let stepNum = 0;
function step(msg: string) {
  stepNum++;
  console.log(`\n  ${bold(`[${stepNum}/9]`)} ${msg}`);
}

function log(msg: string) {
  console.log(`        ${msg}`);
}

function logSuccess(msg: string) {
  console.log(`        ${green('✓')} ${msg}`);
}

function logWarn(msg: string) {
  console.log(`        ${yellow('⚠')} ${msg}`);
}

function logError(msg: string) {
  console.error(`        ${red('✗')} ${msg}`);
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

const MCP_SERVERS = [
  "terminator-memory",
  "terminator-scheduler",
  "terminator-comms",
  "terminator-browser",
  "terminator-data",
  "terminator-files",
  "terminator-system",
];

function verifyMcpServersBuilt(workspacePath: string): { built: string[]; missing: string[] } {
  const built: string[] = [];
  const missing: string[] = [];
  for (const name of MCP_SERVERS) {
    const dist = path.join(workspacePath, "mcp-servers", name, "dist", "index.js");
    if (fs.existsSync(dist)) {
      built.push(name);
    } else {
      missing.push(name);
    }
  }
  return { built, missing };
}

async function main() {
  console.log(BANNER);

  const workspacePath = process.cwd();
  console.log(`  ${dim('Workspace:')} ${workspacePath}`);

  // Step 1: Verify we're in the terminator-package root
  step('Verifying workspace...');
  const terminatorMd = path.join(workspacePath, "TERMINATOR.md");
  if (!fs.existsSync(terminatorMd)) {
    logError(
      "TERMINATOR.md not found. Are you running this from the terminator-package root?"
    );
    process.exit(1);
  }
  logSuccess("Found TERMINATOR.md");

  // Step 2: Check MCP servers are built
  step('Checking MCP server builds...');
  const { built, missing } = verifyMcpServersBuilt(workspacePath);
  if (built.length === 0) {
    logError("No MCP servers built. Run 'pnpm build' first.");
    process.exit(1);
  }
  logSuccess(`${built.length}/${MCP_SERVERS.length} MCP servers built: ${built.join(", ")}`);
  if (missing.length > 0) {
    logWarn(`Missing builds: ${missing.join(", ")} — run 'pnpm build' to build all`);
  }

  // Step 3: Detect IDE
  step('Detecting IDE...');
  const detection = detectIDE(workspacePath);
  logSuccess(`${bold(detection.label)} ${dim(`(confidence: ${detection.confidence})`)}`);

  // Step 4: Create .terminator/ directory
  step('Creating runtime directory...');
  ensureTerminatorDir(workspacePath);
  logSuccess("Created .terminator/ with config.json and logs/");

  // Step 5: Configure MCP servers
  step('Configuring MCP servers...');
  const mcpPath = configureMcp(workspacePath, detection.ide);
  logSuccess(`MCP config → ${bold(path.relative(workspacePath, mcpPath))}`);

  // Step 6: Configure IDE-specific prompt file
  step('Writing system prompt...');
  const promptPath = configurePrompts(workspacePath, detection.ide);
  if (promptPath) {
    logSuccess(`System prompt → ${bold(path.relative(workspacePath, promptPath))}`);
  } else {
    logWarn("Could not determine IDE-specific prompt file location");
  }

  // Step 7: Install skills and agents
  step('Installing skills & agents...');
  const skillResult = configureSkills(workspacePath, detection.ide);
  logSuccess(`${skillResult.skillsCopied} skills, ${skillResult.agentsCopied} agents installed`);
  if (skillResult.workflowsCreated > 0) {
    logSuccess(`${skillResult.workflowsCreated} Windsurf workflows created`);
  }

  // Step 8: Install hooks
  step('Registering hooks...');
  const hookResult = configureHooks(workspacePath, detection.ide);
  if (hookResult.hooksLoaded > 0) {
    logSuccess(`${hookResult.hooksRegistered} hooks registered via ${hookResult.method}`);
  } else {
    logWarn("No hooks found (hooks/ directory empty)");
  }

  // Step 9: Set up .env file
  step('Setting up environment...');
  setupEnvFile(workspacePath);

  // Done
  console.log(`\n  ${green('══════════════════════════════════════════════')}`);
  console.log(`  ${green(bold('✓ Installation complete!'))}`);
  console.log(`  ${green('══════════════════════════════════════════════')}`);
  console.log(`\n  ${bold('Next steps:')}`);
  console.log(`  ${bold('1.')} Restart your IDE to pick up the new MCP config`);
  console.log(`  ${bold('2.')} Edit .env to add API keys for Telegram/Discord/etc ${dim('(optional)')}`);
  console.log(`  ${bold('3.')} Try: ${green('"What capabilities do you have as a Terminator?"')}`);
  console.log(`\n  Run ${bold('node installer/dist/doctor.js')} to verify your installation.\n`);
}

main().catch((err) => {
  logError(`Installation failed: ${err.message}`);
  process.exit(1);
});
