import React, { useState, useEffect, useCallback } from "react";
import type { ViewName, VsCodeApi, DashboardData, SchedulesData, MemoriesData, ConfigData } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./views/Dashboard";
import { Schedules } from "./views/Schedules";
import { Communications } from "./views/Communications";
import { Memory } from "./views/Memory";
import { Settings } from "./views/Settings";
import "./styles.css";

interface AppProps {
  vscode: VsCodeApi;
}

export function App({ vscode }: AppProps) {
  const [view, setView] = useState<ViewName>("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [schedulesData, setSchedulesData] = useState<SchedulesData | null>(null);
  const [memoriesData, setMemoriesData] = useState<MemoriesData | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data;
    switch (message.command) {
      case "dashboardData":
        setDashboardData(message.data);
        break;
      case "schedulesData":
        setSchedulesData(message.data);
        break;
      case "memoriesData":
        setMemoriesData(message.data);
        break;
      case "configData":
        setConfigData(message.data);
        break;
      case "navigate":
        if (message.view) setView(message.view);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    // Request initial data
    vscode.postMessage({ command: "loadDashboardData" });
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage, vscode]);

  useEffect(() => {
    switch (view) {
      case "dashboard":
        vscode.postMessage({ command: "loadDashboardData" });
        break;
      case "schedules":
        vscode.postMessage({ command: "loadSchedules" });
        break;
      case "memory":
        vscode.postMessage({ command: "loadMemories" });
        break;
      case "settings":
        vscode.postMessage({ command: "loadConfig" });
        break;
    }
  }, [view, vscode]);

  return (
    <div className="app">
      <Sidebar currentView={view} onNavigate={setView} />
      <main className="main-content">
        {view === "dashboard" && <Dashboard data={dashboardData} vscode={vscode} />}
        {view === "schedules" && <Schedules data={schedulesData} vscode={vscode} />}
        {view === "communications" && <Communications vscode={vscode} />}
        {view === "memory" && <Memory data={memoriesData} vscode={vscode} />}
        {view === "settings" && <Settings data={configData} vscode={vscode} />}
      </main>
    </div>
  );
}
