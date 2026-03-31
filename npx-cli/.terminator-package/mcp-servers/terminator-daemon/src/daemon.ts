import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { WinstonLogger } from "./logger.js";

export interface DaemonConfig {
  workspacePath: string;
  pollInterval: number; // milliseconds
  maxRetries: number;
  logFile: string;
}

export interface DaemonStatus {
  running: boolean;
  started_at?: string;
  stopped_at?: string;
  pid?: number;
  workspace_path?: string;
  version?: string;
  last_execution?: string;
  executions_completed?: number;
  executions_failed?: number;
  last_error?: {
    message: string;
    at: string;
  };
}

export class Daemon {
  private config: DaemonConfig;
  private logger: WinstonLogger;
  private pollTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private stats = {
    executionsCompleted: 0,
    executionsFailed: 0,
    lastExecution: null as Date | null
  };

  constructor(workspacePath: string, logFile: string) {
    this.config = {
      workspacePath,
      pollInterval: 30000, // 30 seconds
      maxRetries: 3,
      logFile
    };
    
    this.logger = new WinstonLogger(logFile);
  }

  async start(): Promise<void> {
    this.logger.info("🚀 Daemon starting", {
      workspace: this.config.workspacePath,
      pollInterval: this.config.pollInterval
    });

    this.isRunning = true;
    
    // Initial check
    await this.checkAndExecuteTasks();
    
    // Start polling
    this.pollTimer = setInterval(() => {
      this.checkAndExecuteTasks().catch(error => {
        this.logger.error("Polling error", { error: error.message });
      });
    }, this.config.pollInterval);

    this.logger.info("✅ Daemon started successfully");
  }

  async stop(): Promise<void> {
    this.logger.info("🛑 Daemon stopping...");
    
    this.isRunning = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.logger.info("✅ Daemon stopped");
  }

  private async checkAndExecuteTasks(): Promise<void> {
    try {
      // Step 1: Queue any pending tasks
      await this.queuePendingTasks();
      
      // Step 2: Process execution queue
      await this.processExecutionQueue();
      
      // Step 3: Update status
      await this.updateStatus();
      
    } catch (error) {
      this.logger.error("Task execution error", { error: error instanceof Error ? error.message : String(error) });
      this.stats.executionsFailed++;
    }
  }

