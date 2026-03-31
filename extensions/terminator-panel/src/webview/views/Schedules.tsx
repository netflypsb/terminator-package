import React from "react";
import type { SchedulesData, VsCodeApi } from "../types";

interface SchedulesProps {
  data: SchedulesData | null;
  vscode: VsCodeApi;
}

export function Schedules({ data, vscode }: SchedulesProps) {
  if (!data) {
    return <div className="view-loading">Loading schedules...</div>;
  }

  return (
    <div className="view schedules-view">
      <h2 className="view-title">Schedule Manager</h2>

      {/* Status */}
      <section className="section">
        <div className="card">
          <div className="card-header">
            <span className="card-icon">⏱</span>
            <span className="card-label">Scheduler Database</span>
          </div>
          <div className="card-detail">
            <div className="status-row">
              <span className={`status-dot ${data.dbExists ? "dot-success" : "dot-error"}`} />
              <span>{data.dbExists ? "Active" : "Not initialized"}</span>
            </div>
            {data.dbExists && (
              <div className="status-row">
                <span className="text-muted">Size: {(data.dbSize / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section">
        <h3 className="section-title">Managing Schedules</h3>
        <p className="section-desc">
          Use the AI chat to manage schedules. The scheduler MCP server handles all task operations.
        </p>
        <div className="command-list">
          <div className="command-item">
            <code className="command-code">"Schedule a daily briefing at 8am"</code>
            <span className="command-desc">Creates a recurring cron task</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Check pending tasks"</code>
            <span className="command-desc">Lists tasks ready to execute</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Show all my scheduled tasks"</code>
            <span className="command-desc">Lists all tasks with status</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Pause task [id]"</code>
            <span className="command-desc">Pauses a running schedule</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Load the daily-briefing chain"</code>
            <span className="command-desc">Starts a multi-step workflow</span>
          </div>
        </div>
      </section>

      {/* Common Cron Patterns */}
      <section className="section">
        <h3 className="section-title">Common Cron Patterns</h3>
        <div className="info-list">
          <div className="info-row">
            <code className="info-label mono">0 8 * * *</code>
            <span className="info-value">Daily at 8:00 AM</span>
          </div>
          <div className="info-row">
            <code className="info-label mono">0 */4 * * *</code>
            <span className="info-value">Every 4 hours</span>
          </div>
          <div className="info-row">
            <code className="info-label mono">*/30 * * * *</code>
            <span className="info-value">Every 30 minutes</span>
          </div>
          <div className="info-row">
            <code className="info-label mono">0 9 * * 1-5</code>
            <span className="info-value">Weekdays at 9:00 AM</span>
          </div>
          <div className="info-row">
            <code className="info-label mono">0 0 * * 0</code>
            <span className="info-value">Weekly on Sunday midnight</span>
          </div>
        </div>
      </section>

      {/* Pre-built Chains */}
      <section className="section">
        <h3 className="section-title">Pre-built Task Chains</h3>
        <div className="chain-list">
          <div className="chain-card">
            <div className="chain-name">daily-briefing</div>
            <div className="chain-desc">Morning briefing: email + tasks + monitored sites → summary → send</div>
            <div className="chain-schedule">Cron: 0 8 * * *</div>
          </div>
          <div className="chain-card">
            <div className="chain-name">website-monitor</div>
            <div className="chain-desc">Check monitored sites for changes and alert on detection</div>
            <div className="chain-schedule">Cron: 0 */4 * * *</div>
          </div>
          <div className="chain-card">
            <div className="chain-name">inbox-processor</div>
            <div className="chain-desc">Read messages, categorize, process commands, respond</div>
            <div className="chain-schedule">Cron: */30 * * * * (disabled by default)</div>
          </div>
        </div>
      </section>
    </div>
  );
}
