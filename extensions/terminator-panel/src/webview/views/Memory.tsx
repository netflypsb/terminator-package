import React from "react";
import type { MemoriesData, VsCodeApi } from "../types";

interface MemoryProps {
  data: MemoriesData | null;
  vscode: VsCodeApi;
}

export function Memory({ data, vscode }: MemoryProps) {
  if (!data) {
    return <div className="view-loading">Loading memory data...</div>;
  }

  return (
    <div className="view memory-view">
      <h2 className="view-title">Memory Browser</h2>

      {/* Status */}
      <section className="section">
        <div className="card">
          <div className="card-header">
            <span className="card-icon">◉</span>
            <span className="card-label">Memory Database</span>
          </div>
          <div className="card-detail">
            <div className="status-row">
              <span className={`status-dot ${data.dbExists ? "dot-success" : "dot-error"}`} />
              <span>{data.dbExists ? "Active" : "Not initialized (will be created on first use)"}</span>
            </div>
            {data.dbExists && (
              <div className="status-row">
                <span className="text-muted">Size: {(data.dbSize / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Memory Operations */}
      <section className="section">
        <h3 className="section-title">Memory Operations</h3>
        <p className="section-desc">
          Use the AI chat to interact with memory. Terminator automatically stores important context.
        </p>
        <div className="command-list">
          <div className="command-item">
            <code className="command-code">"Search memory for [topic]"</code>
            <span className="command-desc">Find stored memories by keyword</span>
          </div>
          <div className="command-item">
            <code className="command-code">"List all memories tagged [tag]"</code>
            <span className="command-desc">Filter by tag (preference, finding, decision, task)</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Remember that my timezone is PST"</code>
            <span className="command-desc">Store a preference in memory</span>
          </div>
          <div className="command-item">
            <code className="command-code">"Forget the memory about [topic]"</code>
            <span className="command-desc">Delete a specific memory</span>
          </div>
          <div className="command-item">
            <code className="command-code">"What do you remember about [topic]?"</code>
            <span className="command-desc">Retrieve relevant memories</span>
          </div>
        </div>
      </section>

      {/* Memory Tags */}
      <section className="section">
        <h3 className="section-title">Standard Tags</h3>
        <div className="tag-grid">
          <div className="tag-item">
            <span className="tag">preference</span>
            <span className="tag-desc">User preferences (timezone, name, channels)</span>
          </div>
          <div className="tag-item">
            <span className="tag">finding</span>
            <span className="tag-desc">Research findings and discoveries</span>
          </div>
          <div className="tag-item">
            <span className="tag">decision</span>
            <span className="tag-desc">Decisions made during tasks</span>
          </div>
          <div className="tag-item">
            <span className="tag">task</span>
            <span className="tag-desc">Task outcomes and completions</span>
          </div>
          <div className="tag-item">
            <span className="tag">contact</span>
            <span className="tag-desc">Contact information and channels</span>
          </div>
          <div className="tag-item">
            <span className="tag">project</span>
            <span className="tag-desc">Project-specific context</span>
          </div>
          <div className="tag-item">
            <span className="tag">monitor</span>
            <span className="tag-desc">Monitored URLs and their state</span>
          </div>
          <div className="tag-item">
            <span className="tag">autonomous_action</span>
            <span className="tag-desc">Actions taken in autonomous mode</span>
          </div>
        </div>
      </section>
    </div>
  );
}
