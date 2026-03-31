import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { parseExpression } from "cron-parser";

export type TaskStatus = "active" | "paused" | "completed" | "cancelled";
export type TaskType = "cron" | "once" | "chain";

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  description: string;
  cron_expression: string | null;
  scheduled_at: string | null;
  next_run: string | null;
  last_run: string | null;
  run_count: number;
  max_runs: number | null;
  chain_tasks: string | null; // JSON array of subtask descriptions
  chain_index: number;
  created_at: string;
  updated_at: string;
}

export interface TaskExecution {
  id: number;
  task_id: string;
  started_at: string;
  completed_at: string | null;
  status: "pending" | "running" | "completed" | "failed";
  result: string | null;
}

export class SchedulerStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'once',
        status TEXT NOT NULL DEFAULT 'active',
        description TEXT NOT NULL DEFAULT '',
        cron_expression TEXT,
        scheduled_at TEXT,
        next_run TEXT,
        last_run TEXT,
        run_count INTEGER NOT NULL DEFAULT 0,
        max_runs INTEGER,
        chain_tasks TEXT,
        chain_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS task_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        result TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_next_run ON tasks(next_run);
      CREATE INDEX IF NOT EXISTS idx_executions_task ON task_executions(task_id);
    `);
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private computeNextRun(cronExpression: string): string | null {
    try {
      const interval = parseExpression(cronExpression);
      return interval.next().toISOString();
    } catch {
      return null;
    }
  }

  createTask(params: {
    name: string;
    type: TaskType;
    description: string;
    cron_expression?: string;
    scheduled_at?: string;
    max_runs?: number;
    chain_tasks?: string[];
  }): Task {
    const id = this.generateId();
    const now = new Date().toISOString();

    let next_run: string | null = null;
    if (params.type === "cron" && params.cron_expression) {
      next_run = this.computeNextRun(params.cron_expression);
    } else if (params.type === "once" && params.scheduled_at) {
      next_run = params.scheduled_at;
    } else if (params.type === "once" && !params.scheduled_at) {
      // Immediate one-shot
      next_run = now;
    }

    const chainJson = params.chain_tasks
      ? JSON.stringify(params.chain_tasks)
      : null;

    this.db
      .prepare(
        `INSERT INTO tasks (id, name, type, status, description, cron_expression, scheduled_at, next_run, max_runs, chain_tasks, created_at, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        params.name,
        params.type,
        params.description,
        params.cron_expression ?? null,
        params.scheduled_at ?? null,
        next_run,
        params.max_runs ?? null,
        chainJson,
        now,
        now
      );

    return this.getTask(id)!;
  }

  getTask(id: string): Task | null {
    const row = this.db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(id) as any;
    return row ? this.rowToTask(row) : null;
  }

  listTasks(status?: TaskStatus): Task[] {
    let rows: any[];
    if (status) {
      rows = this.db
        .prepare("SELECT * FROM tasks WHERE status = ? ORDER BY updated_at DESC")
        .all(status);
    } else {
      rows = this.db
        .prepare("SELECT * FROM tasks ORDER BY updated_at DESC")
        .all();
    }
    return rows.map((r: any) => this.rowToTask(r));
  }

  cancelTask(id: string): boolean {
    const now = new Date().toISOString();
    const result = this.db
      .prepare("UPDATE tasks SET status = 'cancelled', updated_at = ? WHERE id = ? AND status IN ('active', 'paused')")
      .run(now, id);
    return result.changes > 0;
  }

  pauseTask(id: string): boolean {
    const now = new Date().toISOString();
    const result = this.db
      .prepare("UPDATE tasks SET status = 'paused', updated_at = ? WHERE id = ? AND status = 'active'")
      .run(now, id);
    return result.changes > 0;
  }

  resumeTask(id: string): boolean {
    const now = new Date().toISOString();
    const task = this.getTask(id);
    if (!task || task.status !== "paused") return false;

    let next_run = task.next_run;
    if (task.type === "cron" && task.cron_expression) {
      next_run = this.computeNextRun(task.cron_expression);
    }

    const result = this.db
      .prepare("UPDATE tasks SET status = 'active', next_run = ?, updated_at = ? WHERE id = ?")
      .run(next_run, now, id);
    return result.changes > 0;
  }

  checkPending(): Task[] {
    const now = new Date().toISOString();
    const rows = this.db
      .prepare(
        `SELECT * FROM tasks 
         WHERE status = 'active' 
         AND next_run IS NOT NULL 
         AND next_run <= ?
         ORDER BY next_run ASC`
      )
      .all(now);
    return rows.map((r: any) => this.rowToTask(r));
  }

  markExecuted(id: string, result?: string): void {
    const now = new Date().toISOString();
    const task = this.getTask(id);
    if (!task) return;

    // Record execution
    this.db
      .prepare(
        `INSERT INTO task_executions (task_id, started_at, completed_at, status, result)
         VALUES (?, ?, ?, 'completed', ?)`
      )
      .run(id, now, now, result ?? null);

    const newRunCount = task.run_count + 1;

    if (task.type === "cron" && task.cron_expression) {
      // Compute next run for recurring tasks
      const next_run = this.computeNextRun(task.cron_expression);
      const newStatus =
        task.max_runs && newRunCount >= task.max_runs ? "completed" : "active";
      this.db
        .prepare(
          "UPDATE tasks SET run_count = ?, last_run = ?, next_run = ?, status = ?, updated_at = ? WHERE id = ?"
        )
        .run(newRunCount, now, next_run, newStatus, now, id);
    } else if (task.type === "chain") {
      // Advance chain index
      const chainTasks: string[] = task.chain_tasks
        ? JSON.parse(task.chain_tasks)
        : [];
      const newIndex = task.chain_index + 1;
      if (newIndex >= chainTasks.length) {
        // Chain complete
        this.db
          .prepare(
            "UPDATE tasks SET run_count = ?, last_run = ?, next_run = NULL, status = 'completed', chain_index = ?, updated_at = ? WHERE id = ?"
          )
          .run(newRunCount, now, newIndex, now, id);
      } else {
        // Set next chain step as pending now
        this.db
          .prepare(
            "UPDATE tasks SET run_count = ?, last_run = ?, next_run = ?, chain_index = ?, updated_at = ? WHERE id = ?"
          )
          .run(newRunCount, now, now, newIndex, now, id);
      }
    } else {
      // One-shot task: mark completed
      this.db
        .prepare(
          "UPDATE tasks SET run_count = ?, last_run = ?, next_run = NULL, status = 'completed', updated_at = ? WHERE id = ?"
        )
        .run(newRunCount, now, now, id);
    }
  }

  getHistory(taskId?: string, limit: number = 20): TaskExecution[] {
    let rows: any[];
    if (taskId) {
      rows = this.db
        .prepare(
          "SELECT * FROM task_executions WHERE task_id = ? ORDER BY started_at DESC LIMIT ?"
        )
        .all(taskId, limit);
    } else {
      rows = this.db
        .prepare(
          "SELECT * FROM task_executions ORDER BY started_at DESC LIMIT ?"
        )
        .all(limit);
    }
    return rows.map((r: any) => ({
      id: r.id,
      task_id: r.task_id,
      started_at: r.started_at,
      completed_at: r.completed_at,
      status: r.status,
      result: r.result,
    }));
  }

  private rowToTask(row: any): Task {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      description: row.description,
      cron_expression: row.cron_expression,
      scheduled_at: row.scheduled_at,
      next_run: row.next_run,
      last_run: row.last_run,
      run_count: row.run_count,
      max_runs: row.max_runs,
      chain_tasks: row.chain_tasks,
      chain_index: row.chain_index,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  close(): void {
    this.db.close();
  }
}
