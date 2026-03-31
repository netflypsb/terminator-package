import React from "react";
import type { DashboardData, VsCodeApi } from "../types";

interface DashboardProps {
  data: DashboardData | null;
  vscode: VsCodeApi;
}

export function Dashboard({ data, vscode }: DashboardProps) {
  if (!data) {
    return <div className="view-loading">Loading dashboard...</div>;
  }

  const builtCount = data.serverStatus.filter((s) => s.built).length;
  const totalServers = data.serverStatus.length;
  const skillCount = data.skillsIndex?.skills?.filter((s: any) => s.installed)?.length ?? 0;
  const agentCount = data.skillsIndex?.agents?.filter((a: any) => a.installed)?.length ?? 0;
  const hookCount = data.hooks?.hooks?.length ?? 0;

  return (
    <div className="view dashboard-view">
      <h2 className="view-title">Dashboard</h2>

      {/* Status Cards */}
      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-icon">⚡</span>
            <span className="card-label">MCP Servers</span>
          </div>
          <div className="card-value">
            <span className={builtCount === totalServers ? "text-success" : "text-warning"}>
              {builtCount}/{totalServers}
            </span>
          </div>
          <div className="card-detail">
            {data.serverStatus.map((s) => (
              <div key={s.name} className="status-row">
                <span className={`status-dot ${s.built ? "dot-success" : "dot-error"}`} />
                <span className="status-name">{s.name.replace("terminator-", "")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-icon">🧠</span>
            <span className="card-label">Intelligence</span>
          </div>
          <div className="card-value">{skillCount + agentCount}</div>
          <div className="card-detail">
            <div className="status-row">
              <span className="status-dot dot-success" />
              <span>{skillCount} skills installed</span>
            </div>
            <div className="status-row">
              <span className="status-dot dot-success" />
              <span>{agentCount} agents installed</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-icon">📡</span>
            <span className="card-label">Channels</span>
          </div>
          <div className="card-value">{data.channels.length}</div>
          <div className="card-detail">
            {data.channels.length > 0 ? (
              data.channels.map((ch) => (
                <div key={ch} className="status-row">
                  <span className="status-dot dot-success" />
                  <span>{ch}</span>
                </div>
              ))
            ) : (
              <span className="text-muted">No channels configured</span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-icon">🔄</span>
            <span className="card-label">Automation</span>
          </div>
          <div className="card-value">{hookCount}</div>
          <div className="card-detail">
            <div className="status-row">
              <span className={`status-dot ${data.autonomousEnabled ? "dot-success" : "dot-muted"}`} />
              <span>Autonomous: {data.autonomousEnabled ? "ON" : "OFF"}</span>
            </div>
            <div className="status-row">
              <span className="status-dot dot-success" />
              <span>{hookCount} hooks registered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-grid">
          <button className="action-btn" onClick={() => vscode.postMessage({ command: "showInfo", text: "Use the chat to create a new task: 'Schedule a daily briefing at 8am'" })}>
            <span className="action-icon">➕</span>
            <span>New Task</span>
          </button>
          <button className="action-btn" onClick={() => vscode.postMessage({ command: "showInfo", text: "Use the chat: 'Research [topic]'" })}>
            <span className="action-icon">🔍</span>
            <span>Research</span>
          </button>
          <button className="action-btn" onClick={() => vscode.postMessage({ command: "showInfo", text: "Use the chat: 'Write a document about [topic]'" })}>
            <span className="action-icon">✏️</span>
            <span>Write</span>
          </button>
          <button className="action-btn" onClick={() => vscode.postMessage({ command: "showInfo", text: "Use the chat: 'Analyze the data in [file]'" })}>
            <span className="action-icon">📊</span>
            <span>Analyze</span>
          </button>
        </div>
      </section>

      {/* System Info */}
      <section className="section">
        <h3 className="section-title">System</h3>
        <div className="info-list">
          <div className="info-row">
            <span className="info-label">Version</span>
            <span className="info-value">{data.config?.version ?? "0.1.0"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">IDE</span>
            <span className="info-value">{data.skillsIndex?.ide ?? "Unknown"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Last installed</span>
            <span className="info-value">
              {data.skillsIndex?.installedAt
                ? new Date(data.skillsIndex.installedAt).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
