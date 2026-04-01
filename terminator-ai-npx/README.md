# Terminator AI - NPX Package

Install Terminator AI Worker in any IDE with a single command.

## Quick Start

Transform any agentic IDE (VS Code, Cursor, Windsurf, Claude Code) into an autonomous AI worker:

```bash
npx terminator-ai
```

That's it! The installer will:
- ✅ Detect your IDE automatically
- ✅ Install all 7 MCP servers with 48+ tools
- ✅ Set up all 10 skills and 5 agents
- ✅ Configure IDE integration
- ✅ Set up office document management

## Features

### 🤖 What You Get
- **7 MCP servers** with 48+ tools
- **10 Skills** for specialized expertise
- **5 Agents** for complex tasks
- **Office Document Management** (Word, Excel, PowerPoint, PDF)
- **Persistent Memory** across sessions
- **Multi-channel Communications** (Telegram, Discord, Slack)
- **Web Browsing** and research
- **Data Processing** and analysis

### 🎯 Supported IDEs
- **Visual Studio Code**
- **Cursor**
- **Windsurf**
- **Claude Code**

## Usage

### Install Terminator
```bash
# Automatic detection and installation
npx terminator-ai

# Specify IDE manually
npx terminator-ai install --ide vscode

# Install in standalone mode
npx terminator-ai install --standalone

# Force reinstall
npx terminator-ai install --force
```

### Health Check
```bash
npx terminator-ai doctor
```

### Update Terminator
```bash
npx terminator-ai update
```

### Uninstall
```bash
npx terminator-ai uninstall
```

## Command Options

### Install Command
```bash
npx terminator-ai install [options]

Options:
  --ide <ide>          Target IDE (vscode, cursor, windsurf, claude-code)
  --path <path>        Installation path (default: current directory)
  --force              Force reinstall even if already installed
  --embedded           Use embedded mode (default)
  --standalone         Use standalone mode
  --dev                Install development version
```

### Examples

```bash
# Install for VS Code in embedded mode
npx terminator-ai install --ide vscode

# Install for Cursor in standalone mode
npx terminator-ai install --ide cursor --standalone

# Install development version
npx terminator-ai install --dev

# Install to specific directory
npx terminator-ai install --path /path/to/project
```

## Installation Modes

### Embedded Mode (Default)
Terminator is installed in a hidden `.terminator-package/` folder:
- Keeps your project directory clean
- Auto-detected when `.terminator-package/TERMINATOR.md` exists
- Recommended for most users

### Standalone Mode
Terminator IS the project root:
- Terminator files are in the main project directory
- Auto-detected when `TERMINATOR.md` + `mcp-servers/` exist at root
- Useful for dedicated Terminator projects

## After Installation

1. **Restart your IDE**
2. **Open your project folder**
3. **Ask your AI agent**:
   > "Read the INSTALL section in .terminator-package/TERMINATOR.md and set up Terminator"

## What's Installed

### MCP Servers
- `terminator-memory` - Persistent memory across sessions
- `terminator-comms` - Multi-channel communications
- `terminator-browser` - Web browsing and research
- `terminator-data` - Data processing and analysis
- `terminator-files` - File operations and templates
- `terminator-office` - Office document management
- `terminator-system` - System integration

### Skills
- `research` - Web research and synthesis
- `writing` - Document creation and editing
- `analysis` - Data analysis and statistics
- `communication` - Message drafting and sending
- `coding` - Software development
- `summarize` - Content summarization
- `office-documents` - Document lifecycle management
- `office-automation` - Document workflows
- `onboarding` - User guidance
- `terminator-expert` - Terminator expertise

### Resources
- **Templates** for documents, projects, and workflows
- **Prompt templates** for common tasks
- **Hooks** for automation and scheduling
- **Task chains** for complex workflows

## Troubleshooting

### Common Issues

**"Could not detect IDE"**
```bash
# Specify IDE manually
npx terminator-ai install --ide vscode
```

**"Installation failed"**
```bash
# Force reinstall
npx terminator-ai install --force
```

**"Permission denied"**
- Run with administrator privileges
- Check folder permissions

### Health Check
```bash
npx terminator-ai doctor
```

This will check:
- ✅ Installation presence
- ✅ MCP servers availability
- ✅ Skills availability
- ✅ Build artifacts
- ✅ Dependencies

## System Requirements

- **Node.js** >= 20.0.0
- **pnpm** package manager (auto-installed)
- **Supported IDE** with AI agent capabilities

## Development

### Install Development Version
```bash
npx terminator-ai install --dev
```

### Local Development
```bash
git clone https://github.com/netflypsb/terminator-package.git
cd terminator-package/npx-cli
npm install
npm test
```

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/netflypsb/terminator-package/issues)
- **Documentation**: [Terminator Package](https://github.com/netflypsb/terminator-package)

---

**Transform any IDE into an autonomous AI worker with a single command! 🚀**
