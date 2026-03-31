export type ViewName = "dashboard" | "schedules" | "communications" | "memory" | "settings";

export interface ServerStatus {
  name: string;
  built: boolean;
}

export interface DashboardData {
  config: any;
  skillsIndex: any;
  hooks: any;
  serverStatus: ServerStatus[];
  channels: string[];
  autonomousEnabled: boolean;
}

export interface ScheduleItem {
  id: string;
  name: string;
  type: 'cron' | 'once' | 'chain';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  next_run: string | null;
  last_run: string | null;
  description: string;
  run_count: number;
  max_runs: number | null;
  cron_expression: string | null;
  chain_tasks: string | null;
  chain_index: number;
  created_at: string;
  updated_at: string;
}

export interface ExecutionQueueItem {
  id: number;
  task_id: string;
  task_name: string;
  task_description: string;
  scheduled_for: string;
  queued_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  completed_at: string | null;
  status: "pending" | "claimed" | "completed" | "failed" | "missed";
  result: string | null;
  retry_count: number;
}

export interface SchedulesData {
  tasks: ScheduleItem[];
  queue: ExecutionQueueItem[];
  daemonStatus: {
    running: boolean;
    started_at?: string;
    pid?: number;
    executions_completed?: number;
    executions_failed?: number;
    last_execution?: string;
    last_error?: any;
  };
}

export interface ChannelStatus {
  id: string;
  name: string;
  icon: string;
  configured: boolean;
  credentials: string[]; // masked
  lastMessage?: string;
  lastCheck: string;
  envKeys: string[];
}

export interface CommunicationsData {
  channels: ChannelStatus[];
  recentMessages: Array<{
    channel: string;
    message: string;
    timestamp: string;
    direction: 'in' | 'out';
  }>;
}

export interface MemoriesData {
  dbExists: boolean;
  dbSize: number;
  note: string;
}

export interface ConfigData {
  config: any;
  envKeys: string[];
}

export interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare global {
  function acquireVsCodeApi(): VsCodeApi;
}
