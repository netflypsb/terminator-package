#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SchedulerStore } from "./scheduler-store.js";
import path from "path";

const DB_PATH =
  process.env.SCHEDULER_DB_PATH ||
  path.join(process.cwd(), ".terminator", "schedules.db");

const store = new SchedulerStore(DB_PATH);

const server = new McpServer({
  name: "terminator-scheduler",
  version: "0.1.0",
});

// --- Tool: schedule_create ---
server.tool(
  "schedule_create",
  "Create a new scheduled task. Supports recurring cron tasks, one-shot delayed tasks, and task chains. Use cron expressions for recurring (e.g. '0 8 * * *' for daily at 8am). For one-shot, provide scheduled_at as an ISO date string. For chains, provide an array of step descriptions.",
  {
    name: z.string().describe("Human-readable name for this task"),
    type: z
      .enum(["cron", "once", "chain"])
      .describe("Task type: 'cron' for recurring, 'once' for one-shot, 'chain' for multi-step"),
    description: z
      .string()
      .describe("What this task does — the instruction the agent should execute when triggered"),
    cron_expression: z
      .string()
      .optional()
      .describe("Cron expression for recurring tasks (e.g. '0 8 * * *' = daily at 8am, '*/30 * * * *' = every 30 min)"),
    scheduled_at: z
      .string()
      .optional()
      .describe("ISO date string for one-shot tasks (e.g. '2026-04-01T14:00:00Z')"),
    max_runs: z
      .number()
      .optional()
      .describe("Maximum number of executions for cron tasks (omit for unlimited)"),
    chain_tasks: z
      .array(z.string())
      .optional()
      .describe("Array of step descriptions for chain tasks, executed in order"),
  },
  async ({ name, type, description, cron_expression, scheduled_at, max_runs, chain_tasks }) => {
    try {
      const task = store.createTask({
        name,
        type,
        description,
        cron_expression,
        scheduled_at,
        max_runs,
        chain_tasks,
      });

      let details = `Created ${type} task "${task.name}" (${task.id})`;
      if (task.next_run) {
        details += `\nNext run: ${task.next_run}`;
      }
      if (task.type === "chain" && chain_tasks) {
        details += `\nChain steps: ${chain_tasks.length}`;
      }

      return {
        content: [{ type: "text" as const, text: details }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text" as const, text: `Failed to create task: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// --- Tool: schedule_list ---
server.tool(
  "schedule_list",
  "List all scheduled tasks, optionally filtered by status (active, paused, completed, cancelled).",
  {
    status: z
      .enum(["active", "paused", "completed", "cancelled"])
      .optional()
      .describe("Filter by task status"),
  },
  async ({ status }) => {
    const tasks = store.listTasks(status);

    if (tasks.length === 0) {
      const statusMsg = status ? ` with status "${status}"` : "";
      return {
        content: [{ type: "text" as const, text: `No tasks found${statusMsg}.` }],
      };
    }

    const formatted = tasks
      .map((t) => {
        let line = `**${t.name}** (${t.id})\n  Type: ${t.type} | Status: ${t.status} | Runs: ${t.run_count}`;
        if (t.next_run) line += `\n  Next run: ${t.next_run}`;
        if (t.cron_expression) line += `\n  Cron: ${t.cron_expression}`;
        if (t.description) line += `\n  Description: ${t.description}`;
        return line;
      })
      .join("\n\n");

    return {
      content: [{ type: "text" as const, text: `${tasks.length} tasks:\n\n${formatted}` }],
    };
  }
);

// --- Tool: schedule_get ---
server.tool(
  "schedule_get",
  "Get detailed information about a specific scheduled task by its ID.",
  {
    task_id: z.string().describe("The task ID to look up"),
  },
  async ({ task_id }) => {
    const task = store.getTask(task_id);
    if (!task) {
      return {
        content: [{ type: "text" as const, text: `No task found with ID "${task_id}".` }],
      };
    }

    const lines = [
      `**${task.name}** (${task.id})`,
      `Type: ${task.type}`,
      `Status: ${task.status}`,
      `Description: ${task.description}`,
      `Created: ${task.created_at}`,
      `Updated: ${task.updated_at}`,
      `Run count: ${task.run_count}${task.max_runs ? ` / ${task.max_runs}` : ""}`,
    ];
    if (task.cron_expression) lines.push(`Cron: ${task.cron_expression}`);
    if (task.scheduled_at) lines.push(`Scheduled at: ${task.scheduled_at}`);
    if (task.next_run) lines.push(`Next run: ${task.next_run}`);
    if (task.last_run) lines.push(`Last run: ${task.last_run}`);
    if (task.chain_tasks) {
      const steps: string[] = JSON.parse(task.chain_tasks);
      lines.push(`Chain steps (${steps.length}):`);
      steps.forEach((s, i) => {
        const marker = i === task.chain_index ? " → " : "   ";
        lines.push(`${marker}${i + 1}. ${s}`);
      });
    }

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// --- Tool: schedule_cancel ---
server.tool(
  "schedule_cancel",
  "Cancel a scheduled task. Only active or paused tasks can be cancelled.",
  {
    task_id: z.string().describe("The task ID to cancel"),
  },
  async ({ task_id }) => {
    const ok = store.cancelTask(task_id);
    return {
      content: [
        {
          type: "text" as const,
          text: ok
            ? `Task "${task_id}" cancelled.`
            : `Could not cancel task "${task_id}" — it may not exist or is already completed/cancelled.`,
        },
      ],
    };
  }
);

// --- Tool: schedule_pause ---
server.tool(
  "schedule_pause",
  "Pause an active scheduled task. It will stop running until resumed.",
  {
    task_id: z.string().describe("The task ID to pause"),
  },
  async ({ task_id }) => {
    const ok = store.pauseTask(task_id);
    return {
      content: [
        {
          type: "text" as const,
          text: ok
            ? `Task "${task_id}" paused.`
            : `Could not pause task "${task_id}" — it may not be active.`,
        },
      ],
    };
  }
);

// --- Tool: schedule_resume ---
server.tool(
  "schedule_resume",
  "Resume a paused scheduled task.",
  {
    task_id: z.string().describe("The task ID to resume"),
  },
  async ({ task_id }) => {
    const ok = store.resumeTask(task_id);
    return {
      content: [
        {
          type: "text" as const,
          text: ok
            ? `Task "${task_id}" resumed.`
            : `Could not resume task "${task_id}" — it may not be paused.`,
        },
      ],
    };
  }
);

// --- Tool: schedule_check_pending ---
server.tool(
  "schedule_check_pending",
  "Check for tasks that are due to run NOW. Returns all active tasks whose next_run time has passed. The agent should call this periodically (or at the start of a session) to pick up scheduled work. After executing a task, call schedule_mark_done to advance it.",
  {},
  async () => {
    const pending = store.checkPending();

    if (pending.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No pending tasks. All caught up." }],
      };
    }

    const formatted = pending
      .map((t) => {
        let desc = t.description;
        if (t.type === "chain" && t.chain_tasks) {
          const steps: string[] = JSON.parse(t.chain_tasks);
          desc = steps[t.chain_index] || t.description;
        }
        return `**${t.name}** (${t.id})\n  Due: ${t.next_run}\n  Action: ${desc}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `${pending.length} pending task(s) ready to execute:\n\n${formatted}\n\nExecute each task, then call schedule_mark_done with the task_id.`,
        },
      ],
    };
  }
);

// --- Tool: schedule_mark_done ---
server.tool(
  "schedule_mark_done",
  "Mark a pending task as executed. For cron tasks, this advances to the next scheduled run. For chains, it advances to the next step. For one-shot tasks, it marks them as completed.",
  {
    task_id: z.string().describe("The task ID to mark as done"),
    result: z
      .string()
      .optional()
      .describe("Optional summary of the execution result"),
  },
  async ({ task_id, result }) => {
    store.markExecuted(task_id, result);
    const task = store.getTask(task_id);

    if (!task) {
      return {
        content: [{ type: "text" as const, text: `Task "${task_id}" not found.` }],
      };
    }

    let msg = `Task "${task.name}" marked as executed (total runs: ${task.run_count}).`;
    if (task.status === "completed") {
      msg += " Task is now completed.";
    } else if (task.next_run) {
      msg += ` Next run: ${task.next_run}`;
    }

    return {
      content: [{ type: "text" as const, text: msg }],
    };
  }
);

// --- Tool: schedule_history ---
server.tool(
  "schedule_history",
  "View execution history for all tasks or a specific task.",
  {
    task_id: z
      .string()
      .optional()
      .describe("Filter history to a specific task ID"),
    limit: z
      .number()
      .optional()
      .describe("Maximum entries to return (default: 20)"),
  },
  async ({ task_id, limit }) => {
    const history = store.getHistory(task_id, limit ?? 20);

    if (history.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No execution history found." }],
      };
    }

    const formatted = history
      .map(
        (h) =>
          `[${h.started_at}] Task ${h.task_id} — ${h.status}${h.result ? `: ${h.result}` : ""}`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `Execution history (${history.length} entries):\n\n${formatted}`,
        },
      ],
    };
  }
);

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("terminator-scheduler MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
