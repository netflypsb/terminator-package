import React, { useState } from "react";
import type { CommunicationsData, ChannelStatus, VsCodeApi } from "../types";

interface CommunicationsProps {
  data: CommunicationsData | null;
  vscode: VsCodeApi;
}

export function Communications({ data, vscode }: CommunicationsProps) {
  const [selectedChannel, setSelectedChannel] = useState<ChannelStatus | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [testMessage, setTestMessage] = useState("Test message from Terminator");

  if (!data) {
    return <div className="view-loading">Loading communications...</div>;
  }

  const handleTestChannel = (channelId: string) => {
    vscode.postMessage({
      command: "invokeMcpTool",
      tool: `${channelId}_send`,
      args: { message: testMessage }
    });
  };

  const handleReadMessages = (channelId: string) => {
    vscode.postMessage({
      command: "invokeMcpTool",
      tool: `${channelId}_read`,
      args: { limit: 10 }
    });
  };

  const maskCredential = (value: string) => {
    if (!value || value.length < 4) return "••••";
    return value.substring(0, 4) + "••••" + value.substring(value.length - 2);
  };

  const getStatusColor = (configured: boolean) => {
    return configured ? "text-success" : "text-muted";
  };

  return (
    <div className="view comms-view">
      <h2 className="view-title">Communication Hub</h2>

      {/* Channel Status */}
      <section className="section">
        <h3 className="section-title">Channel Status</h3>
        <div className="channel-list">
          {data.channels.map((ch) => (
            <div key={ch.id} className="channel-card card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1" onClick={() => setSelectedChannel(ch)} style={{ cursor: "pointer" }}>
                    <div className="d-flex align-items-center mb-2">
                      <span className="channel-icon me-2">{ch.icon}</span>
                      <h5 className="card-title mb-0">{ch.name}</h5>
                      <span className={`badge ms-2 ${getStatusColor(ch.configured)}`}>
                        {ch.configured ? "Configured" : "Not Configured"}
                      </span>
                    </div>
                    {ch.credentials.length > 0 && (
                      <div className="channel-credentials mb-2">
                        <small className="text-muted d-block">Required credentials:</small>
                        {ch.credentials.map((key) => (
                          <code key={key} className="me-2">{key}</code>
                        ))}
                      </div>
                    )}
                    {ch.lastMessage && (
                      <div className="last-message">
                        <small className="text-muted">Last message: {ch.lastMessage}</small>
                      </div>
                    )}
                    <div className="mt-2">
                      <small className="text-muted">Last check: {ch.lastCheck}</small>
                    </div>
                  </div>
                  <div className="channel-actions">
                    {ch.configured && (
                      <>
                        <button 
                          className="btn btn-primary btn-sm me-2 mb-1" 
                          onClick={() => handleTestChannel(ch.id)}
                        >
                          Test
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm mb-1" 
                          onClick={() => handleReadMessages(ch.id)}
                        >
                          Read
                        </button>
                      </>
                    )}
                    <button 
                      className="btn btn-outline-primary btn-sm ms-2" 
                      onClick={() => {
                        setSelectedChannel(ch);
                        setShowCredentialModal(true);
                      }}
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Messages */}
      <section className="section">
        <h3 className="section-title">Recent Messages</h3>
        {data.recentMessages.length === 0 ? (
          <div className="text-muted">No recent messages</div>
        ) : (
          <div className="message-list">
            {data.recentMessages.map((msg, idx) => (
              <div key={idx} className="message-item card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="badge bg-secondary me-2">{msg.channel}</span>
                      <span className={`badge ${msg.direction === 'in' ? 'bg-info' : 'bg-success'}`}>
                        {msg.direction === 'in' ? 'Received' : 'Sent'}
                      </span>
                    </div>
                    <small className="text-muted">{msg.timestamp}</small>
                  </div>
                  <div className="mt-2">{msg.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Send Test Message</h5>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter test message"
                  />
                </div>
                <div className="d-grid gap-2">
                  {data.channels.filter(ch => ch.configured).map(ch => (
                    <button 
                      key={ch.id} 
                      className="btn btn-outline-primary"
                      onClick={() => handleTestChannel(ch.id)}
                    >
                      Send via {ch.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Check All Channels</h5>
                <p className="card-text">Read recent messages from all configured channels</p>
                <button 
                  className="btn btn-primary w-100"
                  onClick={() => {
                    data.channels.filter(ch => ch.configured).forEach(ch => {
                      handleReadMessages(ch.id);
                    });
                  }}
                >
                  Check All
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Remote Commands Reference */}
      <section className="section">
        <h3 className="section-title">Remote Commands</h3>
        <p className="section-desc">
          Send these commands from any configured channel to control Terminator remotely:
        </p>
        <div className="command-list">
          <div className="command-item">
            <code className="command-code">/status</code>
            <span className="command-desc">Report current task status</span>
          </div>
          <div className="command-item">
            <code className="command-code">/tasks</code>
            <span className="command-desc">List scheduled and active tasks</span>
          </div>
          <div className="command-item">
            <code className="command-code">/do &lt;instruction&gt;</code>
            <span className="command-desc">Execute an instruction</span>
          </div>
          <div className="command-item">
            <code className="command-code">/pause</code>
            <span className="command-desc">Pause autonomous operations</span>
          </div>
          <div className="command-item">
            <code className="command-code">/resume</code>
            <span className="command-desc">Resume paused operations</span>
          </div>
          <div className="command-item">
            <code className="command-code">/memory &lt;query&gt;</code>
            <span className="command-desc">Search memory</span>
          </div>
        </div>
      </section>

      {/* Channel Detail Modal */}
      {selectedChannel && (
        <div className="modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <span className="me-2">{selectedChannel.icon}</span>
                  {selectedChannel.name} Configuration
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedChannel(null)}></button>
              </div>
              <div className="modal-body">
                <p>Configure {selectedChannel.name} by setting the following environment variables in your <code>.env</code> file:</p>
                
                {selectedChannel.envKeys.length > 0 ? (
                  <div className="credential-list">
                    {selectedChannel.envKeys.map((key) => (
                      <div key={key} className="mb-3">
                        <label className="form-label"><code>{key}</code></label>
                        <input 
                          type="password" 
                          className="form-control" 
                          placeholder={`Enter ${key}`}
                          defaultValue=""
                        />
                        <small className="form-text text-muted">
                          This will be stored securely in VSCode's secret storage
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    {selectedChannel.name} is always available and requires no configuration.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedChannel(null)}>
                  Close
                </button>
                {selectedChannel.envKeys.length > 0 && (
                  <button type="button" className="btn btn-primary" onClick={() => {
                    vscode.postMessage({
                      command: "configureChannel",
                      channel: selectedChannel.id
                    });
                    setSelectedChannel(null);
                  }}>
                    Save Configuration
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
