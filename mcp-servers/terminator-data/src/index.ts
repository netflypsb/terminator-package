#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Database from "better-sqlite3";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import fs from "fs";
import path from "path";

const DATA_DB_PATH =
  process.env.DATA_DB_PATH ||
  path.join(process.cwd(), ".terminator", "data.db");

const dataDir = path.dirname(DATA_DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DATA_DB_PATH);
db.pragma("journal_mode = WAL");

const server = new McpServer({
  name: "terminator-data",
  version: "0.1.0",
});

// --- Tool: data_query ---
server.tool(
  "data_query",
  "Execute a SQL query on the local SQLite database. Use for creating tables, inserting data, and running SELECT queries. The database persists at .terminator/data.db.",
  {
    sql: z.string().describe("SQL query to execute"),
    params: z.array(z.any()).optional().describe("Optional query parameters for prepared statements"),
  },
  async ({ sql, params }) => {
    try {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("SELECT") || trimmed.startsWith("PRAGMA") || trimmed.startsWith("WITH")) {
        const rows = params
          ? db.prepare(sql).all(...params)
          : db.prepare(sql).all();
        if (rows.length === 0) {
          return { content: [{ type: "text" as const, text: "Query returned 0 rows." }] };
        }
        const cols = Object.keys(rows[0] as object);
        const header = `| ${cols.join(" | ")} |`;
        const separator = `| ${cols.map(() => "---").join(" | ")} |`;
        const body = rows
          .slice(0, 100)
          .map((r: any) => `| ${cols.map((c) => String(r[c] ?? "NULL")).join(" | ")} |`)
          .join("\n");
        let result = `${header}\n${separator}\n${body}`;
        if (rows.length > 100) result += `\n\n...(${rows.length - 100} more rows)`;
        return { content: [{ type: "text" as const, text: `${rows.length} rows:\n\n${result}` }] };
      } else {
        const result = params
          ? db.prepare(sql).run(...params)
          : db.prepare(sql).run();
        return {
          content: [
            { type: "text" as const, text: `Statement executed. Changes: ${result.changes}, Last ID: ${result.lastInsertRowid}` },
          ],
        };
      }
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `SQL error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: data_csv_read ---
server.tool(
  "data_csv_read",
  "Read a CSV file and return its contents as structured data. Shows a preview of the first rows.",
  {
    file_path: z.string().describe("Path to the CSV file (absolute or relative to workspace)"),
    delimiter: z.string().optional().describe("Column delimiter (default: ',')"),
    max_rows: z.number().optional().describe("Maximum rows to return (default: 50)"),
  },
  async ({ file_path, delimiter, max_rows }) => {
    try {
      const resolved = path.isAbsolute(file_path) ? file_path : path.join(process.cwd(), file_path);
      const content = fs.readFileSync(resolved, "utf-8");
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        delimiter: delimiter ?? ",",
      }) as Record<string, string>[];

      const limit = max_rows ?? 50;
      const preview = records.slice(0, limit);
      const cols = Object.keys(preview[0] || {});
      const header = `| ${cols.join(" | ")} |`;
      const separator = `| ${cols.map(() => "---").join(" | ")} |`;
      const body = preview.map((r) => `| ${cols.map((c) => r[c] ?? "").join(" | ")} |`).join("\n");

      let result = `File: ${file_path}\nTotal rows: ${records.length}, Columns: ${cols.length} (${cols.join(", ")})\n\n${header}\n${separator}\n${body}`;
      if (records.length > limit) result += `\n\n...(${records.length - limit} more rows)`;

      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `CSV read error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: data_csv_write ---
server.tool(
  "data_csv_write",
  "Write structured data to a CSV file.",
  {
    file_path: z.string().describe("Path for the output CSV file"),
    columns: z.array(z.string()).describe("Column names"),
    rows: z.array(z.array(z.string())).describe("Array of rows, each row is an array of values"),
    delimiter: z.string().optional().describe("Column delimiter (default: ',')"),
  },
  async ({ file_path, columns, rows, delimiter }) => {
    try {
      const resolved = path.isAbsolute(file_path) ? file_path : path.join(process.cwd(), file_path);
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const data = [columns, ...rows];
      const output = stringify(data, { delimiter: delimiter ?? "," });
      fs.writeFileSync(resolved, output, "utf-8");

      return {
        content: [{ type: "text" as const, text: `Written ${rows.length} rows to ${file_path}` }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `CSV write error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: data_json_store ---
server.tool(
  "data_json_store",
  "Store or retrieve a JSON document by key in the local database. Use for persisting structured data between sessions.",
  {
    action: z.enum(["get", "set", "delete", "list"]).describe("Action: get, set, delete, or list"),
    key: z.string().optional().describe("Document key (required for get/set/delete)"),
    data: z.any().optional().describe("JSON data to store (required for set)"),
  },
  async ({ action, key, data }) => {
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS json_store (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

      if (action === "set") {
        if (!key) return { content: [{ type: "text" as const, text: "Key is required for set" }], isError: true };
        db.prepare("INSERT OR REPLACE INTO json_store (key, data, updated_at) VALUES (?, ?, datetime('now'))").run(key, JSON.stringify(data));
        return { content: [{ type: "text" as const, text: `Stored document "${key}"` }] };
      }
      if (action === "get") {
        if (!key) return { content: [{ type: "text" as const, text: "Key is required for get" }], isError: true };
        const row = db.prepare("SELECT data, updated_at FROM json_store WHERE key = ?").get(key) as any;
        if (!row) return { content: [{ type: "text" as const, text: `No document found with key "${key}"` }] };
        return { content: [{ type: "text" as const, text: `**${key}** (updated: ${row.updated_at}):\n\`\`\`json\n${row.data}\n\`\`\`` }] };
      }
      if (action === "delete") {
        if (!key) return { content: [{ type: "text" as const, text: "Key is required for delete" }], isError: true };
        const result = db.prepare("DELETE FROM json_store WHERE key = ?").run(key);
        return { content: [{ type: "text" as const, text: result.changes > 0 ? `Deleted "${key}"` : `No document "${key}" found` }] };
      }
      if (action === "list") {
        const rows = db.prepare("SELECT key, updated_at FROM json_store ORDER BY updated_at DESC").all() as any[];
        if (rows.length === 0) return { content: [{ type: "text" as const, text: "No stored documents." }] };
        const list = rows.map((r: any) => `- **${r.key}** (updated: ${r.updated_at})`).join("\n");
        return { content: [{ type: "text" as const, text: `${rows.length} stored documents:\n\n${list}` }] };
      }

      return { content: [{ type: "text" as const, text: "Unknown action" }], isError: true };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `JSON store error: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: data_analyze ---
server.tool(
  "data_analyze",
  "Perform basic statistical analysis on a numeric column from a SQL query result or CSV file. Returns count, min, max, mean, median, and standard deviation.",
  {
    source: z.enum(["sql", "csv"]).describe("Data source: 'sql' for a query, 'csv' for a file"),
    query_or_path: z.string().describe("SQL query (must return a single numeric column) or CSV file path"),
    column: z.string().optional().describe("Column name to analyze (required for CSV, optional for single-column SQL)"),
  },
  async ({ source, query_or_path, column }) => {
    try {
      let values: number[] = [];

      if (source === "sql") {
        const rows = db.prepare(query_or_path).all() as Record<string, any>[];
        if (rows.length === 0) return { content: [{ type: "text" as const, text: "Query returned 0 rows." }] };
        const col = column || Object.keys(rows[0])[0];
        values = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
      } else {
        const resolved = path.isAbsolute(query_or_path) ? query_or_path : path.join(process.cwd(), query_or_path);
        const content = fs.readFileSync(resolved, "utf-8");
        const records = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
        if (records.length === 0) return { content: [{ type: "text" as const, text: "CSV has 0 rows." }] };
        const col = column || Object.keys(records[0])[0];
        values = records.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
      }

      if (values.length === 0) {
        return { content: [{ type: "text" as const, text: "No numeric values found in the specified column." }] };
      }

      values.sort((a, b) => a - b);
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      const median = count % 2 === 0
        ? (values[count / 2 - 1] + values[count / 2]) / 2
        : values[Math.floor(count / 2)];
      const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / count;
      const stddev = Math.sqrt(variance);

      const report = [
        `**Statistical Analysis**`,
        `Count: ${count}`,
        `Min: ${values[0]}`,
        `Max: ${values[count - 1]}`,
        `Sum: ${sum.toFixed(4)}`,
        `Mean: ${mean.toFixed(4)}`,
        `Median: ${median.toFixed(4)}`,
        `Std Dev: ${stddev.toFixed(4)}`,
      ].join("\n");

      return { content: [{ type: "text" as const, text: report }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Analysis error: ${err.message}` }], isError: true };
    }
  }
);

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("terminator-data MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
