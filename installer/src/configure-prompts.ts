import fs from "fs";
import path from "path";
import type { IDE } from "./detect-ide.js";

function getPromptFilePath(workspacePath: string, ide: IDE): string | null {
  switch (ide) {
    case "windsurf":
      return path.join(workspacePath, ".windsurfrules");
    case "cursor":
      return path.join(workspacePath, ".cursorrules");
    case "claude-code":
      return path.join(workspacePath, "CLAUDE.md");
    case "cline":
      return path.join(workspacePath, ".clinerules");
    case "vscode":
      return path.join(workspacePath, ".github", "copilot-instructions.md");
    default:
      return null;
  }
}

function buildPromptContent(workspacePath: string): string {
  // Read the master TERMINATOR.md
  const terminatorPath = path.join(workspacePath, "TERMINATOR.md");

  if (!fs.existsSync(terminatorPath)) {
    throw new Error(
      `TERMINATOR.md not found at ${terminatorPath}. Is this the terminator-package root?`
    );
  }

  return fs.readFileSync(terminatorPath, "utf-8");
}

export function configurePrompts(
  workspacePath: string,
  ide: IDE
): string | null {
  const promptPath = getPromptFilePath(workspacePath, ide);

  if (!promptPath) {
    return null;
  }

  // For Claude Code, TERMINATOR.md IS the prompt file (CLAUDE.md equivalent)
  // We create a CLAUDE.md that references TERMINATOR.md
  if (ide === "claude-code") {
    const content = [
      "# Claude Code Configuration",
      "",
      "Read and follow all instructions in TERMINATOR.md in this workspace.",
      "TERMINATOR.md is your primary system prompt and defines your capabilities,",
      "behavioral rules, available MCP tools, skills, and task patterns.",
      "",
      "You are Terminator — an autonomous AI knowledge worker.",
    ].join("\n");

    fs.writeFileSync(promptPath, content, "utf-8");
    return promptPath;
  }

  // For other IDEs, inject the TERMINATOR.md content directly
  const content = buildPromptContent(workspacePath);

  // Ensure parent directory exists (e.g., .github/)
  const dir = path.dirname(promptPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Don't overwrite if file already exists and contains Terminator content
  if (fs.existsSync(promptPath)) {
    const existing = fs.readFileSync(promptPath, "utf-8");
    if (existing.includes("Terminator")) {
      // Already configured, update it
      fs.writeFileSync(promptPath, content, "utf-8");
      return promptPath;
    }
    // Append to existing rules
    fs.writeFileSync(
      promptPath,
      existing + "\n\n" + content,
      "utf-8"
    );
    return promptPath;
  }

  fs.writeFileSync(promptPath, content, "utf-8");
  return promptPath;
}
