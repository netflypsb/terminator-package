#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import tar from 'tar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showBanner() {
  colorLog('cyan', '🤖 Terminator AI Worker Installer');
  colorLog('bright', 'Transforming any IDE into an autonomous AI worker...\n');
}

async function detectIDE(): Promise<string> {
  const envVars = process.env;
  
  if (envVars.VSCODE_PID || envVars.VSCODE_IPC_HOOK) {
    return 'vscode';
  }
  
  if (envVars.CURSOR_PID || envVars.CURSOR_IPC_HOOK) {
    return 'cursor';
  }
  
  if (envVars.WINDSURF_PID || envVars.WINDSURF_IPC_HOOK) {
    return 'windsurf';
  }
  
  if (envVars.CLAUDE_CODE_PID || envVars.CLAUDE_CODE_IPC_HOOK) {
    return 'claude-code';
  }
  
  return 'unknown';
}

async function downloadAndExtract(url: string, targetPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await fs.mkdir(targetPath, { recursive: true });
  
  // Extract tar.gz
  await pipeline(
    createReadStream(Buffer.from(buffer)),
    tar.x({
      cwd: targetPath,
      strip: 1 // Remove top-level directory
    })
  );
}

async function installDependencies(installPath: string): Promise<void> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve, reject) => {
    const process = spawn('pnpm', ['install'], {
      cwd: installPath,
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`pnpm install failed with code ${code}`));
      }
    });
  });
}

async function buildPackage(installPath: string): Promise<void> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve, reject) => {
    const process = spawn('pnpm', ['build'], {
      cwd: installPath,
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`pnpm build failed with code ${code}`));
      }
    });
  });
}

async function runInstaller(installPath: string): Promise<void> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve, reject) => {
    const process = spawn('node', ['installer/dist/install.js'], {
      cwd: installPath,
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`installer failed with code ${code}`));
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'install';
  
  try {
    switch (command) {
      case 'install':
        await handleInstall(args.slice(1));
        break;
      case 'doctor':
        await handleDoctor();
        break;
      case 'uninstall':
        await handleUninstall(args.slice(1));
        break;
      case 'update':
        await handleUpdate(args.slice(1));
        break;
      default:
        colorLog('red', `Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    colorLog('red', `Error: ${error}`);
    process.exit(1);
  }
}

async function handleInstall(args: string[]) {
  showBanner();
  
  // Parse options
  const options = {
    ide: '',
    path: process.cwd(),
    force: false,
    embedded: true,
    standalone: false,
    dev: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      
      switch (key) {
        case 'ide':
          options.ide = value;
          i++;
          break;
        case 'path':
          options.path = value;
          i++;
          break;
        case 'force':
          options.force = true;
          break;
        case 'embedded':
          options.embedded = true;
          break;
        case 'standalone':
          options.standalone = true;
          options.embedded = false;
          break;
        case 'dev':
          options.dev = true;
          break;
      }
    }
  }
  
  // Detect IDE if not specified
  const ide = options.ide || await detectIDE();
  if (ide === 'unknown') {
    colorLog('yellow', 'Could not detect IDE automatically');
    colorLog('cyan', 'Supported IDEs: VS Code, Cursor, Windsurf, Claude Code');
    colorLog('cyan', 'Use --ide <ide> to specify manually');
    process.exit(1);
  }
  
  colorLog('green', `Detected IDE: ${ide}`);
  
  // Determine installation path
  const installPath = options.embedded 
    ? path.join(options.path, '.terminator-package')
    : options.path;
  
  colorLog('green', `Installation mode: ${options.embedded ? 'embedded' : 'standalone'}`);
  colorLog('green', `Installation path: ${installPath}`);
  
  // Check if already installed
  if (!options.force) {
    try {
      await fs.access(installPath);
      colorLog('yellow', 'Terminator already installed at this location');
      colorLog('cyan', 'Use --force to reinstall');
      return;
    } catch {
      // Not installed, continue
    }
  }
  
  colorLog('cyan', 'Downloading Terminator package...');
  
  // Download and extract Terminator
  const repoUrl = options.dev 
    ? 'https://github.com/netflypsb/terminator-package/archive/refs/heads/develop.tar.gz'
    : 'https://github.com/netflypsb/terminator-package/archive/refs/heads/master.tar.gz';
  
  await downloadAndExtract(repoUrl, installPath);
  
  colorLog('green', '✓ Downloaded Terminator package');
  
  // Install dependencies
  colorLog('cyan', 'Installing dependencies...');
  await installDependencies(installPath);
  colorLog('green', '✓ Dependencies installed');
  
  // Build package
  colorLog('cyan', 'Building Terminator components...');
  await buildPackage(installPath);
  colorLog('green', '✓ Components built');
  
  // Run installer
  colorLog('cyan', 'Configuring IDE integration...');
  try {
    await runInstaller(installPath);
    colorLog('green', '✓ IDE integration configured');
  } catch (error) {
    colorLog('yellow', `⚠ IDE configuration warning: ${error}`);
  }
  
  colorLog('green', '\n✅ Terminator AI Worker installed successfully!');
  colorLog('cyan', '\nNext steps:');
  colorLog('white', `1. Restart your ${ide} IDE`);
  colorLog('white', '2. Open your project folder');
  colorLog('white', '3. Ask your AI agent: "Read the INSTALL section in .terminator-package/TERMINATOR.md and set up Terminator"');
  
  if (ide !== 'claude-code') {
    colorLog('white', `4. Install the "Terminator Panel" extension from your IDE's marketplace`);
  }
  
  colorLog('bright', '\n🚀 Your AI agent is now Terminator - an autonomous knowledge worker!');
}

async function handleDoctor() {
  colorLog('cyan', '🔍 Checking Terminator installation health...');
  
  const installPath = path.join(process.cwd(), '.terminator-package');
  
  try {
    await fs.access(installPath);
    colorLog('green', '✓ Installation found');
    
    // Check MCP servers
    const mcpPath = path.join(installPath, 'mcp-servers');
    await fs.access(mcpPath);
    colorLog('green', '✓ MCP servers available');
    
    // Check skills
    const skillsPath = path.join(installPath, 'skills');
    await fs.access(skillsPath);
    colorLog('green', '✓ Skills available');
    
    // Check build artifacts
    const distPath = path.join(installPath, 'mcp-servers', 'terminator-memory', 'dist');
    await fs.access(distPath);
    colorLog('green', '✓ Build artifacts present');
    
    // Check node_modules
    const nodeModulesPath = path.join(installPath, 'node_modules');
    await fs.access(nodeModulesPath);
    colorLog('green', '✓ Dependencies installed');
    
    colorLog('green', '\n✅ All systems healthy!');
    
  } catch (error) {
    colorLog('red', '\n❌ Issues detected:');
    colorLog('yellow', 'Run "terminator install --force" to fix installation');
  }
}

async function handleUninstall(args: string[]) {
  const installPath = path.join(process.cwd(), '.terminator-package');
  
  try {
    await fs.access(installPath);
    await fs.rm(installPath, { recursive: true, force: true });
    colorLog('green', '✅ Terminator AI Worker uninstalled successfully!');
  } catch {
    colorLog('yellow', 'Terminator not found in current directory');
  }
}

async function handleUpdate(args: string[]) {
  colorLog('cyan', '🔄 Updating Terminator AI Worker...');
  
  // Reinstall with force flag
  await handleInstall(['--force', ...args]);
  
  colorLog('green', '✅ Terminator AI Worker updated successfully!');
}

// Run main function
main().catch(error => {
  colorLog('red', `Fatal error: ${error}`);
  process.exit(1);
});
