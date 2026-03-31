# Custom MCP Servers

Extend Terminator with additional MCP servers — either third-party servers from the community or your own custom-built servers.

---

## Adding a Third-Party MCP Server

MCP servers are configured in your IDE's MCP config file. The installer generates this file, but you can edit it to add more servers.

### Config File Locations

| IDE | Config File |
|---|---|
| Windsurf | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| Claude Code | `.mcp.json` |
| Cline | `.mcp.json` |
| VS Code | `.mcp.json` |

### Adding a Server

Edit the config file and add a new entry under `mcpServers`:

```json
{
  "mcpServers": {
    "my-custom-server": {
      "command": "node",
      "args": ["path/to/server/dist/index.js"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

Restart your IDE to pick up the new server.

### Popular MCP Servers

- **@modelcontextprotocol/server-filesystem** — File system access
- **@modelcontextprotocol/server-github** — GitHub API integration
- **@modelcontextprotocol/server-postgres** — PostgreSQL queries
- **@modelcontextprotocol/server-slack** — Slack integration

Install with npm/pnpm and add to your config.

---

## Building Your Own MCP Server

Terminator's MCP servers are built with the official `@modelcontextprotocol/sdk`. You can follow the same pattern.

### Quick Start

```bash
mkdir mcp-servers/my-server
cd mcp-servers/my-server
pnpm init
pnpm add @modelcontextprotocol/sdk zod
pnpm add -D typescript tsup @types/node
```

### Minimal Server

```typescript
// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-server",
  version: "0.1.0",
});

// Define a tool
server.tool(
  "my_tool",
  "Description of what this tool does",
  {
    input: z.string().describe("What this parameter expects"),
  },
  async ({ input }) => {
    // Your logic here
    const result = `Processed: ${input}`;
    
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Build Configuration

Add to `package.json`:

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --clean"
  }
}
```

Add `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### Register with Terminator

1. Add your server to the pnpm workspace (`pnpm-workspace.yaml`):
   ```yaml
   packages:
     - "mcp-servers/*"
   ```

2. Build: `pnpm --filter my-server build`

3. Re-run the installer or manually add to `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "my-server": {
         "command": "node",
         "args": ["mcp-servers/my-server/dist/index.js"]
       }
     }
   }
   ```

4. Update `TERMINATOR.md` to document your new tools.

---

## Architecture Tips

- **Keep servers focused** — One server per domain (e.g., "email", "calendar", "CRM")
- **Use Zod for validation** — All tool parameters should be validated with Zod schemas
- **Return structured data** — Return JSON in text content for complex data
- **Handle errors gracefully** — Return `isError: true` with helpful messages
- **Use environment variables** — Never hardcode API keys
- **Add to the doctor** — Extend `installer/src/doctor.ts` to check your server

---

## Testing Your Server

Test locally with the MCP inspector:

```bash
npx @modelcontextprotocol/inspector node mcp-servers/my-server/dist/index.js
```

This opens a web UI where you can invoke your tools interactively.
