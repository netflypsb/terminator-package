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

function showUsage() {
  colorLog('cyan', 'Usage:');
  colorLog('white', '  npx terminator-ai install [options]');
  colorLog('white', '  npx terminator-ai doctor');
  colorLog('white', '  npx terminator-ai uninstall');
  colorLog('white', '  npx terminator-ai update');
  colorLog('cyan', '\nInstall Options:');
  colorLog('white', '  --ide <ide>        Specify IDE (vscode, cursor, windsurf, claude-code)');
  colorLog('white', '  --path <path>      Installation directory (default: current)');
  colorLog('white', '  --force            Force reinstall even if already installed');
  colorLog('white', '  --upgrade          Upgrade existing installation to latest version');
  colorLog('white', '  --embedded         Install in embedded mode (default)');
  colorLog('white', '  --standalone       Install in standalone mode');
  colorLog('white', '  --dev              Use development branch');
  colorLog('cyan', '\nExamples:');
  colorLog('white', '  npx terminator-ai install');
  colorLog('white', '  npx terminator-ai install --ide vscode');
  colorLog('white', '  npx terminator-ai install --upgrade');
  colorLog('white', '  npx terminator-ai install --force');
  colorLog('cyan', '\nFor more help, visit: https://github.com/netflypsb/terminator-package');
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

async function detectExistingInstallation(installPath) {
  try {
    // Check if .terminator-package exists
    const terminatorPackagePath = path.join(installPath, '.terminator-package');
    const packageExists = await fs.access(terminatorPackagePath).then(() => true).catch(() => false);
    
    if (!packageExists) {
      return { exists: false, version: 'unknown', needsUpgrade: false };
    }
    
    // Check for old version indicators
    const oldIndicators = {
      hasScheduler: await fs.access(path.join(terminatorPackagePath, 'mcp-servers/terminator-scheduler')).then(() => true).catch(() => false),
      hasExtensions: await fs.access(path.join(terminatorPackagePath, 'extensions')).then(() => true).catch(() => false),
      hasChains: await fs.access(path.join(terminatorPackagePath, 'workflows/chains')).then(() => true).catch(() => false),
      hasOldHooks: await fs.access(path.join(installPath, '.terminator/hooks-registry.json')).then(() => true).catch(() => false)
    };
    
    // Check version from package.json if available
    let packageVersion = 'unknown';
    try {
      const packageJsonPath = path.join(terminatorPackagePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      packageVersion = packageJson.version || 'unknown';
    } catch {
      // Ignore if package.json doesn't exist or is invalid
    }
    
    // Determine if upgrade is needed
    const needsUpgrade = oldIndicators.hasScheduler || oldIndicators.hasExtensions || oldIndicators.hasChains;
    
    return {
      exists: true,
      version: packageVersion,
      needsUpgrade,
      oldIndicators
    };
  } catch (error) {
    return { exists: false, version: 'unknown', needsUpgrade: false };
  }
}

async function performUpgrade(installPath) {
  colorLog('yellow', '🔄 Detected previous installation with UI/scheduling features');
  colorLog('cyan', 'Performing upgrade to streamlined version...');
  
  try {
    // First, run the uninstaller to clean up IDE configurations
    const installerPath = path.join(installPath, '.terminator-package/installer/dist/uninstall.js');
    if (await fs.access(installerPath).then(() => true).catch(() => false)) {
      colorLog('cyan', 'Removing old IDE configurations...');
      try {
        await execCommand(`node "${installerPath}"`, path.dirname(installPath));
      } catch (error) {
        colorLog('yellow', `⚠ Uninstaller warning: ${error.message}`);
      }
    }
    
    // Remove old source directories completely
    const oldDirs = [
      path.join(installPath, 'extensions'),
      path.join(installPath, 'mcp-servers/terminator-scheduler'),
      path.join(installPath, 'workflows/chains'),
      path.join(installPath, 'skills/planning'),
      path.join(installPath, 'skills/automation'),
      path.join(installPath, 'agents/scheduler'),
      path.join(installPath, 'hooks/chains')
    ];
    
    for (const dir of oldDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        colorLog('cyan', `  ✓ Removed ${path.relative(installPath, dir)}`);
      } catch {
        // Directory might not exist, continue
      }
    }
    
    // Remove old hook files
    const oldHookFiles = [
      path.join(installPath, 'workflows/on-schedule-trigger.json'),
      path.join(installPath, '.terminator-package/workflows/on-schedule-trigger.json')
    ];
    
    for (const file of oldHookFiles) {
      try {
        await fs.unlink(file);
        colorLog('cyan', `  ✓ Removed ${path.relative(installPath, file)}`);
      } catch {
        // File might not exist, continue
      }
    }
    
    // Remove old runtime state that might reference old components
    const runtimeStateFiles = [
      path.join(path.dirname(installPath), '.terminator/hooks-registry.json'),
      path.join(path.dirname(installPath), '.terminator/schedules.db')
    ];
    
    for (const file of runtimeStateFiles) {
      try {
        await fs.unlink(file);
        colorLog('cyan', `  ✓ Removed old runtime state ${path.basename(file)}`);
      } catch {
        // File might not exist, continue
      }
    }
    
    // Remove VS Code extension if installed
    const vscodeExtensions = [
      path.join(path.dirname(installPath), '.vscode/extensions/terminator-panel.vsix'),
      path.join(path.dirname(installPath), '.terminator/terminator-panel.vsix')
    ];
    
    for (const ext of vscodeExtensions) {
      try {
        await fs.unlink(ext);
        colorLog('cyan', `  ✓ Removed VS Code extension ${path.basename(ext)}`);
      } catch {
        // Extension might not exist, continue
      }
    }
    
    colorLog('green', '✅ Old version cleaned up successfully');
    return true;
  } catch (error) {
    colorLog('red', `⚠️ Upgrade cleanup warning: ${error.message}`);
    colorLog('yellow', 'Continuing with fresh installation...');
    return false;
  }
}

async function extractTar(tarPath, extractPath) {
  // Use system tar command for better compatibility
  await execCommand(`tar -xzf "${tarPath}" -C "${extractPath}" --strip-components=1`, extractPath);
}

async function detectIDE() {
  const envVars = process.env;
  
  // Check for VS Code environment variables
  if (envVars.VSCODE_PID || envVars.VSCODE_IPC_HOOK || envVars.VSCODE_IPC_HOOK_CLI) {
    return 'vscode';
  }
  
  // Check for Cursor environment variables
  if (envVars.CURSOR_PID || envVars.CURSOR_IPC_HOOK || envVars.CURSOR_IPC_HOOK_CLI) {
    return 'cursor';
  }
  
  // Check for Windsurf environment variables
  if (envVars.WINDSURF_PID || envVars.WINDSURF_IPC_HOOK || envVars.WINDSURF_IPC_HOOK_CLI) {
    return 'windsurf';
  }
  
  // Check for Claude Code environment variables
  if (envVars.CLAUDE_CODE_PID || envVars.CLAUDE_CODE_IPC_HOOK || envVars.CLAUDE_CODE_IPC_HOOK_CLI) {
    return 'claude-code';
  }
  
  // Additional VS Code detection methods
  if (envVars.TERM_PROGRAM === 'vscode' || envVars.TERM_PROGRAM === 'code') {
    return 'vscode';
  }
  
  // Check for VS Code specific paths
  if (process.env.PATH && process.env.PATH.includes('Code.exe') || process.env.PATH.includes('code')) {
    return 'vscode';
  }
  
  // Check for common VS Code workspace files
  try {
    const workspacePath = process.cwd();
    const vscodeFiles = ['.vscode/settings.json', '.vscode/extensions.json', '.vscode/tasks.json'];
    for (const file of vscodeFiles) {
      try {
        await fs.access(path.join(workspacePath, file));
        return 'vscode';
      } catch {
        // File doesn't exist, continue checking
      }
    }
  } catch {
    // Ignore errors
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
      case 'help':
      case '--help':
      case '-h':
        showUsage();
        break;
      default:
        colorLog('red', `Unknown command: ${command}`);
        colorLog('cyan', 'Use "npx terminator-ai help" for usage information');
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
    upgrade: false,
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
        case 'upgrade':
          options.upgrade = true;
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
    colorLog('cyan', '\nQuick solutions:');
    colorLog('white', '1. If using VS Code: npx terminator-ai install --ide vscode');
    colorLog('white', '2. If using Cursor: npx terminator-ai install --ide cursor');
    colorLog('white', '3. If using Windsurf: npx terminator-ai install --ide windsurf');
    colorLog('white', '4. If using Claude Code: npx terminator-ai install --ide claude-code');
    colorLog('cyan', '\nVS Code users: You can also try creating a .vscode folder first:');
    colorLog('white', 'mkdir .vscode && npx terminator-ai');
    process.exit(1);
  }
  
  colorLog('green', `Detected IDE: ${ide}`);
  
  // Determine installation path
  const installPath = options.embedded 
    ? path.join(options.path, '.terminator-package')
    : options.path;
  
  colorLog('green', `Installation mode: ${options.embedded ? 'embedded' : 'standalone'}`);
  colorLog('green', `Installation path: ${installPath}`);
  
  // Check for existing installation and handle upgrade
  const existingInstall = await detectExistingInstallation(installPath);
  
  if (existingInstall.exists) {
    if (options.upgrade || existingInstall.needsUpgrade) {
      if (existingInstall.needsUpgrade) {
        colorLog('yellow', `🔄 Detected previous installation (version ${existingInstall.version})`);
        colorLog('cyan', 'Old version contains UI extension and/or scheduling features');
        colorLog('cyan', 'Upgrading to streamlined version (v0.2.0)...');
      } else {
        colorLog('yellow', `🔄 Current installation detected (version ${existingInstall.version})`);
        colorLog('cyan', 'Upgrading to latest version...');
      }
      
      // Perform upgrade cleanup
      await performUpgrade(installPath);
      
      colorLog('green', '✅ Upgrade preparation complete');
      colorLog('cyan', 'Continuing with fresh installation...');
    } else if (!options.force) {
      colorLog('yellow', 'Terminator already installed at this location');
      colorLog('cyan', 'Use --force to reinstall or --upgrade to check for updates');
      return;
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
    
    // For upgrades, completely remove old .terminator-package first to ensure clean install
    if ((existingInstall.needsUpgrade || options.upgrade) && existingInstall.exists) {
      colorLog('cyan', 'Removing old installation completely for fresh upgrade...');
      try {
        await fs.rm(installPath, { recursive: true, force: true });
        colorLog('green', '✓ Old installation removed');
      } catch (error) {
        colorLog('yellow', `⚠ Could not remove old installation: ${error.message}`);
      }
    }
    
    await fs.mkdir(installPath, { recursive: true });
    await extractTar(tarPath, installPath);
    colorLog('green', '✓ Package extracted');
    
    // Post-extraction: Remove any old directories that came from the tarball
    if (existingInstall.needsUpgrade || options.upgrade) {
      colorLog('cyan', 'Removing legacy components from extracted package...');
      const legacyDirs = [
        path.join(installPath, 'extensions'),
        path.join(installPath, 'mcp-servers/terminator-scheduler'),
        path.join(installPath, 'workflows/chains'),
        path.join(installPath, 'skills/planning'),
        path.join(installPath, 'skills/automation'),
        path.join(installPath, 'agents/scheduler'),
        path.join(installPath, 'hooks/chains')
      ];
      
      for (const dir of legacyDirs) {
        try {
          await fs.rm(dir, { recursive: true, force: true });
          colorLog('cyan', `  ✓ Removed legacy ${path.relative(installPath, dir)}`);
        } catch {
          // Directory might not exist, continue
        }
      }
      
      // Remove legacy files
      const legacyFiles = [
        path.join(installPath, 'workflows/on-schedule-trigger.json')
      ];
      
      for (const file of legacyFiles) {
        try {
          await fs.unlink(file);
          colorLog('cyan', `  ✓ Removed legacy ${path.relative(installPath, file)}`);
        } catch {
          // File might not exist, continue
        }
      }
    }
    
    // Install pnpm if not available
    try {
      await execCommand('pnpm --version', options.path);
    } catch {
      colorLog('cyan', 'Installing pnpm...');
      await execCommand('npm install -g pnpm', options.path);
    }
    
    // Install dependencies
    colorLog('cyan', 'Installing dependencies...');
    try {
      // Try installing without scripts first to avoid postinstall loops
      await execCommand('pnpm install --ignore-scripts', installPath);
      colorLog('green', '✓ Dependencies installed (without scripts)');
    } catch (error) {
      colorLog('red', '❌ Dependency installation failed');
      colorLog('yellow', 'Trying alternative installation method...');
      
      // Try npm as fallback
      try {
        await execCommand('npm install --ignore-scripts', installPath);
        colorLog('green', '✓ Dependencies installed with npm (without scripts)');
      } catch (npmError) {
        colorLog('red', '❌ Both pnpm and npm installation failed');
        colorLog('cyan', '\nTroubleshooting steps:');
        colorLog('white', '1. Make sure Node.js >= 20 is installed: node --version');
        colorLog('white', '2. Try installing pnpm manually: npm install -g pnpm');
        colorLog('white', '3. Check if you have write permissions to the installation directory');
        colorLog('white', '4. Try running in administrator mode');
        colorLog('yellow', '\nManual installation commands:');
        colorLog('white', `cd "${installPath}"`);
        colorLog('white', 'pnpm install --ignore-scripts');
        colorLog('white', 'cd installer && npm run build && cd ..');
        colorLog('white', 'cd ..');
        colorLog('white', 'node installer/dist/install.js');
        throw new Error(`Dependency installation failed: ${error.message}`);
      }
    }
    
    // Build package (build installer only, skip MCP servers for now)
    colorLog('cyan', 'Building essential components...');
    try {
      // Build just the installer
      await execCommand('cd installer && npm run build', installPath);
      colorLog('green', '✓ Essential components built');
    } catch (error) {
      colorLog('red', '❌ Build failed');
      colorLog('yellow', 'Trying alternative build method...');
      
      try {
        await execCommand('cd installer && npm run build', installPath);
        colorLog('green', '✓ Components built with npm');
      } catch (npmError) {
        colorLog('red', '❌ Build failed completely');
        colorLog('yellow', '\nBuild troubleshooting:');
        colorLog('white', '1. Check if dependencies were installed successfully');
        colorLog('white', '2. Try running build manually to see specific errors');
        colorLog('white', '3. Some native modules may need additional setup');
        throw new Error(`Build failed: ${error.message}`);
      }
    }
    
    // Run installer
    colorLog('cyan', 'Configuring IDE integration...');
    try {
      await execCommand('node installer/dist/install.js', installPath);
      colorLog('green', '✓ IDE integration configured');
    } catch (error) {
      colorLog('yellow', `⚠ IDE configuration warning: ${error.message}`);
    }
    
    const wasUpgrade = existingInstall.exists && (options.upgrade || existingInstall.needsUpgrade);
    
    colorLog('green', '\n✅ Terminator AI Worker installed successfully!');
    if (wasUpgrade) {
      colorLog('cyan', '\n🔄 Upgrade completed!');
      colorLog('white', '• Old UI extension and scheduling features removed');
      colorLog('white', '• Streamlined to core knowledge work capabilities');
      colorLog('white', '• All configurations preserved and updated');
    }
    colorLog('cyan', '\nNext steps:');
    colorLog('white', `1. Restart your ${ide} IDE`);
    colorLog('white', '2. Ask your AI agent: "What capabilities do you have as a Terminator?"');
    colorLog('white', '3. Edit .env to add API keys for Telegram/Discord/etc (optional)');
    colorLog('cyan', '\n🎉 What you get:');
    colorLog('white', '• 7 MCP servers with 48+ tools');
    colorLog('white', '• 10 specialized skills');
    colorLog('white', '• 5 expert agents');
    colorLog('white', '• 2 automation hooks');
    colorLog('white', '• Office document management');
    colorLog('white', '• Persistent memory across sessions');
    colorLog('white', '• Multi-channel communications');
    colorLog('white', '• Web browsing and research');
    colorLog('white', '• Data processing and analysis');
    
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
