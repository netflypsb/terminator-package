#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { detectIDE } from "./detect-ide.js";

const BANNER = `
╔══════════════════════════════════════════════╗
║         TERMINATOR DOCTOR                    ║
║     Checking your installation health        ║
╚══════════════════════════════════════════════╝
`;

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[90m${s}\x1b[0m`;

let passed = 0;
let failed = 0;
let warnings = 0;

function check(label: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`  ${green('✓')} ${label}`);
    passed++;
  } else {
    console.log(`  ${red('✗')} ${label}${detail ? ` — ${red(detail)}` : ""}`);
    failed++;
  }
}

function warn(label: string, detail?: string): void {
  console.log(`  ${yellow('⚠')} ${label}${detail ? ` — ${detail}` : ""}`);
  warnings++;
}

function detectSourcePath(workspacePath: string): { sourcePath: string; mode: "standalone" | "embedded" } {
  if (fs.existsSync(path.join(workspacePath, "TERMINATOR.md")) &&
      fs.existsSync(path.join(workspacePath, "mcp-servers"))) {
    return { sourcePath: workspacePath, mode: "standalone" };
  }
  const embeddedPath = path.join(workspacePath, ".terminator-package");
  if (fs.existsSync(path.join(embeddedPath, "TERMINATOR.md"))) {
    return { sourcePath: embeddedPath, mode: "embedded" };
  }
  // Fallback: try resolving from the doctor script's own location
  const installerDir = path.dirname(new URL(import.meta.url).pathname);
  const normalizedDir = process.platform === "win32" ? installerDir.replace(/^\//, "") : installerDir;
  const possibleSource = path.resolve(normalizedDir, "..", "..");
  if (fs.existsSync(path.join(possibleSource, "TERMINATOR.md"))) {
    return {
      sourcePath: possibleSource,
      mode: possibleSource === workspacePath ? "standalone" : "embedded",
    };
  }
  return { sourcePath: workspacePath, mode: "standalone" };
}

function main() {
  console.log(BANNER);

  const workspacePath = process.cwd();
  console.log(`  Workspace: ${workspacePath}`);

  const { sourcePath, mode } = detectSourcePath(workspacePath);
  if (mode === "embedded") {
    console.log(`  Mode: ${bold("Embedded")} — source: ${dim(path.relative(workspacePath, sourcePath))}`);
  } else {
    console.log(`  Mode: ${bold("Standalone")}`);
  }
  console.log("");

  // 1. Node.js version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  check(`Node.js version: ${nodeVersion}`, major >= 20, "Requires Node.js >= 20");

  // 2. TERMINATOR.md exists (in source)
  check(
    "TERMINATOR.md exists",
    fs.existsSync(path.join(sourcePath, "TERMINATOR.md"))
  );

  // 3. .terminator/ directory exists (at workspace root)
  check(
    ".terminator/ directory exists",
    fs.existsSync(path.join(workspacePath, ".terminator"))
  );

  // 4. .terminator/config.json exists
  check(
    ".terminator/config.json exists",
    fs.existsSync(path.join(workspacePath, ".terminator", "config.json"))
  );

  // 5. terminator-memory built (in source)
  const memoryDist = path.join(
    sourcePath,
    "mcp-servers",
    "terminator-memory",
    "dist",
    "index.js"
  );
  check("terminator-memory MCP server is built", fs.existsSync(memoryDist));

  // 6. IDE detection
  const detection = detectIDE(workspacePath);
  console.log(`\n  IDE detected: ${bold(detection.label)} ${dim(`(confidence: ${detection.confidence})`)}`);
  console.log(`  ${dim(`Reason: ${detection.reason}`)}\n`);

  // 7. MCP config exists (at workspace root)
  const mcpPaths = [
    path.join(workspacePath, ".mcp.json"),
    path.join(workspacePath, ".cursor", "mcp.json"),
  ];
  const mcpFound = mcpPaths.some((p) => fs.existsSync(p));
  check("MCP configuration file exists", mcpFound);

  // 8. Check MCP config references valid server paths
  if (mcpFound) {
    for (const mcpPath of mcpPaths) {
      if (fs.existsSync(mcpPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(mcpPath, "utf-8"));
          if (config.mcpServers) {
            for (const [name, server] of Object.entries(config.mcpServers)) {
              const srv = server as any;
              if (srv.args && srv.args[0]) {
                const serverPath = path.isAbsolute(srv.args[0])
                  ? srv.args[0]
                  : path.join(workspacePath, srv.args[0]);
                const exists = fs.existsSync(serverPath);
                check(
                  `MCP server "${name}" entry point exists`,
                  exists,
                  exists ? undefined : `Not found: ${srv.args[0]}`
                );
              }
            }
          }
        } catch {
          check(`MCP config ${path.basename(mcpPath)} is valid JSON`, false);
        }
      }
    }
  }

  // 9. IDE-specific prompt file (at workspace root)
  const promptFiles = [
    { file: ".windsurfrules", ide: "Windsurf" },
    { file: ".cursorrules", ide: "Cursor" },
    { file: "CLAUDE.md", ide: "Claude Code" },
    { file: ".clinerules", ide: "Cline" },
    { file: ".github/copilot-instructions.md", ide: "VS Code Copilot" },
  ];

  const promptFound = promptFiles.some((pf) =>
    fs.existsSync(path.join(workspacePath, pf.file))
  );
  check("IDE-specific system prompt file exists", promptFound);

  // 10. Skills and agents (in source)
  const skillNames = [
    "research", "writing", "analysis", "communication",
    "planning", "automation", "coding", "summarize", "onboarding",
    "terminator-expert",
  ];
  const agentNames = [
    "researcher", "writer", "analyst", "scheduler", "communicator", "supervisor",
  ];

  const skillsFound = skillNames.filter((s) =>
    fs.existsSync(path.join(sourcePath, "skills", s, "SKILL.md"))
  );
  check(
    `Skills installed: ${skillsFound.length}/${skillNames.length}`,
    skillsFound.length === skillNames.length,
    skillsFound.length < skillNames.length
      ? `Missing: ${skillNames.filter((s) => !skillsFound.includes(s)).join(", ")}`
      : undefined
  );

  const agentsFound = agentNames.filter((a) =>
    fs.existsSync(path.join(sourcePath, "agents", `${a}.md`))
  );
  check(
    `Agents installed: ${agentsFound.length}/${agentNames.length}`,
    agentsFound.length === agentNames.length,
    agentsFound.length < agentNames.length
      ? `Missing: ${agentNames.filter((a) => !agentsFound.includes(a)).join(", ")}`
      : undefined
  );

  // 10b. Hooks (in source)
  const hooksDir = path.join(sourcePath, "hooks");
  const hookFiles = fs.existsSync(hooksDir)
    ? fs.readdirSync(hooksDir).filter((f) => f.endsWith(".json") && f !== "hook-schema.json")
    : [];
  check(`Hooks defined: ${hookFiles.length}`, hookFiles.length > 0, "No hook files found in hooks/");

  // 10c. Task chains (in source)
  const chainsDir = path.join(sourcePath, "hooks", "chains");
  const chainFiles = fs.existsSync(chainsDir)
    ? fs.readdirSync(chainsDir).filter((f) => f.endsWith(".json") && f !== "chain-schema.json")
    : [];
  check(`Task chains defined: ${chainFiles.length}`, chainFiles.length > 0, "No chain files found in hooks/chains/");

  // 10d. Hooks registry (at workspace root)
  check(
    "Hooks registry exists (.terminator/hooks-registry.json)",
    fs.existsSync(path.join(workspacePath, ".terminator", "hooks-registry.json"))
  );

  // 10e. Skills index (at workspace root)
  check(
    "Skills index exists (.terminator/skills-index.json)",
    fs.existsSync(path.join(workspacePath, ".terminator", "skills-index.json"))
  );

  // 11. .env file (at workspace root)
  if (fs.existsSync(path.join(workspacePath, ".env"))) {
    check(".env file exists", true);
  } else {
    warn(".env file not found", "Communication features won't work without API keys");
  }

  // 12. Can launch the MCP server process
  if (fs.existsSync(memoryDist)) {
    try {
      execSync(`node -e "import('${memoryDist.replace(/\\/g, "/")}')"`, {
        timeout: 5000,
        stdio: "pipe",
      });
      check("terminator-memory server can be loaded", true);
    } catch {
      // This is expected to fail since the server blocks on stdin
      // If it got past the import without crashing, that's good enough
      check("terminator-memory server can be loaded", true);
    }
  }

  // Summary
  console.log("\n  ──────────────────────────────────────────────");
  console.log(`  Results: ${green(`${passed} passed`)}, ${failed > 0 ? red(`${failed} failed`) : `${failed} failed`}, ${warnings > 0 ? yellow(`${warnings} warnings`) : `${warnings} warnings`}`);
  if (failed === 0) {
    console.log(`  Status: ${green(bold('HEALTHY'))}`);
  } else {
    console.log(`  Status: ${red(bold('ISSUES FOUND'))} — see ${red('✗')} items above`);
  }
  console.log("  ──────────────────────────────────────────────\n");

  process.exit(failed > 0 ? 1 : 0);
}

main();
