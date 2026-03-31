import React, { useState } from "react";
import type { SchedulesData, ScheduleItem, ExecutionQueueItem, VsCodeApi } from "../types";

interface SchedulesProps {
  data: SchedulesData | null;
  vscode: VsCodeApi;
}

export function Schedules({ data, vscode }: SchedulesProps) {
  const [selectedTask, setSelectedTask] = useState<ScheduleItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!data) {
    return <div className="view-loading">Loading schedules...</div>;
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-success";
      case "paused": return "text-warning";
      case "completed": return "text-muted";
      case "cancelled": return "text-danger";
      default: return "";
    }
  };

  const getQueueStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-info";
      case "claimed": return "text-warning";
      case "completed": return "text-success";
      case "failed": return "text-danger";
      case "missed": return "text-muted";
      default: return "";
    }
  };

  const handleDeleteTask = (taskId: string) => {
    vscode.postMessage({
      command: "invokeMcpTool",
      tool: "schedule_cancel",
      args: { id: taskId }
    });
  };

  const handlePauseTask = (taskId: string) => {
    vscode.postMessage({
      command: "invokeMcpTool",
      tool: "schedule_pause",
      args: { id: taskId }
    });
  };

  const handleResumeTask = (taskId: string) => {
    vscode.postMessage({
      command: "invokeMcpTool",
      tool: "schedule_resume",
      args: { id: taskId }
    });
  };

  const handleStartDaemon = () => {
    vscode.postMessage({
      command: "runCommand",
      args: "pnpm start:daemon"
    });
  };

  const handleStopDaemon = () => {
    vscode.postMessage({
      command: "runCommand",
      args: "pnpm stop:daemon"
    });
  };

  return (
    <div className="view schedules-view">
      <h2 className="view-title">Schedule Manager</h2>

      {/* Daemon Status */}
      <section className="section">
        <h3 className="section-title">Background Daemon</h3>
        <div className="card">
          <div className="card-header">
            <span className={`card-icon ${data.daemonStatus.running ? "text-success" : "text-danger"}`}>
              {data.daemonStatus.running ? "🟢" : "🔴"}
            </span>
            <span className="card-label">Daemon Status</span>
          </div>
          <div className="card-detail">
            <div className="status-row">
              <span>{data.daemonStatus.running ? "Running" : "Stopped"}</span>
              {data.daemonStatus.pid && <span className="text-muted">(PID: {data.daemonStatus.pid})</span>}
            </div>
            {data.daemonStatus.started_at && (
              <div className="status-row">
                <span className="text-muted">Started: {formatDateTime(data.daemonStatus.started_at)}</span>
              </div>
            )}
            <div className="status-row">
              <span className="text-success">✓ {data.daemonStatus.executions_completed} completed</span>
              <span className="text-danger ms-3">✗ {data.daemonStatus.executions_failed} failed</span>
            </div>
            {data.daemonStatus.last_execution && (
              <div className="status-row">
                <span className="text-muted">Last execution: {formatDateTime(data.daemonStatus.last_execution)}</span>
              </div>
            )}
            <div className="card-actions mt-3">
              {!data.daemonStatus.running ? (
                <button className="btn btn-success btn-sm" onClick={handleStartDaemon}>
                  Start Daemon
                </button>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={handleStopDaemon}>
                  Stop Daemon
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Execution Queue */}
      <section className="section">
        <h3 className="section-title">Execution Queue ({data.queue.length})</h3>
        {data.queue.length === 0 ? (
          <div className="text-muted">No pending executions</div>
        ) : (
          <div className="queue-list">
            {data.queue.map((item: ExecutionQueueItem) => (
              <div key={item.id} className="queue-item card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title">Execution #{item.id}</h5>
                      <p className="card-text text-muted">{item.task_name}</p>
                      <small className="text-muted">
                        Scheduled: {formatDateTime(item.scheduled_for)}
                      </small>
                    </div>
                    <span className={`badge bg-secondary ${getQueueStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.claimed_by && (
                    <div className="mt-2">
                      <small className="text-muted">Claimed by: {item.claimed_by}</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Scheduled Tasks */}
      <section className="section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="section-title mb-0">Scheduled Tasks ({data.tasks.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            Create Task
          </button>
        </div>
        
        {data.tasks.length === 0 ? (
          <div className="text-muted">No scheduled tasks</div>
        ) : (
          <div className="task-list">
            {data.tasks.map((task: ScheduleItem) => (
              <div key={task.id} className="task-item card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1" onClick={() => setSelectedTask(task)} style={{ cursor: "pointer" }}>
                      <h5 className="card-title">{task.name}</h5>
                      <p className="card-text">{task.description}</p>
                      <div className="task-meta">
                        <span className={`badge ${getStatusColor(task.status)}`}>{task.status}</span>
                        <span className="badge bg-secondary ms-2">{task.type}</span>
                        {task.cron_expression && (
                          <code className="ms-2">{task.cron_expression}</code>
                        )}
                      </div>
                      <div className="mt-2 text-muted small">
                        <div>Next run: {formatDateTime(task.next_run)}</div>
                        <div>Last run: {formatDateTime(task.last_run)}</div>
                        <div>Run count: {task.run_count}{task.max_runs && ` / ${task.max_runs}`}</div>
                      </div>
                    </div>
                    <div className="task-actions">
                      {task.status === "active" && (
                        <button className="btn btn-warning btn-sm me-2" onClick={() => handlePauseTask(task.id)}>
                          Pause
                        </button>
                      )}
                      {task.status === "paused" && (
                        <button className="btn btn-success btn-sm me-2" onClick={() => handleResumeTask(task.id)}>
                          Resume
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Note */}
      {(data as any).note && (
        <section className="section">
          <div className="alert alert-info">
            {(data as any).note}
          </div>
        </section>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedTask.name}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedTask(null)}></button>
              </div>
              <div className="modal-body">
                <p>{selectedTask.description}</p>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td>Type:</td>
                      <td>{selectedTask.type}</td>
                    </tr>
                    <tr>
                      <td>Status:</td>
                      <td><span className={`badge ${getStatusColor(selectedTask.status)}`}>{selectedTask.status}</span></td>
                    </tr>
                    <tr>
                      <td>Created:</td>
                      <td>{formatDateTime(selectedTask.created_at)}</td>
                    </tr>
                    <tr>
                      <td>Next run:</td>
                      <td>{formatDateTime(selectedTask.next_run)}</td>
                    </tr>
                    <tr>
                      <td>Last run:</td>
                      <td>{formatDateTime(selectedTask.last_run)}</td>
                    </tr>
                    <tr>
                      <td>Run count:</td>
                      <td>{selectedTask.run_count}{selectedTask.max_runs && ` / ${selectedTask.max_runs}`}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedTask(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
