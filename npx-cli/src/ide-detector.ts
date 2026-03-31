import { promises as fs } from 'fs';
import path from 'path';

export interface IDEConfig {
  name: string;
  configPaths: string[];
  extension?: {
    name: string;
    id: string;
  };
  prompts?: {
    configFile: string;
    mcpConfig: string;
  };
}

export const IDE_CONFIGS: Record<string, IDEConfig> = {
  vscode: {
    name: 'Visual Studio Code',
    configPaths: [
      path.join(process.env.USERPROFILE || '', '.vscode'),
      path.join(process.env.APPDATA || '', 'Code', 'User'),
      path.join(process.env.APPDATA || '', 'Code - Insiders', 'User')
    ],
    extension: {
      name: 'Terminator Panel',
      id: 'netflypsb.terminator-panel'
    },
    prompts: {
      configFile: 'settings.json',
      mcpConfig: 'mcp.json'
    }
  },
  cursor: {
    name: 'Cursor',
    configPaths: [
      path.join(process.env.USERPROFILE || '', '.cursor'),
      path.join(process.env.APPDATA || '', 'Cursor', 'User')
    ],
    extension: {
      name: 'Terminator Panel',
      id: 'netflypsb.terminator-panel'
    },
    prompts: {
      configFile: 'settings.json',
      mcpConfig: 'mcp.json'
    }
  },
  windsurf: {
    name: 'Windsurf',
    configPaths: [
      path.join(process.env.USERPROFILE || '', '.windsurf'),
      path.join(process.env.APPDATA || '', 'Windsurf', 'User')
    ],
    extension: {
      name: 'Terminator Panel',
      id: 'netflypsb.terminator-panel'
    },
    prompts: {
      configFile: 'settings.json',
      mcpConfig: 'mcp.json'
    }
  },
  'claude-code': {
    name: 'Claude Code',
    configPaths: [
      path.join(process.env.USERPROFILE || '', '.claude'),
      path.join(process.env.APPDATA || '', 'Claude', 'User')
    ],
    extension: {
      name: 'Terminator Panel',
      id: 'netflypsb.terminator-panel'
    }
  }
};

async function detectIDEFromWorkspace(): Promise<string | null> {
  const workspacePath = process.cwd();
  
  // Check for IDE-specific workspace files
  const ideIndicators = [
    { name: 'vscode', files: ['.vscode/settings.json', '.vscode/extensions.json'] },
    { name: 'cursor', files: ['.cursor/settings.json', '.cursor/extensions.json'] },
    { name: 'windsurf', files: ['.windsurf/settings.json', '.windsurf/extensions.json'] },
    { name: 'claude-code', files: ['.claude/settings.json'] }
  ];
  
  for (const ide of ideIndicators) {
    for (const file of ide.files) {
      const filePath = path.join(workspacePath, file);
      try {
        await fs.access(filePath);
        return ide.name;
      } catch {
        // File doesn't exist, continue checking
      }
    }
  }
  
  return null;
}

export function detectIDE(): string | null {
  // Check environment variables and running processes
  const envVars = process.env;
  
  // Check for VS Code
  if (envVars.VSCODE_PID || envVars.VSCODE_IPC_HOOK) {
    return 'vscode';
  }
  
  // Check for Cursor
  if (envVars.CURSOR_PID || envVars.CURSOR_IPC_HOOK) {
    return 'cursor';
  }
  
  // Check for Windsurf
  if (envVars.WINDSURF_PID || envVars.WINDSURF_IPC_HOOK) {
    return 'windsurf';
  }
  
  // Check for Claude Code
  if (envVars.CLAUDE_CODE_PID || envVars.CLAUDE_CODE_IPC_HOOK) {
    return 'claude-code';
  }
  
  // Check workspace files (synchronous check)
  return detectIDEFromWorkspaceSync();
}

function detectIDEFromWorkspaceSync(): string | null {
  const workspacePath = process.cwd();
  
  // Simple synchronous check for common IDE files
  const ideIndicators = [
    { name: 'vscode', files: ['.vscode'] },
    { name: 'cursor', files: ['.cursor'] },
    { name: 'windsurf', files: ['.windsurf'] },
    { name: 'claude-code', files: ['.claude'] }
  ];
  
  for (const ide of ideIndicators) {
    for (const file of ide.files) {
      const filePath = path.join(workspacePath, file);
      try {
        // Use synchronous check for simplicity
        require('fs').accessSync(filePath);
        return ide.name;
      } catch {
        // File doesn't exist, continue checking
      }
    }
  }
  
  return null;
}

export function getIDEConfig(ide: string): IDEConfig {
  return IDE_CONFIGS[ide] || IDE_CONFIGS.vscode; // Default to VS Code
}

export function getSupportedIDEs(): string[] {
  return Object.keys(IDE_CONFIGS);
}

export function isIDESupported(ide: string): boolean {
  return ide in IDE_CONFIGS;
}
