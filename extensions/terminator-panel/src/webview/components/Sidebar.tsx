import React from "react";
import type { ViewName } from "../types";

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

const NAV_ITEMS: { id: ViewName; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "schedules", label: "Schedules", icon: "⏱" },
  { id: "communications", label: "Comms", icon: "✉" },
  { id: "memory", label: "Memory", icon: "◉" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">T</span>
        <span className="sidebar-title">Terminator</span>
      </div>
      <ul className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              className={`sidebar-btn ${currentView === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
