#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { TerminatorInstaller } from './installer.js';
import { detectIDE, getIDEConfig } from './ide-detector.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('terminator')
  .description('Install Terminator AI Worker in any IDE')
  .version('0.1.0');

program
  .command('install')
  .description('Install Terminator AI Worker')
  .option('-i, --ide <ide>', 'Target IDE (auto-detect if not specified)')
  .option('-p, --path <path>', 'Installation path (current directory if not specified)')
  .option('-f, --force', 'Force reinstall even if already installed')
  .option('--embedded', 'Use embedded mode (default)')
  .option('--standalone', 'Use standalone mode')
  .option('--dev', 'Install development version')
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('🤖 Terminator AI Worker Installer'));
      console.log(chalk.gray('Transforming any IDE into an autonomous AI worker...\n'));

      const spinner = ora('Detecting environment...').start();

      // Detect IDE if not specified
      const ide = options.ide || detectIDE();
      if (!ide) {
        spinner.fail('Could not detect IDE');
        console.log(chalk.yellow('Supported IDEs: VS Code, Cursor, Windsurf, Claude Code'));
        process.exit(1);
      }

      spinner.succeed(`Detected IDE: ${chalk.green(ide)}`);

      // Get IDE-specific configuration
      const ideConfig = getIDEConfig(ide);
      spinner.start('Configuring installation...');

      // Determine installation path
      const installPath = options.path || process.cwd();

      // Determine mode
      const mode = options.standalone ? 'standalone' : 'embedded';

      spinner.succeed(`Installation mode: ${chalk.green(mode)}`);

      // Confirm installation
      if (!options.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Install Terminator in ${chalk.cyan(installPath)} for ${chalk.cyan(ide)} in ${chalk.cyan(mode)} mode?`,
            default: true
          }
        ]);

        if (!answers.confirm) {
          console.log(chalk.yellow('Installation cancelled'));
          process.exit(0);
        }
      }

      // Install Terminator
      const installer = new TerminatorInstaller({
        ide,
        path: installPath,
        mode,
        force: options.force,
        dev: options.dev
      });

      await installer.install();

      console.log(chalk.green.bold('\n✅ Terminator AI Worker installed successfully!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.white(`1. Restart your ${ide} IDE`));
      console.log(chalk.white('2. Open your project folder'));
      console.log(chalk.white('3. Ask your AI agent: "Read the INSTALL section in .terminator-package/TERMINATOR.md and set up Terminator"'));
      
      if (ideConfig.extension) {
        console.log(chalk.white(`4. Install the ${ideConfig.extension.name} extension from the marketplace`));
      }

      console.log(chalk.cyan('\n🚀 Your AI agent is now Terminator - an autonomous knowledge worker!'));

    } catch (error) {
      console.error(chalk.red('Installation failed:'), error);
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Check Terminator installation health')
  .action(async () => {
    try {
      const installer = new TerminatorInstaller();
      await installer.doctor();
    } catch (error) {
      console.error(chalk.red('Health check failed:'), error);
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Uninstall Terminator AI Worker')
  .option('-p, --path <path>', 'Installation path (current directory if not specified)')
  .option('--all', 'Remove all Terminator installations')
  .action(async (options) => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: options.all 
            ? 'Remove all Terminator installations from this system?'
            : `Remove Terminator from ${chalk.cyan(options.path || process.cwd())}?`,
          default: false
        }
      ]);

      if (!answers.confirm) {
        console.log(chalk.yellow('Uninstallation cancelled'));
        process.exit(0);
      }

      const installer = new TerminatorInstaller({
        path: options.path,
        removeAll: options.all
      });

      await installer.uninstall();

      console.log(chalk.green.bold('✅ Terminator AI Worker uninstalled successfully!'));
    } catch (error) {
      console.error(chalk.red('Uninstallation failed:'), error);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update Terminator AI Worker to latest version')
  .option('-p, --path <path>', 'Installation path (current directory if not specified)')
  .action(async (options) => {
    try {
      const installer = new TerminatorInstaller({
        path: options.path
      });

      await installer.update();

      console.log(chalk.green.bold('✅ Terminator AI Worker updated successfully!'));
    } catch (error) {
      console.error(chalk.red('Update failed:'), error);
      process.exit(1);
    }
  });

program.parse();
