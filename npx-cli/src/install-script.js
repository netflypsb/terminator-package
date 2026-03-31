#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
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

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showBanner() {
  colorLog('cyan', '🤖 Terminator AI Worker Installer');
  colorLog('bright', 'Transforming any IDE into an autonomous AI worker...\n');
}

function execCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { 
      cwd, 
      stdio: 'pipe', 
      shell: true,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function downloadFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(buffer));
}

async function extractTar(tarPath, extractPath) {
  // Use system tar command for better compatibility
  await execCommand(`tar -xzf "${tarPath}" -C "${extractPath}" --strip-components=1`, extractPath);
}

async function detectIDE() {
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
    colorLog('red', `Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleInstall(args) {
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
  
  // Create temp directory for download
  const tempDir = path.join(options.path, '.terminator-temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  try {
    colorLog('cyan', 'Downloading Terminator package...');
    
    // Download Terminator
    const repoUrl = options.dev 
      ? 'https://github.com/netflypsb/terminator-package/archive/refs/heads/develop.tar.gz'
      : 'https://github.com/netflypsb/terminator-package/archive/refs/heads/master.tar.gz';
    
    const tarPath = path.join(tempDir, 'terminator.tar.gz');
    await downloadFile(repoUrl, tarPath);
    
    colorLog('green', '✓ Downloaded Terminator package');
    
    // Extract
    colorLog('cyan', 'Extracting package...');
    await fs.mkdir(installPath, { recursive: true });
    await extractTar(tarPath, installPath);
    colorLog('green', '✓ Package extracted');
    
    // Install pnpm if not available
    try {
      await execCommand('pnpm --version', options.path);
    } catch {
      colorLog('cyan', 'Installing pnpm...');
      await execCommand('npm install -g pnpm', options.path);
    }
    
    // Install dependencies
    colorLog('cyan', 'Installing dependencies...');
    await execCommand('pnpm install', installPath);
    colorLog('green', '✓ Dependencies installed');
    
    // Build package
    colorLog('cyan', 'Building Terminator components...');
    await execCommand('pnpm build', installPath);
    colorLog('green', '✓ Components built');
    
    // Run installer
    colorLog('cyan', 'Configuring IDE integration...');
    try {
      await execCommand('node installer/dist/install.js', installPath);
      colorLog('green', '✓ IDE integration configured');
    } catch (error) {
      colorLog('yellow', `⚠ IDE configuration warning: ${error.message}`);
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
    
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
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

async function handleUninstall(args) {
  const installPath = path.join(process.cwd(), '.terminator-package');
  
  try {
    await fs.access(installPath);
    await fs.rm(installPath, { recursive: true, force: true });
    colorLog('green', '✅ Terminator AI Worker uninstalled successfully!');
  } catch {
    colorLog('yellow', 'Terminator not found in current directory');
  }
}

async function handleUpdate(args) {
  colorLog('cyan', '🔄 Updating Terminator AI Worker...');
  
  // Reinstall with force flag
  await handleInstall(['--force', ...args]);
  
  colorLog('green', '✅ Terminator AI Worker updated successfully!');
}

// Run main function
main().catch(error => {
  colorLog('red', `Fatal error: ${error.message}`);
  process.exit(1);
});
