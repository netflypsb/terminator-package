#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MemoryStore } from "./memory-store.js";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), ".terminator", "memory.db");

const store = new MemoryStore(DB_PATH);

const server = new McpServer({
  name: "terminator-memory",
  version: "0.1.0",
});

// --- Tool: memory_store ---
server.tool(
  "memory_store",
  "Store a memory with a unique key, value, optional tags, and optional metadata. Use this to persist user preferences, findings, decisions, task outcomes, and any important context across sessions.",
  {
    key: z.string().describe("Unique identifier for this memory (e.g. 'user-timezone', 'project-goal', 'finding-competitor-pricing')"),
    value: z.string().describe("The content to remember. Can be any text — facts, preferences, summaries, data."),
    tags: z.array(z.string()).optional().describe("Tags for categorization. Use: preference, finding, decision, task, contact, project, note"),
    metadata: z.record(z.string()).optional().describe("Optional key-value metadata (e.g. {\"source\": \"user\", \"confidence\": \"high\"})"),
  },
  async ({ key, value, tags, metadata }) => {
    const memory = store.store(key, value, tags ?? [], metadata ?? {});
    return {
      content: [
        {
          type: "text" as const,
          text: `Stored memory "${key}" with ${(tags ?? []).length} tags. Updated at ${memory.updated_at}.`,
        },
      ],
    };
  }
);

// --- Tool: memory_search ---
server.tool(
  "memory_search",
  "Search stored memories by keyword. Searches across keys, values, and tags. Returns results ranked by relevance. Use this to find specific memories or explore what's been stored.",
  {
    query: z.string().describe("Search query — keywords to match against memory keys, values, and tags"),
    limit: z.number().optional().describe("Maximum results to return (default: 10)"),
  },
  async ({ query, limit }) => {
    const results = store.search(query, limit ?? 10);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No memories found matching "${query}".`,
          },
        ],
      };
    }

    const formatted = results
      .map(
        (r) =>
          `**${r.key}** (score: ${r.score}, tags: ${r.tags.join(", ") || "none"})\n${r.value}`
      )
      .join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${results.length} memories matching "${query}":\n\n${formatted}`,
        },
      ],
    };
  }
);

// --- Tool: memory_retrieve ---
server.tool(
  "memory_retrieve",
  "Retrieve a specific memory by its exact key. Use this when you know the exact key of the memory you want.",
  {
    key: z.string().describe("The exact key of the memory to retrieve"),
  },
  async ({ key }) => {
    const memory = store.retrieve(key);

    if (!memory) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No memory found with key "${key}".`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `**${memory.key}**\nTags: ${memory.tags.join(", ") || "none"}\nCreated: ${memory.created_at}\nUpdated: ${memory.updated_at}\nMetadata: ${JSON.stringify(memory.metadata)}\n\n${memory.value}`,
        },
      ],
    };
  }
);

// --- Tool: memory_list ---
server.tool(
  "memory_list",
  "List all stored memories, optionally filtered by tag. Returns memories sorted by most recently updated. Use this to see what's been remembered or to browse memories by category.",
  {
    tag: z.string().optional().describe("Filter by tag (e.g. 'preference', 'finding', 'task')"),
    limit: z.number().optional().describe("Maximum results to return (default: 50)"),
  },
  async ({ tag, limit }) => {
    const memories = store.list(tag, limit ?? 50);

    if (memories.length === 0) {
      const tagMsg = tag ? ` with tag "${tag}"` : "";
      return {
        content: [
          {
            type: "text" as const,
            text: `No memories found${tagMsg}.`,
          },
        ],
      };
    }

    const formatted = memories
      .map(
        (m) =>
          `- **${m.key}** [${m.tags.join(", ") || "no tags"}]: ${m.value.substring(0, 120)}${m.value.length > 120 ? "..." : ""}`
      )
      .join("\n");

    const tagMsg = tag ? ` with tag "${tag}"` : "";
    return {
      content: [
        {
          type: "text" as const,
          text: `${memories.length} memories${tagMsg}:\n\n${formatted}`,
        },
      ],
    };
  }
);

// --- Tool: memory_delete ---
server.tool(
  "memory_delete",
  "Delete a specific memory by its key. Use this to remove outdated or incorrect memories.",
  {
    key: z.string().describe("The exact key of the memory to delete"),
  },
  async ({ key }) => {
    const deleted = store.delete(key);

    return {
      content: [
        {
          type: "text" as const,
          text: deleted
            ? `Deleted memory "${key}".`
            : `No memory found with key "${key}" — nothing to delete.`,
        },
      ],
    };
  }
);

// --- Tool: memory_context ---
server.tool(
  "memory_context",
  "Automatically retrieve memories relevant to the current conversation or task. Pass keywords or a description of what you're working on, and this tool returns the most relevant stored context. Call this at the START of non-trivial tasks.",
  {
    hints: z.string().describe("Keywords or brief description of the current task/conversation to find relevant memories"),
    limit: z.number().optional().describe("Maximum memories to return (default: 5)"),
  },
  async ({ hints, limit }) => {
    const results = store.context(hints, limit ?? 5);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No relevant context found in memory for this task.",
          },
        ],
      };
    }

    const formatted = results
      .map(
        (r) =>
          `**${r.key}** [${r.tags.join(", ")}]:\n${r.value}`
      )
      .join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `Relevant context from memory:\n\n${formatted}`,
        },
      ],
    };
  }
);

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("terminator-memory MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
