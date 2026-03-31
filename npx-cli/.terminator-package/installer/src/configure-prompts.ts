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

function buildPromptContent(workspacePath: string, sourcePath: string): string {
  // Read the master TERMINATOR.md from the source location
  const terminatorPath = path.join(sourcePath, "TERMINATOR.md");

  if (!fs.existsSync(terminatorPath)) {
    throw new Error(
      `TERMINATOR.md not found at ${terminatorPath}. Is this the terminator-package root?`
    );
  }

  let content = fs.readFileSync(terminatorPath, "utf-8");

  // In embedded mode, rewrite path references so the agent finds files correctly
  const isEmbedded = sourcePath !== workspacePath;
  if (isEmbedded) {
    const relSource = path.relative(workspacePath, sourcePath).replace(/\\/g, "/");
    // Rewrite references to skills/, agents/, hooks/ directories
    content = content.replace(
      /Skills are markdown files in the `skills\/` directory/g,
      `Skills are markdown files in the \`${relSource}/skills/\` directory`
    );
    content = content.replace(
      /Agents are specialized subagent configurations in the `agents\/` directory/g,
      `Agents are specialized subagent configurations in the \`${relSource}/agents/\` directory`
    );
    content = content.replace(
      /They are defined in the `hooks\/` directory/g,
      `They are defined in the \`${relSource}/hooks/\` directory`
    );
    content = content.replace(
      /Chains are stored in `hooks\/chains\/`/g,
      `Chains are stored in \`${relSource}/hooks/chains/\``
    );
    // Add embedded mode awareness section
    content += `\n\n---\n\n## Terminator Package Location\n\n`;
    content += `Terminator source code is installed in the hidden folder \`${relSource}/\`.\n`;
    content += `This keeps the user's project directory clean.\n\n`;
    content += `- **MCP server source**: \`${relSource}/mcp-servers/\`\n`;
    content += `- **Skills**: \`${relSource}/skills/\`\n`;
    content += `- **Agents**: \`${relSource}/agents/\`\n`;
    content += `- **Hooks & chains**: \`${relSource}/hooks/\`\n`;
    content += `- **Guides**: \`${relSource}/resources/guides/\`\n`;
    content += `- **Runtime state**: \`.terminator/\` (at project root)\n`;
    content += `- **Config**: \`.terminator/config.json\`\n\n`;
    content += `**IMPORTANT**: Files outside \`${relSource}/\` and \`.terminator/\` belong to the user's project. `;
    content += `Do NOT confuse Terminator internal files with user project files.\n`;
  }

  return content;
}

export function configurePrompts(
  workspacePath: string,
  ide: IDE,
  sourcePath?: string
): string | null {
  const src = sourcePath || workspacePath;
  const promptPath = getPromptFilePath(workspacePath, ide);

  if (!promptPath) {
    return null;
  }

  const isEmbedded = src !== workspacePath;
  const relSource = isEmbedded ? path.relative(workspacePath, src).replace(/\\/g, "/") : "";

  // For Claude Code, create a CLAUDE.md that references TERMINATOR.md
  if (ide === "claude-code") {
    const terminatorRef = isEmbedded ? `${relSource}/TERMINATOR.md` : "TERMINATOR.md";
    const content = [
      "# Claude Code Configuration",
      "",
      `Read and follow all instructions in ${terminatorRef} in this workspace.`,
      "TERMINATOR.md is your primary system prompt and defines your capabilities,",
      "behavioral rules, available MCP tools, skills, and task patterns.",
      "",
      "You are Terminator — an autonomous AI knowledge worker.",
      isEmbedded ? `\nTerminator source is in \`${relSource}/\`. User project files are everything else.` : "",
    ].filter(Boolean).join("\n");

    fs.writeFileSync(promptPath, content, "utf-8");
    return promptPath;
  }

  // For other IDEs, inject the TERMINATOR.md content directly
  const content = buildPromptContent(workspacePath, src);

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
