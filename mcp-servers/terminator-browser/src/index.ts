#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const CACHE_DB_PATH =
  process.env.BROWSER_DB_PATH ||
  path.join(process.cwd(), ".terminator", "browser-cache.db");

// Ensure directory exists
const cacheDir = path.dirname(CACHE_DB_PATH);
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

const cacheDb = new Database(CACHE_DB_PATH);
cacheDb.pragma("journal_mode = WAL");
cacheDb.exec(`
  CREATE TABLE IF NOT EXISTS page_snapshots (
    url TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    content TEXT NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (url, fetched_at)
  );
  CREATE INDEX IF NOT EXISTS idx_snapshots_url ON page_snapshots(url);
`);

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url: string): Promise<{ html: string; status: number }> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });
  const html = await response.text();
  return { html, status: response.status };
}

function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);
  // Remove scripts, styles, nav, footer, ads
  $("script, style, nav, footer, iframe, noscript, .ad, .ads, .advertisement").remove();
  const bodyHtml = $("article").length > 0 ? $("article").html() : $("body").html();
  if (!bodyHtml) return "(empty page)";
  let md = turndown.turndown(bodyHtml);
  // Collapse excessive whitespace
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  // Truncate if very long
  if (md.length > 15000) md = md.substring(0, 15000) + "\n\n...(truncated)";
  return md;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(36);
}

const server = new McpServer({
  name: "terminator-browser",
  version: "0.1.0",
});

// --- Tool: browse_url ---
server.tool(
  "browse_url",
  "Fetch a web page and return its content as clean markdown. Strips scripts, styles, navigation, and ads. Best for reading articles, documentation, and web pages.",
  {
    url: z.string().describe("The URL to fetch"),
    max_length: z.number().optional().describe("Maximum characters to return (default: 15000)"),
  },
  async ({ url, max_length }) => {
    try {
      const { html, status } = await fetchPage(url);
      if (status >= 400) {
        return { content: [{ type: "text" as const, text: `HTTP ${status} error fetching ${url}` }], isError: true };
      }
      let md = htmlToMarkdown(html);
      const limit = max_length ?? 15000;
      if (md.length > limit) md = md.substring(0, limit) + "\n\n...(truncated)";

      // Cache snapshot
      const hash = simpleHash(md);
      cacheDb.prepare("INSERT INTO page_snapshots (url, content_hash, content) VALUES (?, ?, ?)").run(url, hash, md);

      return { content: [{ type: "text" as const, text: `# ${url}\n\n${md}` }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Failed to fetch ${url}: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: browse_extract ---
server.tool(
  "browse_extract",
  "Fetch a web page and extract specific data using CSS selectors. Returns structured text from the matched elements.",
  {
    url: z.string().describe("The URL to fetch"),
    selector: z.string().describe("CSS selector to extract (e.g. 'h2', '.price', 'table tr')"),
    attribute: z.string().optional().describe("Extract an attribute instead of text (e.g. 'href', 'src')"),
    limit: z.number().optional().describe("Max elements to return (default: 50)"),
  },
  async ({ url, selector, attribute, limit }) => {
    try {
      const { html } = await fetchPage(url);
      const $ = cheerio.load(html);
      const elements = $(selector).slice(0, limit ?? 50);
      const results: string[] = [];

      elements.each((i, el) => {
        if (attribute) {
          const val = $(el).attr(attribute);
          if (val) results.push(val);
        } else {
          results.push($(el).text().trim());
        }
      });

      if (results.length === 0) {
        return { content: [{ type: "text" as const, text: `No elements matched selector "${selector}" on ${url}` }] };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Extracted ${results.length} elements from ${url} using "${selector}":\n\n${results.map((r, i) => `${i + 1}. ${r}`).join("\n")}`,
          },
        ],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Failed to extract from ${url}: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: browse_search ---
server.tool(
  "browse_search",
  "Perform a web search using DuckDuckGo HTML and return the results. Lightweight, no API key needed.",
  {
    query: z.string().describe("Search query"),
    num_results: z.number().optional().describe("Number of results to return (default: 8)"),
  },
  async ({ query, num_results }) => {
    try {
      const encoded = encodeURIComponent(query);
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;
      const { html } = await fetchPage(searchUrl);
      const $ = cheerio.load(html);
      const results: string[] = [];
      const maxResults = num_results ?? 8;

      $(".result").each((i, el) => {
        if (i >= maxResults) return false;
        const title = $(el).find(".result__title").text().trim();
        const snippet = $(el).find(".result__snippet").text().trim();
        const href = $(el).find(".result__url").text().trim();
        if (title) {
          results.push(`**${title}**\n${href}\n${snippet}`);
        }
      });

      if (results.length === 0) {
        return { content: [{ type: "text" as const, text: `No search results found for "${query}".` }] };
      }

      return {
        content: [{ type: "text" as const, text: `Search results for "${query}":\n\n${results.join("\n\n---\n\n")}` }],
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Search failed: ${err.message}` }], isError: true };
    }
  }
);

// --- Tool: browse_monitor ---
server.tool(
  "browse_monitor",
  "Compare the current version of a web page with the last cached snapshot. Reports what has changed. Useful for monitoring pages for updates.",
  {
    url: z.string().describe("The URL to monitor"),
  },
  async ({ url }) => {
    try {
      const { html } = await fetchPage(url);
      const currentMd = htmlToMarkdown(html);
      const currentHash = simpleHash(currentMd);

      // Get last snapshot
      const lastSnapshot = cacheDb
        .prepare("SELECT content_hash, content, fetched_at FROM page_snapshots WHERE url = ? ORDER BY fetched_at DESC LIMIT 1")
        .get(url) as any;

      // Save current
      cacheDb.prepare("INSERT INTO page_snapshots (url, content_hash, content) VALUES (?, ?, ?)").run(url, currentHash, currentMd);

      if (!lastSnapshot) {
        return {
          content: [{ type: "text" as const, text: `First snapshot saved for ${url}. No previous version to compare. Run again later to detect changes.` }],
        };
      }

      if (lastSnapshot.content_hash === currentHash) {
        return {
          content: [{ type: "text" as const, text: `No changes detected on ${url} since ${lastSnapshot.fetched_at}.` }],
        };
      }

      // Simple diff: show what lines are new
      const oldLines = new Set(lastSnapshot.content.split("\n").map((l: string) => l.trim()).filter((l: string) => l));
      const newLines = currentMd.split("\n").map((l) => l.trim()).filter((l) => l);
      const added = newLines.filter((l) => !oldLines.has(l));
      const removed = [...oldLines].filter((l) => !new Set(newLines).has(l as string));

      let report = `Changes detected on ${url} (last checked: ${lastSnapshot.fetched_at}):\n\n`;
      if (added.length > 0) {
        report += `**Added (${added.length} lines):**\n${added.slice(0, 20).map((l) => `+ ${l}`).join("\n")}`;
        if (added.length > 20) report += `\n... and ${added.length - 20} more`;
        report += "\n\n";
      }
      if (removed.length > 0) {
        report += `**Removed (${removed.length} lines):**\n${(removed as string[]).slice(0, 20).map((l) => `- ${l}`).join("\n")}`;
        if (removed.length > 20) report += `\n... and ${removed.length - 20} more`;
      }
      if (added.length === 0 && removed.length === 0) {
        report += "Content has changed but individual line differences are unclear (possible reordering or formatting changes).";
      }

      return { content: [{ type: "text" as const, text: report }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `Monitor failed for ${url}: ${err.message}` }], isError: true };
    }
  }
);

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("terminator-browser MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
