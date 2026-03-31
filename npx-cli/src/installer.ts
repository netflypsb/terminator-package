import { promises as fs } from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import ora from 'ora';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './utils/logger.js';
import { detectIDE, getIDEConfig } from './ide-detector.js';

const execAsync = promisify(exec);

export interface InstallOptions {
  ide: string;
  path: string;
  mode: 'embedded' | 'standalone';
  force?: boolean;
  dev?: boolean;
  removeAll?: boolean;
}

export class TerminatorInstaller {
  private options: InstallOptions;
  private git: simpleGit.SimpleGit;

  constructor(options: Partial<InstallOptions> = {}) {
    this.options = {
      ide: options.ide || detectIDE() || 'unknown',
      path: options.path || process.cwd(),
      mode: options.mode || 'embedded',
      force: options.force || false,
      dev: options.dev || false,
      removeAll: options.removeAll || false
    };

    this.git = simpleGit();
  }

  async install(): Promise<void> {
    const spinner = ora('Installing Terminator AI Worker...').start();

    try {
      // Check if already installed
      if (!this.options.force) {
        const isInstalled = await this.checkInstallation();
        if (isInstalled) {
          spinner.warn('Terminator already installed');
          console.log(chalk.yellow('Use --force to reinstall'));
          return;
        }
      }

      // Clone or update repository
      spinner.text = 'Downloading Terminator package...';
      await this.cloneRepository();

      // Install dependencies
      spinner.text = 'Installing dependencies...';
      await this.installDependencies();

      // Build the package
      spinner.text = 'Building Terminator components...';
      await this.buildPackage();

      // Configure IDE-specific settings
      spinner.text = 'Configuring IDE integration...';
      await this.configureIDE();

      // Install UI extension if available
      const ideConfig = getIDEConfig(this.options.ide);
      if (ideConfig.extension) {
        spinner.text = 'Setting up UI extension...';
        await this.setupExtension(ideConfig);
      }

      // Run health check
      spinner.text = 'Running health check...';
      await this.doctor();

      spinner.succeed('Installation completed successfully');

    } catch (error) {
      spinner.fail('Installation failed');
      throw error;
    }
  }

  async uninstall(): Promise<void> {
    const spinner = ora('Uninstalling Terminator AI Worker...').start();

    try {
      if (this.options.removeAll) {
        await this.uninstallAll();
      } else {
        await this.uninstallSingle();
      }

      spinner.succeed('Uninstallation completed successfully');
    } catch (error) {
      spinner.fail('Uninstallation failed');
      throw error;
    }
  }

  async update(): Promise<void> {
    const spinner = ora('Updating Terminator AI Worker...').start();

    try {
      const terminatorPath = this.getTerminatorPath();
      
      // Update repository
      spinner.text = 'Updating repository...';
      this.git = simpleGit(terminatorPath);
      await this.git.pull('origin', 'master');

      // Reinstall dependencies
      spinner.text = 'Updating dependencies...';
      await this.installDependencies();

      // Rebuild
      spinner.text = 'Rebuilding components...';
      await this.buildPackage();

      // Health check
      spinner.text = 'Running health check...';
      await this.doctor();

      spinner.succeed('Update completed successfully');
    } catch (error) {
      spinner.fail('Update failed');
      throw error;
    }
  }

  async doctor(): Promise<void> {
    const spinner = ora('Checking installation health...').start();
    const healthChecks = [];

    try {
      // Check if Terminator is installed
      const terminatorPath = this.getTerminatorPath();
      const exists = await fs.access(terminatorPath).then(() => true).catch(() => false);
      healthChecks.push({ name: 'Installation', status: exists ? '✅' : '❌' });

      // Check MCP servers
      const mcpPath = path.join(terminatorPath, 'mcp-servers');
      const mcpExists = await fs.access(mcpPath).then(() => true).catch(() => false);
      healthChecks.push({ name: 'MCP Servers', status: mcpExists ? '✅' : '❌' });

      // Check skills
      const skillsPath = path.join(terminatorPath, 'skills');
      const skillsExists = await fs.access(skillsPath).then(() => true).catch(() => false);
      healthChecks.push({ name: 'Skills', status: skillsExists ? '✅' : '❌' });

      // Check build artifacts
      const distPath = path.join(terminatorPath, 'mcp-servers', 'terminator-memory', 'dist');
      const distExists = await fs.access(distPath).then(() => true).catch(() => false);
      healthChecks.push({ name: 'Build Artifacts', status: distExists ? '✅' : '❌' });

      // Check node_modules
      const nodeModulesPath = path.join(terminatorPath, 'node_modules');
      const nodeModulesExists = await fs.access(nodeModulesPath).then(() => true).catch(() => false);
      healthChecks.push({ name: 'Dependencies', status: nodeModulesExists ? '✅' : '❌' });

      spinner.succeed('Health check completed');

      console.log(chalk.cyan('\n📊 Installation Health Report:'));
      healthChecks.forEach(check => {
        const status = check.status === '✅' ? chalk.green(check.status) : chalk.red(check.status);
        console.log(`  ${status} ${check.name}`);
      });

      const allHealthy = healthChecks.every(check => check.status === '✅');
      if (allHealthy) {
        console.log(chalk.green.bold('\n✅ All systems healthy!'));
      } else {
        console.log(chalk.yellow('\n⚠️  Some issues detected. Run `terminator install --force` to fix.'));
      }

    } catch (error) {
      spinner.fail('Health check failed');
      throw error;
    }
  }

