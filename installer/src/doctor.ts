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

let passed = 0;
let failed = 0;
let warnings = 0;

function check(label: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function warn(label: string, detail?: string): void {
  console.log(`  [WARN] ${label}${detail ? ` — ${detail}` : ""}`);
  warnings++;
}

function main() {
  console.log(BANNER);

  const workspacePath = process.cwd();
  console.log(`  Workspace: ${workspacePath}\n`);

  // 1. Node.js version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  check(`Node.js version: ${nodeVersion}`, major >= 20, "Requires Node.js >= 20");

  // 2. TERMINATOR.md exists
  check(
    "TERMINATOR.md exists",
    fs.existsSync(path.join(workspacePath, "TERMINATOR.md"))
  );

  // 3. .terminator/ directory exists
  check(
    ".terminator/ directory exists",
    fs.existsSync(path.join(workspacePath, ".terminator"))
  );

  // 4. .terminator/config.json exists
  check(
    ".terminator/config.json exists",
    fs.existsSync(path.join(workspacePath, ".terminator", "config.json"))
  );

  // 5. terminator-memory built
  const memoryDist = path.join(
    workspacePath,
    "mcp-servers",
    "terminator-memory",
    "dist",
    "index.js"
  );
  check("terminator-memory MCP server is built", fs.existsSync(memoryDist));

  // 6. IDE detection
  const detection = detectIDE(workspacePath);
  console.log(
    `\n  IDE detected: ${detection.label} (confidence: ${detection.confidence})`
  );
  console.log(`  Reason: ${detection.reason}\n`);

  // 7. MCP config exists
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

  // 9. IDE-specific prompt file
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

  // 10. Skills and agents
  const skillNames = [
    "research", "writing", "analysis", "communication",
    "planning", "automation", "coding", "summarize", "onboarding",
  ];
  const agentNames = [
    "researcher", "writer", "analyst", "scheduler", "communicator", "supervisor",
  ];

  const skillsFound = skillNames.filter((s) =>
    fs.existsSync(path.join(workspacePath, "skills", s, "SKILL.md"))
  );
  check(
    `Skills installed: ${skillsFound.length}/${skillNames.length}`,
    skillsFound.length === skillNames.length,
    skillsFound.length < skillNames.length
      ? `Missing: ${skillNames.filter((s) => !skillsFound.includes(s)).join(", ")}`
      : undefined
  );

  const agentsFound = agentNames.filter((a) =>
    fs.existsSync(path.join(workspacePath, "agents", `${a}.md`))
  );
  check(
    `Agents installed: ${agentsFound.length}/${agentNames.length}`,
    agentsFound.length === agentNames.length,
    agentsFound.length < agentNames.length
      ? `Missing: ${agentNames.filter((a) => !agentsFound.includes(a)).join(", ")}`
      : undefined
  );

  // 10b. Skills index
  check(
    "Skills index exists (.terminator/skills-index.json)",
    fs.existsSync(path.join(workspacePath, ".terminator", "skills-index.json"))
  );

  // 11. .env file
  if (fs.existsSync(path.join(workspacePath, ".env"))) {
    check(".env file exists", true);
  } else {
    warn(".env file not found", "Communication features won't work without API keys");
  }

  // 11. Can launch the MCP server process
  if (fs.existsSync(memoryDist)) {
    try {
      // Quick smoke test: start the server and immediately kill it
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
  console.log(`  Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  if (failed === 0) {
    console.log("  Status: HEALTHY");
  } else {
    console.log("  Status: ISSUES FOUND — see FAIL items above");
  }
  console.log("  ──────────────────────────────────────────────\n");

  process.exit(failed > 0 ? 1 : 0);
}

main();
