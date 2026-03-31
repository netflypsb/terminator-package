#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Handlebars from "handlebars";
import archiver from "archiver";
import extractZip from "extract-zip";
import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";

const server = new McpServer({
  name: "terminator-files",
  version: "0.1.0",
});

// --- Tool: files_template_render ---
server.tool(
  "files_template_render",
  "Render a Handlebars template with provided data. Can read template from a file or accept inline template string. Outputs rendered text or writes to a file.",
  {
    template: z.string().describe("Handlebars template string OR path to a .hbs/.md template file"),
    data: z.record(z.any()).describe("Data object to inject into the template"),
    output_path: z.string().optional().describe("If provided, write rendered output to this file path"),
  },
  async ({ template, data, output_path }) => {
    try {
      let templateStr = template;
      // If it looks like a file path, read it
      if (template.includes("/") || template.includes("\\") || template.endsWith(".hbs") || template.endsWith(".md")) {
        const resolved = path.isAbsolute(template) ? template : path.join(process.cwd(), template);
        if (fs.existsSync(resolved)) {
          templateStr = fs.readFileSync(resolved, "utf-8");
        }
      }

      const compiled = Handlebars.compile(templateStr);
      const rendered = compiled(data);

      if (output_path) {
        const resolved = path.isAbsolute(output_path) ? output_path : path.join(process.cwd(), output_path);
        const dir = path.dirname(resolved);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(resolved, rendered, "utf-8");
        return { content: [{ type: "text" as const, text: `Template rendered and written to ${output_path} (${rendered.length} chars)` }] };
      }

      return { content: [{ type: "text" as const, text: rendered }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Template error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: files_bulk_rename ---
server.tool(
  "files_bulk_rename",
  "Rename multiple files matching a glob-like pattern. Supports find/replace in filenames.",
  {
    directory: z.string().describe("Directory containing the files"),
    find: z.string().describe("String or regex pattern to find in filenames"),
    replace: z.string().describe("Replacement string"),
    dry_run: z.boolean().optional().describe("If true, only show what would be renamed without doing it (default: true)"),
  },
  async ({ directory, find, replace, dry_run }) => {
    try {
      const resolved = path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory);
      if (!fs.existsSync(resolved)) {
        return { content: [{ type: "text" as const, text: `Directory not found: ${directory}` }], isError: true };
      }

      const files = fs.readdirSync(resolved);
      const regex = new RegExp(find, "g");
      const renames: { from: string; to: string }[] = [];

      for (const file of files) {
        const newName = file.replace(regex, replace);
        if (newName !== file) {
          renames.push({ from: file, to: newName });
        }
      }

      if (renames.length === 0) {
        return { content: [{ type: "text" as const, text: `No files matched pattern "${find}" in ${directory}` }] };
      }

      const isDryRun = dry_run !== false;
      if (!isDryRun) {
        for (const r of renames) {
          fs.renameSync(path.join(resolved, r.from), path.join(resolved, r.to));
        }
      }

      const list = renames.map((r) => `  ${r.from} → ${r.to}`).join("\n");
      const prefix = isDryRun ? "[DRY RUN] Would rename" : "Renamed";
      return { content: [{ type: "text" as const, text: `${prefix} ${renames.length} files:\n${list}` }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Bulk rename error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: files_tree ---
server.tool(
  "files_tree",
  "Get a directory tree as structured text. Shows files and subdirectories with sizes. Useful for understanding project structure.",
  {
    directory: z.string().describe("Root directory to scan"),
    max_depth: z.number().optional().describe("Maximum depth to recurse (default: 3)"),
    exclude: z.array(z.string()).optional().describe("Directory names to exclude (e.g. ['node_modules', '.git'])"),
  },
  async ({ directory, max_depth, exclude }) => {
    try {
      const resolved = path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory);
      const maxD = max_depth ?? 3;
      const excludeSet = new Set(exclude ?? ["node_modules", ".git", "dist", ".terminator"]);
      const lines: string[] = [];

      function walk(dir: string, prefix: string, depth: number): void {
        if (depth > maxD) return;
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        entries.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (excludeSet.has(entry.name)) continue;
          const isLast = i === entries.length - 1;
          const connector = isLast ? "└── " : "├── ";
          const childPrefix = isLast ? "    " : "│   ";

          if (entry.isDirectory()) {
            lines.push(`${prefix}${connector}${entry.name}/`);
            walk(path.join(dir, entry.name), prefix + childPrefix, depth + 1);
          } else {
            const stat = fs.statSync(path.join(dir, entry.name));
            const size = stat.size < 1024 ? `${stat.size}B` : `${(stat.size / 1024).toFixed(1)}KB`;
            lines.push(`${prefix}${connector}${entry.name} (${size})`);
          }
        }
      }

      lines.push(`${path.basename(resolved)}/`);
      walk(resolved, "", 0);

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Tree error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: files_search ---
server.tool(
  "files_search",
  "Search file contents with regex across a directory. Returns matching lines with file paths and line numbers.",
  {
    directory: z.string().describe("Directory to search in"),
    pattern: z.string().describe("Regex pattern to search for"),
    extensions: z.array(z.string()).optional().describe("File extensions to include (e.g. ['.ts', '.js'])"),
    max_results: z.number().optional().describe("Maximum matching lines to return (default: 50)"),
  },
  async ({ directory, pattern, extensions, max_results }) => {
    try {
      const resolved = path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory);
      const regex = new RegExp(pattern, "gi");
      const maxR = max_results ?? 50;
      const extSet = extensions ? new Set(extensions) : null;
      const results: string[] = [];

      function searchDir(dir: string): void {
        if (results.length >= maxR) return;
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          if (results.length >= maxR) return;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (["node_modules", ".git", "dist"].includes(entry.name)) continue;
            searchDir(fullPath);
          } else {
            if (extSet && !extSet.has(path.extname(entry.name))) continue;
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              const lines = content.split("\n");
              for (let i = 0; i < lines.length && results.length < maxR; i++) {
                if (regex.test(lines[i])) {
                  const relPath = path.relative(resolved, fullPath);
                  results.push(`${relPath}:${i + 1}: ${lines[i].trim()}`);
                }
                regex.lastIndex = 0;
              }
            } catch {
              // skip binary or unreadable files
            }
          }
        }
      }

      searchDir(resolved);

      if (results.length === 0) {
        return { content: [{ type: "text" as const, text: `No matches found for /${pattern}/ in ${directory}` }] };
      }

      let text = `Found ${results.length} matches for /${pattern}/:\n\n${results.join("\n")}`;
      if (results.length >= maxR) text += `\n\n...(results capped at ${maxR})`;

      return { content: [{ type: "text" as const, text }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Search error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: files_archive_create ---
server.tool(
  "files_archive_create",
  "Create a ZIP archive from a directory or list of files.",
  {
    source: z.string().describe("Directory path to archive"),
    output: z.string().describe("Output ZIP file path"),
    exclude: z.array(z.string()).optional().describe("Patterns to exclude (e.g. ['node_modules', '.git'])"),
  },
  async ({ source, output: outputPath, exclude }) => {
    try {
      const resolvedSrc = path.isAbsolute(source) ? source : path.join(process.cwd(), source);
      const resolvedOut = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);
      const outDir = path.dirname(resolvedOut);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const excludeSet = new Set(exclude ?? ["node_modules", ".git"]);

      return new Promise((resolve) => {
        const output = createWriteStream(resolvedOut);
        const archive = archiver("zip", { zlib: { level: 9 } });
        let fileCount = 0;

        output.on("close", () => {
          const sizeKb = (archive.pointer() / 1024).toFixed(1);
          resolve({
            content: [{ type: "text" as const, text: `Archive created: ${outputPath} (${sizeKb}KB, ${fileCount} entries)` }],
          });
        });

        archive.on("error", (err: Error) => {
          resolve({
            content: [{ type: "text" as const, text: `Archive error: ${err.message}` }],
            isError: true,
          });
        });

        archive.on("entry", () => { fileCount++; });
        archive.pipe(output);

        // Add directory with filtering
        archive.glob("**/*", {
          cwd: resolvedSrc,
          ignore: [...excludeSet].map((e) => `${e}/**`),
          dot: false,
        });

        archive.finalize();
      });
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Archive error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: files_archive_extract ---
server.tool(
  "files_archive_extract",
  "Extract a ZIP archive to a directory.",
  {
    archive_path: z.string().describe("Path to the ZIP file"),
    output_dir: z.string().describe("Directory to extract to"),
  },
  async ({ archive_path, output_dir }) => {
    try {
      const resolvedArchive = path.isAbsolute(archive_path) ? archive_path : path.join(process.cwd(), archive_path);
      const resolvedOut = path.isAbsolute(output_dir) ? output_dir : path.join(process.cwd(), output_dir);

      if (!fs.existsSync(resolvedArchive)) {
        return { content: [{ type: "text" as const, text: `Archive not found: ${archive_path}` }], isError: true };
      }

      await extractZip(resolvedArchive, { dir: resolvedOut });

      return { content: [{ type: "text" as const, text: `Extracted ${archive_path} to ${output_dir}` }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Extract error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: files_workspace_scaffold ---
server.tool(
  "files_workspace_scaffold",
  "Create a new workspace from a predefined template structure. Define directories and files to create in one call.",
  {
    root: z.string().describe("Root directory for the new workspace"),
    structure: z
      .array(
        z.object({
          path: z.string().describe("Relative path (use / for dirs, e.g. 'src/utils/')"),
          content: z.string().optional().describe("File content (omit for directories)"),
        })
      )
      .describe("Array of files/directories to create"),
  },
  async ({ root, structure }) => {
    try {
      const resolvedRoot = path.isAbsolute(root) ? root : path.join(process.cwd(), root);
      let dirsCreated = 0;
      let filesCreated = 0;

      for (const item of structure) {
        const fullPath = path.join(resolvedRoot, item.path);
        if (item.path.endsWith("/") || !item.content) {
          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            dirsCreated++;
          }
        } else {
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(fullPath, item.content ?? "", "utf-8");
          filesCreated++;
        }
      }

      return {
        content: [
          { type: "text" as const, text: `Workspace scaffolded at ${root}: ${dirsCreated} directories, ${filesCreated} files created.` },
        ],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Scaffold error: ${err.message}` }], isError: true };
    }
  }
);

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("terminator-files MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
