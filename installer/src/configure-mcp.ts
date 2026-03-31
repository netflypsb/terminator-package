import fs from "fs";
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

function buildMcpConfig(workspacePath: string): McpConfig {
  const memoryServerPath = path
    .join(workspacePath, "mcp-servers", "terminator-memory", "dist", "index.js")
    .replace(/\\/g, "/");

  const dbPath = path
    .join(workspacePath, ".terminator", "memory.db")
    .replace(/\\/g, "/");

  const serverPath = (name: string) =>
    path.join(workspacePath, "mcp-servers", name, "dist", "index.js").replace(/\\/g, "/");

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

export function configureMcp(workspacePath: string, ide: IDE): string {
  const config = buildMcpConfig(workspacePath);
  const configPath = getMcpConfigPath(workspacePath, ide);

  // Ensure parent directory exists
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // If config file already exists, merge (don't overwrite user's other MCP servers)
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (existing.mcpServers) {
        // Merge: our servers override, but keep user's other servers
        existing.mcpServers = {
          ...existing.mcpServers,
          ...config.mcpServers,
        };
        fs.writeFileSync(configPath, JSON.stringify(existing, null, 2), "utf-8");
        return configPath;
      }
    } catch {
      // If parse fails, overwrite
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  return configPath;
}
