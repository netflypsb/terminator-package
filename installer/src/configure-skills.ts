import fs from "fs";
import path from "path";
import type { IDE } from "./detect-ide.js";

const SKILLS = [
  "research",
  "writing",
  "analysis",
  "communication",
  "planning",
  "automation",
  "coding",
  "summarize",
  "onboarding",
];

const AGENTS = [
  "researcher",
  "writer",
  "analyst",
  "scheduler",
  "communicator",
  "supervisor",
];

interface SkillTarget {
  skillsDir: string | null;
  agentsDir: string | null;
  workflowsDir: string | null;
}

function getTargetDirs(workspacePath: string, ide: IDE): SkillTarget {
  switch (ide) {
    case "windsurf":
      return {
        skillsDir: path.join(workspacePath, ".windsurf", "skills"),
        agentsDir: path.join(workspacePath, ".windsurf", "agents"),
        workflowsDir: path.join(workspacePath, ".windsurf", "workflows"),
      };
    case "cursor":
      return {
        skillsDir: path.join(workspacePath, ".cursor", "skills"),
        agentsDir: path.join(workspacePath, ".cursor", "agents"),
        workflowsDir: null,
      };
    case "claude-code":
      return {
        skillsDir: path.join(workspacePath, ".claude", "skills"),
        agentsDir: path.join(workspacePath, ".claude", "agents"),
        workflowsDir: null,
      };
    case "cline":
      return {
        skillsDir: path.join(workspacePath, ".cline", "skills"),
        agentsDir: path.join(workspacePath, ".cline", "agents"),
        workflowsDir: null,
      };
    case "vscode":
    default:
      // For generic VS Code / unknown, use the canonical locations
      return {
        skillsDir: null,
        agentsDir: null,
        workflowsDir: null,
      };
  }
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src: string, dest: string): boolean {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

export interface SkillInstallResult {
  skillsCopied: number;
  agentsCopied: number;
  workflowsCreated: number;
  targetDirs: string[];
}

export function configureSkills(
  workspacePath: string,
  ide: IDE
): SkillInstallResult {
  const targets = getTargetDirs(workspacePath, ide);
  const result: SkillInstallResult = {
    skillsCopied: 0,
    agentsCopied: 0,
    workflowsCreated: 0,
    targetDirs: [],
  };

  const skillsSrcDir = path.join(workspacePath, "skills");
  const agentsSrcDir = path.join(workspacePath, "agents");

  // Copy skills to IDE-specific location
  if (targets.skillsDir) {
    ensureDir(targets.skillsDir);
    result.targetDirs.push(targets.skillsDir);

    for (const skill of SKILLS) {
      const src = path.join(skillsSrcDir, skill, "SKILL.md");
      const dest = path.join(targets.skillsDir, `${skill}.md`);
      if (copyFile(src, dest)) {
        result.skillsCopied++;
      }
    }
  }

  // Copy agents to IDE-specific location
  if (targets.agentsDir) {
    ensureDir(targets.agentsDir);
    result.targetDirs.push(targets.agentsDir);

    for (const agent of AGENTS) {
      const src = path.join(agentsSrcDir, `${agent}.md`);
      const dest = path.join(targets.agentsDir, `${agent}.md`);
      if (copyFile(src, dest)) {
        result.agentsCopied++;
      }
    }
  }

  // For Windsurf, also create workflow files from skills
  if (targets.workflowsDir) {
    ensureDir(targets.workflowsDir);
    result.targetDirs.push(targets.workflowsDir);

    for (const skill of SKILLS) {
      const skillSrc = path.join(skillsSrcDir, skill, "SKILL.md");
      if (!fs.existsSync(skillSrc)) continue;

      const content = fs.readFileSync(skillSrc, "utf-8");
      // Extract the YAML frontmatter description
      const descMatch = content.match(/^---\n[\s\S]*?description:\s*(.+)\n[\s\S]*?---/m);
      const description = descMatch ? descMatch[1].trim() : `Terminator ${skill} skill`;

      const workflow = [
        "---",
        `description: ${description}`,
        "---",
        "",
        `# ${skill.charAt(0).toUpperCase() + skill.slice(1)} Workflow`,
        "",
        `This workflow is powered by the Terminator ${skill} skill.`,
        `Read the full skill guide at: skills/${skill}/SKILL.md`,
        "",
        `To invoke this skill, reference the skill file or describe a task matching these triggers:`,
        "",
      ];

      // Extract triggers from frontmatter
      const triggersMatch = content.match(/triggers:\n((?:\s+-\s+.+\n)+)/);
      if (triggersMatch) {
        workflow.push(triggersMatch[1].trim());
      }

      const workflowPath = path.join(targets.workflowsDir, `${skill}.md`);
      fs.writeFileSync(workflowPath, workflow.join("\n"), "utf-8");
      result.workflowsCreated++;
    }
  }

  // Always create a skills index in .terminator/ for reference
  const indexPath = path.join(workspacePath, ".terminator", "skills-index.json");
  const index = {
    skills: SKILLS.map((s) => ({
      name: s,
      path: `skills/${s}/SKILL.md`,
      installed: fs.existsSync(path.join(skillsSrcDir, s, "SKILL.md")),
    })),
    agents: AGENTS.map((a) => ({
      name: a,
      path: `agents/${a}.md`,
      installed: fs.existsSync(path.join(agentsSrcDir, `${a}.md`)),
    })),
    ide,
    installedAt: new Date().toISOString(),
  };
  ensureDir(path.dirname(indexPath));
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");

  return result;
}
