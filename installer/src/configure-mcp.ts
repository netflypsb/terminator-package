import fs from "fs";
import os from "os";
import path from "path";
import type { IDE } from "./detect-ide.js";

export interface McpConfig {
  mcpServers: Record<
    string,
    {
      command: string;
      args: string[];
      env?: Record<string, string>;
    }
  >;
}

function buildMcpConfig(workspacePath: string, sourcePath: string): McpConfig {
  const memoryServerPath = path
    .join(sourcePath, "mcp-servers", "terminator-memory", "dist", "index.js")
    .replace(/\\/g, "/");

  const dbPath = path
    .join(workspacePath, ".terminator", "memory.db")
    .replace(/\\/g, "/");

  const serverPath = (name: string) =>
    path.join(sourcePath, "mcp-servers", name, "dist", "index.js").replace(/\\/g, "/");

  const terminatorDir = path.join(workspacePath, ".terminator").replace(/\\/g, "/");

  return {
    mcpServers: {
      "terminator-memory": {
        command: "node",
        args: [memoryServerPath],
        env: {
          DB_PATH: dbPath,
        },
      },
      "terminator-scheduler": {
        command: "node",
        args: [serverPath("terminator-scheduler")],
        env: {
          SCHEDULER_DB_PATH: `${terminatorDir}/schedules.db`,
        },
      },
      "terminator-comms": {
        command: "node",
        args: [serverPath("terminator-comms")],
      },
      "terminator-browser": {
        command: "node",
        args: [serverPath("terminator-browser")],
        env: {
          BROWSER_DB_PATH: `${terminatorDir}/browser-cache.db`,
        },
      },
      "terminator-data": {
        command: "node",
        args: [serverPath("terminator-data")],
        env: {
          DATA_DB_PATH: `${terminatorDir}/data.db`,
        },
      },
      "terminator-files": {
        command: "node",
        args: [serverPath("terminator-files")],
      },
      "terminator-system": {
        command: "node",
        args: [serverPath("terminator-system")],
      },
    },
  };
}

function getMcpConfigPath(workspacePath: string, ide: IDE): string {
  switch (ide) {
    case "cursor":
      return path.join(workspacePath, ".cursor", "mcp.json");
    case "windsurf":
    case "claude-code":
    case "cline":
    case "vscode":
    case "unknown":
    default:
      return path.join(workspacePath, ".mcp.json");
  }
}

function writeMcpConfig(configPath: string, config: McpConfig): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // If config file already exists, merge (don't overwrite user's other MCP servers)
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (existing.mcpServers) {
        existing.mcpServers = {
          ...existing.mcpServers,
          ...config.mcpServers,
        };
        fs.writeFileSync(configPath, JSON.stringify(existing, null, 2), "utf-8");
        return;
      }
    } catch {
      // If parse fails, overwrite
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function configureMcp(workspacePath: string, ide: IDE, sourcePath?: string): string {
  const config = buildMcpConfig(workspacePath, sourcePath || workspacePath);
  const configPath = getMcpConfigPath(workspacePath, ide);

  // Write workspace-level config
  writeMcpConfig(configPath, config);

  // For Windsurf, also write to the global mcp_config.json
  // Windsurf reads from ~/.codeium/windsurf/mcp_config.json
  if (ide === "windsurf") {
    const globalConfigPath = path.join(os.homedir(), ".codeium", "windsurf", "mcp_config.json");
    writeMcpConfig(globalConfigPath, config);
  }

  return configPath;
}
