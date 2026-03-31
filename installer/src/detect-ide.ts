import fs from "fs";
import path from "path";

export type IDE =
  | "windsurf"
  | "cursor"
  | "claude-code"
  | "cline"
  | "vscode"
  | "unknown";

export interface IDEDetectionResult {
  ide: IDE;
  label: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export function detectIDE(workspacePath: string): IDEDetectionResult {
  // Check for IDE-specific directories in the workspace
  const checks: { dir: string; ide: IDE; label: string }[] = [
    { dir: ".windsurf", ide: "windsurf", label: "Windsurf" },
    { dir: ".cursor", ide: "cursor", label: "Cursor" },
    { dir: ".claude", ide: "claude-code", label: "Claude Code" },
    { dir: ".cline", ide: "cline", label: "Cline" },
    { dir: ".vscode", ide: "vscode", label: "VS Code" },
  ];

  for (const check of checks) {
    const dirPath = path.join(workspacePath, check.dir);
    if (fs.existsSync(dirPath)) {
      return {
        ide: check.ide,
        label: check.label,
        confidence: "high",
        reason: `Found ${check.dir}/ directory in workspace`,
      };
    }
  }

  // Check environment variables for clues
  // Order matters: check fork-specific signals before generic vscode signals
  const envHints: { env: string; pattern: RegExp; ide: IDE; label: string }[] =
    [
      // Windsurf-specific: its path appears in GIT_ASKPASS env vars
      {
        env: "VSCODE_GIT_ASKPASS_NODE",
        pattern: /windsurf/i,
        ide: "windsurf",
        label: "Windsurf",
      },
      {
        env: "GIT_ASKPASS",
        pattern: /windsurf/i,
        ide: "windsurf",
        label: "Windsurf",
      },
      // Cursor-specific
      {
        env: "VSCODE_GIT_ASKPASS_NODE",
        pattern: /cursor/i,
        ide: "cursor",
        label: "Cursor",
      },
      {
        env: "GIT_ASKPASS",
        pattern: /cursor/i,
        ide: "cursor",
        label: "Cursor",
      },
      // Explicit TERM_PROGRAM checks
      {
        env: "TERM_PROGRAM",
        pattern: /windsurf/i,
        ide: "windsurf",
        label: "Windsurf",
      },
      {
        env: "TERM_PROGRAM",
        pattern: /cursor/i,
        ide: "cursor",
        label: "Cursor",
      },
      // Generic VS Code (last resort among env checks)
      {
        env: "TERM_PROGRAM",
        pattern: /vscode/i,
        ide: "vscode",
        label: "VS Code",
      },
      {
        env: "VSCODE_PID",
        pattern: /.+/,
        ide: "vscode",
        label: "VS Code (or fork)",
      },
    ];

  for (const hint of envHints) {
    const val = process.env[hint.env];
    if (val && hint.pattern.test(val)) {
      return {
        ide: hint.ide,
        label: hint.label,
        confidence: "medium",
        reason: `Environment variable ${hint.env}=${val}`,
      };
    }
  }

  // Default: assume VS Code-compatible since most agentic IDEs are forks
  return {
    ide: "vscode",
    label: "VS Code (default assumption)",
    confidence: "low",
    reason:
      "No IDE-specific markers found. Defaulting to VS Code-compatible config.",
  };
}
