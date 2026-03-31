#!/usr/bin/env node

import fs from "fs";
import path from "path";

const BANNER = `
╔══════════════════════════════════════════════╗
║         TERMINATOR UNINSTALLER               ║
║     Removing generated configuration files   ║
╚══════════════════════════════════════════════╝
`;

function log(msg: string) {
  console.log(`  ${msg}`);
}

function removed(msg: string) {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
}

function skipped(msg: string) {
  console.log(`  \x1b[90m- ${msg} (not found)\x1b[0m`);
}

function removeFile(filePath: string, label: string): boolean {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    removed(label);
    return true;
  }
  skipped(label);
  return false;
}

function removeDir(dirPath: string, label: string): boolean {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    removed(label);
    return true;
  }
  skipped(label);
  return false;
}

function detectMode(workspacePath: string): { sourcePath: string; mode: "standalone" | "embedded" } {
  // Standalone: TERMINATOR.md at project root
  if (fs.existsSync(path.join(workspacePath, "TERMINATOR.md")) &&
      fs.existsSync(path.join(workspacePath, "mcp-servers"))) {
    return { sourcePath: workspacePath, mode: "standalone" };
  }
  // Embedded: .terminator-package/ subfolder
  const embeddedPath = path.join(workspacePath, ".terminator-package");
  if (fs.existsSync(path.join(embeddedPath, "TERMINATOR.md"))) {
    return { sourcePath: embeddedPath, mode: "embedded" };
  }
  return { sourcePath: workspacePath, mode: "standalone" };
}

function main() {
  console.log(BANNER);

  const workspacePath = process.cwd();
  log(`Workspace: ${workspacePath}\n`);

  const { sourcePath, mode } = detectMode(workspacePath);

  if (mode === "embedded") {
    log(`\x1b[36mEmbedded mode\x1b[0m — source: .terminator-package/\n`);
  }

  // Verify we can find Terminator source
  const terminatorMd = path.join(sourcePath, "TERMINATOR.md");
  if (!fs.existsSync(terminatorMd)) {
    console.log("  \x1b[31m[ERROR]\x1b[0m TERMINATOR.md not found. No Terminator installation detected.");
    process.exit(1);
  }

  let count = 0;

  // 1. Remove generated MCP config files
  log("\x1b[1mRemoving MCP configuration files...\x1b[0m");
  if (removeFile(path.join(workspacePath, ".mcp.json"), ".mcp.json")) count++;
  const cursorMcp = path.join(workspacePath, ".cursor", "mcp.json");
  if (removeFile(cursorMcp, ".cursor/mcp.json")) count++;

  // 2. Remove generated IDE prompt files
  log("\n\x1b[1mRemoving IDE-specific prompt files...\x1b[0m");
  const promptFiles = [
    ".windsurfrules",
    ".cursorrules",
    ".clinerules",
    "CLAUDE.md",
    ".github/copilot-instructions.md",
  ];
  for (const pf of promptFiles) {
    if (removeFile(path.join(workspacePath, pf), pf)) count++;
  }

  // 3. Remove .terminator/ runtime directory
  log("\n\x1b[1mRemoving runtime state...\x1b[0m");
  if (removeDir(path.join(workspacePath, ".terminator"), ".terminator/ (config, databases, logs)")) count++;

  // 4. In embedded mode, offer to remove .terminator-package/
  if (mode === "embedded") {
    log("\n\x1b[1mTerminator source:\x1b[0m");
    log("  \x1b[33m⚠\x1b[0m .terminator-package/ — preserved. Delete manually to fully remove Terminator.");
  }

  // 5. Preserve .env
  log("\n\x1b[1mUser files (preserved):\x1b[0m");
  const envPath = path.join(workspacePath, ".env");
  if (fs.existsSync(envPath)) {
    log("  \x1b[33m⚠\x1b[0m .env — preserved (contains your API keys). Delete manually if desired.");
  }

  // Summary
  console.log("\n  ──────────────────────────────────────────────");
  if (count > 0) {
    log(`Removed ${count} generated file(s).`);
  } else {
    log("No generated files found to remove.");
  }
  log("Source code, skills, agents, and MCP servers are untouched.");
  if (mode === "embedded") {
    log("Re-run the installer: node .terminator-package/installer/dist/install.js");
  } else {
    log("Re-run the installer: node installer/dist/install.js");
  }
  console.log("  ──────────────────────────────────────────────\n");
}

main();
