import React, { useState, useEffect } from "react";
import type { ConfigData, VsCodeApi } from "../types";

interface SettingsProps {
  data: ConfigData | null;
  vscode: VsCodeApi;
}

export function Settings({ data, vscode }: SettingsProps) {
  const [config, setConfig] = useState<any>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.config) {
      setConfig(data.config);
      setDirty(false);
    }
  }, [data]);

  if (!data || !config) {
    return <div className="view-loading">Loading settings...</div>;
  }

  const updateConfig = (path: string[], value: any) => {
    const next = JSON.parse(JSON.stringify(config));
    let obj = next;
    for (let i = 0; i < path.length - 1; i++) {
      if (!obj[path[i]]) obj[path[i]] = {};
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = value;
    setConfig(next);
    setDirty(true);
  };

  const saveConfig = () => {
    vscode.postMessage({ command: "saveConfig", config });
    setDirty(false);
    vscode.postMessage({ command: "showInfo", text: "Configuration saved!" });
  };

  const autonomous = config.autonomous ?? {};

  return (
    <div className="view settings-view">
      <h2 className="view-title">
        Settings
        {dirty && <span className="unsaved-badge">Unsaved changes</span>}
      </h2>

      {/* Autonomous Mode */}
      <section className="section">
        <h3 className="section-title">Autonomous Mode</h3>
        <div className="setting-group">
          <div className="setting-row">
            <label className="setting-label">Enabled</label>
            <button
              className={`toggle-btn ${autonomous.enabled ? "toggle-on" : "toggle-off"}`}
              onClick={() => updateConfig(["autonomous", "enabled"], !autonomous.enabled)}
            >
              {autonomous.enabled ? "ON" : "OFF"}
            </button>
          </div>
          <div className="setting-row">
            <label className="setting-label">Notify on completion</label>
            <button
              className={`toggle-btn ${autonomous.notifyOnCompletion !== false ? "toggle-on" : "toggle-off"}`}
              onClick={() =>
                updateConfig(["autonomous", "notifyOnCompletion"], !(autonomous.notifyOnCompletion !== false))
              }
            >
              {autonomous.notifyOnCompletion !== false ? "ON" : "OFF"}
            </button>
          </div>
          <div className="setting-row">
            <label className="setting-label">Notification channel</label>
            <select
              className="setting-select"
              value={autonomous.defaultNotificationChannel ?? "telegram"}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                updateConfig(["autonomous", "defaultNotificationChannel"], e.target.value)
              }
            >
              <option value="telegram">Telegram</option>
              <option value="discord">Discord</option>
              <option value="slack">Slack</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <h3 className="section-title">Services</h3>
        <div className="setting-group">
          <div className="setting-row">
            <label className="setting-label">Memory</label>
            <button
              className={`toggle-btn ${config.memory?.enabled !== false ? "toggle-on" : "toggle-off"}`}
              onClick={() => updateConfig(["memory", "enabled"], !(config.memory?.enabled !== false))}
            >
              {config.memory?.enabled !== false ? "ON" : "OFF"}
            </button>
          </div>
          <div className="setting-row">
            <label className="setting-label">Scheduler</label>
            <button
              className={`toggle-btn ${config.scheduler?.enabled ? "toggle-on" : "toggle-off"}`}
              onClick={() => updateConfig(["scheduler", "enabled"], !config.scheduler?.enabled)}
            >
              {config.scheduler?.enabled ? "ON" : "OFF"}
            </button>
          </div>
          <div className="setting-row">
            <label className="setting-label">Communications</label>
            <button
              className={`toggle-btn ${config.comms?.enabled ? "toggle-on" : "toggle-off"}`}
              onClick={() => updateConfig(["comms", "enabled"], !config.comms?.enabled)}
            >
              {config.comms?.enabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="section">
        <h3 className="section-title">Configured API Keys</h3>
        <p className="section-desc">
          Keys are stored in your .env file. Edit .env directly to add or change API keys.
        </p>
        {data.envKeys.length > 0 ? (
          <div className="info-list">
            {data.envKeys.map((key) => (
              <div key={key} className="info-row">
                <span className="info-label">{key}</span>
                <span className="info-value text-success">Configured</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No API keys configured in .env</p>
        )}
      </section>

      {/* Diagnostics */}
      <section className="section">
        <h3 className="section-title">Diagnostics</h3>
        <div className="action-grid">
          <button
            className="action-btn"
            onClick={() => vscode.postMessage({ command: "runDoctor" })}
          >
            <span className="action-icon">🔍</span>
            <span>Run Doctor</span>
          </button>
        </div>
      </section>

      {/* Save */}
      {dirty && (
        <div className="save-bar">
          <button className="save-btn" onClick={saveConfig}>
            Save Configuration
          </button>
        </div>
      )}
    </div>
  );
}
