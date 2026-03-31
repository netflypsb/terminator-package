#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Daemon } from "./daemon.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WORKSPACE_PATH = process.env.TERMINATOR_WORKSPACE || process.cwd();
const DAEMON_PID_FILE = path.join(WORKSPACE_PATH, ".terminator", "daemon.pid");
const DAEMON_STATUS_FILE = path.join(WORKSPACE_PATH, ".terminator", "daemon-status.json");
const LOG_FILE = path.join(WORKSPACE_PATH, ".terminator", "logs", "daemon.log");

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Handle shutdown gracefully
process.on("SIGINT", () => {
  console.log("\n🛑 Daemon shutting down...");
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Daemon terminating...");
  cleanup();
  process.exit(0);
});

function cleanup() {
  // Remove PID file
  if (fs.existsSync(DAEMON_PID_FILE)) {
    fs.unlinkSync(DAEMON_PID_FILE);
  }
  
  // Update status
  const status = {
    running: false,
    stopped_at: new Date().toISOString(),
    last_error: null
  };
  fs.writeFileSync(DAEMON_STATUS_FILE, JSON.stringify(status, null, 2));
}

async function main() {
  console.log("🚀 Starting Terminator Daemon...");
  console.log(`📁 Workspace: ${WORKSPACE_PATH}`);
  console.log(`📋 PID file: ${DAEMON_PID_FILE}`);
  console.log(`📊 Status file: ${DAEMON_STATUS_FILE}`);
  console.log(`📝 Log file: ${LOG_FILE}`);
  
  // Check if already running
  if (fs.existsSync(DAEMON_PID_FILE)) {
    const pid = fs.readFileSync(DAEMON_PID_FILE, "utf-8").trim();
    try {
      // Check if process is still alive
      process.kill(parseInt(pid), 0);
      console.log(`❌ Daemon already running with PID ${pid}`);
      process.exit(1);
    } catch (e) {
      // Process not found, stale PID file
      console.log(`🧹 Removing stale PID file`);
      fs.unlinkSync(DAEMON_PID_FILE);
    }
  }
  
  // Write PID file
  fs.writeFileSync(DAEMON_PID_FILE, process.pid.toString());
  
  // Update status
  const status = {
    running: true,
    started_at: new Date().toISOString(),
    pid: process.pid,
    workspace_path: WORKSPACE_PATH,
    version: "0.1.0"
  };
  fs.writeFileSync(DAEMON_STATUS_FILE, JSON.stringify(status, null, 2));
  
  try {
    // Start the daemon
    const daemon = new Daemon(WORKSPACE_PATH, LOG_FILE);
    await daemon.start();
  } catch (error) {
    console.error("❌ Daemon failed to start:", error);
    
    // Update status with error
    const errorStatus = {
      running: false,
      last_error: {
        message: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString()
      }
    };
    fs.writeFileSync(DAEMON_STATUS_FILE, JSON.stringify(errorStatus, null, 2));
    
    cleanup();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  cleanup();
  process.exit(1);
});