  private async cloneRepository(): Promise<void> {
    const terminatorPath = this.getTerminatorPath();
    
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(terminatorPath), { recursive: true });

    // Clone repository
    const repoUrl = this.options.dev 
      ? 'https://github.com/netflypsb/terminator-package.git'
      : 'https://github.com/netflypsb/terminator-package.git';

    if (await fs.access(terminatorPath).then(() => true).catch(() => false)) {
      // Update existing
      this.git = simpleGit(terminatorPath);
      await this.git.pull('origin', 'master');
    } else {
      // Clone fresh
      await this.git.clone(repoUrl, terminatorPath);
      this.git = simpleGit(terminatorPath);
    }

    // Checkout specific branch if dev
    if (this.options.dev) {
      await this.git.checkout('develop');
    }
  }

  private async installDependencies(): Promise<void> {
    const terminatorPath = this.getTerminatorPath();
    
    // Install pnpm if not available
    try {
      await execAsync('pnpm --version');
    } catch {
      await execAsync('npm install -g pnpm');
    }

    // Install dependencies
    await execAsync('cd "' + terminatorPath + '" && pnpm install', { 
      cwd: terminatorPath,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
  }

  private async buildPackage(): Promise<void> {
    const terminatorPath = this.getTerminatorPath();
    
    await execAsync('cd "' + terminatorPath + '" && pnpm build', {
      cwd: terminatorPath,
      maxBuffer: 1024 * 1024 * 10
    });
  }

  private async configureIDE(): Promise<void> {
    const terminatorPath = this.getTerminatorPath();
    const ideConfig = getIDEConfig(this.options.ide);

    // Run the installer script
    const installScript = path.join(terminatorPath, 'installer', 'dist', 'install.js');
    
    try {
      await execAsync(`node "${installScript}"`, {
        cwd: this.options.path,
        maxBuffer: 1024 * 1024 * 10,
        env: {
          ...process.env,
          TERMINATOR_IDE: this.options.ide,
          TERMINATOR_MODE: this.options.mode
        }
      });
    } catch (error) {
      logger.warn('IDE configuration failed, but installation continues');
    }
  }

  private async setupExtension(ideConfig: any): Promise<void> {
    // This would handle IDE-specific extension installation
    // For now, just show instructions
    console.log(chalk.cyan(`\n📦 Extension Setup:`));
    console.log(chalk.white(`Install "${ideConfig.extension.name}" from your IDE's marketplace`));
    console.log(chalk.gray(`Extension ID: ${ideConfig.extension.id}`));
  }

  private async checkInstallation(): Promise<boolean> {
    const terminatorPath = this.getTerminatorPath();
    return await fs.access(terminatorPath).then(() => true).catch(() => false);
  }

  private getTerminatorPath(): string {
    if (this.options.mode === 'embedded') {
      return path.join(this.options.path, '.terminator-package');
    } else {
      return this.options.path;
    }
  }

  private async uninstallSingle(): Promise<void> {
    const terminatorPath = this.getTerminatorPath();
    
    if (await fs.access(terminatorPath).then(() => true).catch(() => false)) {
      await fs.rm(terminatorPath, { recursive: true, force: true });
    }
  }

  private async uninstallAll(): Promise<void> {
    // This would search for all Terminator installations
    // For now, just remove from current directory
    await this.uninstallSingle();
  }
}
