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

export interface SchedulesData {
  dbExists: boolean;
  dbSize: number;
  note: string;
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