  private async queuePendingTasks(): Promise<void> {
    const schedulerPath = path.join(this.config.workspacePath, "mcp-servers", "terminator-scheduler", "dist", "index.js");
    
    if (!fs.existsSync(schedulerPath)) {
      this.logger.warn("Scheduler not built", { path: schedulerPath });
      return;
    }

    try {
      const result = await this.invokeMcpTool(schedulerPath, "schedule_queue_pending", {});
      
      if (result && result.content && result.content[0]) {
        const message = result.content[0].text;
        this.logger.info("Queued pending tasks", { result: message });
        
        // Extract number of tasks from message
        const match = message.match(/(\d+) task\(s\)/);
        if (match) {
          const taskCount = parseInt(match[1]);
          if (taskCount > 0) {
            this.logger.info(`✅ ${taskCount} tasks queued for execution`);
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to queue pending tasks", { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async processExecutionQueue(): Promise<void> {
    const schedulerPath = path.join(this.config.workspacePath, "mcp-servers", "terminator-scheduler", "dist", "index.js");
    
    if (!fs.existsSync(schedulerPath)) {
      this.logger.warn("Scheduler not built", { path: schedulerPath });
      return;
    }

    try {
      // Get pending executions
      const pendingResult = await this.invokeMcpTool(schedulerPath, "schedule_get_pending_executions", {});
      
      if (!pendingResult || !pendingResult.content || !pendingResult.content[0]) {
        return; // No pending tasks
      }

      const pendingMessage = pendingResult.content[0].text;
      this.logger.info("Checking pending executions", { result: pendingMessage });

      // Extract execution count
      const match = pendingMessage.match(/(\d+) pending execution\(s\)/);
      if (!match || parseInt(match[1]) === 0) {
        return; // No pending executions
      }

      // Process each pending execution
      let processed = 0;
      while (processed < 10) { // Limit to 10 per cycle to avoid infinite loops
        const claimResult = await this.invokeMcpTool(schedulerPath, "schedule_claim_execution", { agent_id: "daemon" });
        
        if (!claimResult || !claimResult.content || !claimResult.content[0]) {
          break; // No more tasks to claim
        }

        const claimMessage = claimResult.content[0].text;
        this.logger.info("Claimed execution", { result: claimMessage });

        // Extract execution ID and task description
        const executionMatch = claimMessage.match(/Execution #(\d+)/);
        const descriptionMatch = claimMessage.match(/\*\*Task Description\*\* \(EXECUTE THIS\):\n(.+?)(?=\n\n|$)/s);
        
        if (!executionMatch || !descriptionMatch) {
          this.logger.error("Failed to parse claim result", { message: claimMessage });
          continue;
        }

        const executionId = parseInt(executionMatch[1]);
        const taskDescription = descriptionMatch[1].trim();

        // Execute the task
        await this.executeTask(executionId, taskDescription);
        processed++;
      }

      if (processed > 0) {
        this.logger.info(`✅ Processed ${processed} executions`);
      }

    } catch (error) {
      this.logger.error("Failed to process execution queue", { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async executeTask(executionId: number, taskDescription: string): Promise<void> {
    this.logger.info(`🔄 Executing task #${executionId}`, { description: taskDescription.substring(0, 100) });

    try {
      // For now, we'll simulate task execution
      // In a full implementation, this would parse the task description and execute it
      // using the appropriate MCP tools (browser, memory, comms, etc.)
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark as completed
      const schedulerPath = path.join(this.config.workspacePath, "mcp-servers", "terminator-scheduler", "dist", "index.js");
      const result = await this.invokeMcpTool(schedulerPath, "schedule_complete_execution", {
        execution_id: executionId,
        result: `Task executed by daemon: ${taskDescription.substring(0, 200)}...`,
        status: "completed"
      });

      this.stats.executionsCompleted++;
      this.stats.lastExecution = new Date();
      
      this.logger.info(`✅ Completed execution #${executionId}`, { result: result?.content?.[0]?.text });

    } catch (error) {
      // Mark as failed
      const schedulerPath = path.join(this.config.workspacePath, "mcp-servers", "terminator-scheduler", "dist", "index.js");
      try {
        await this.invokeMcpTool(schedulerPath, "schedule_complete_execution", {
          execution_id: executionId,
          result: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
          status: "failed"
        });
      } catch (completeError) {
        this.logger.error("Failed to mark execution as failed", { 
          executionId, 
          error: completeError instanceof Error ? completeError.message : String(completeError)
        });
      }

      this.stats.executionsFailed++;
      this.logger.error(`❌ Failed execution #${executionId}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async invokeMcpTool(schedulerPath: string, toolName: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn("node", [schedulerPath], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: this.config.workspacePath,
        env: {
          ...process.env,
          SCHEDULER_DB_PATH: path.join(this.config.workspacePath, ".terminator", "schedules.db")
        }
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`MCP process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse MCP response
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          
          if (lastLine) {
            const response = JSON.parse(lastLine);
            resolve(response);
          } else {
            reject(new Error("No response from MCP server"));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse MCP response: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
        }
      });

      // Send the tool invocation request
      const request = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      child.stdin.write(JSON.stringify(request) + "\n");
      child.stdin.end();
    });
  }

  private async updateStatus(): Promise<void> {
    const statusPath = path.join(this.config.workspacePath, ".terminator", "daemon-status.json");
    
    const status: DaemonStatus = {
      running: true,
      started_at: new Date().toISOString(),
      pid: process.pid,
      workspace_path: this.config.workspacePath,
      version: "0.1.0",
      last_execution: this.stats.lastExecution?.toISOString(),
      executions_completed: this.stats.executionsCompleted,
      executions_failed: this.stats.executionsFailed
    };

    try {
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    } catch (error) {
      this.logger.error("Failed to update status file", { error: error instanceof Error ? error.message : String(error) });
    }
  }
}
