import React from 'react';
import { useMonitorStore } from "@/core/monitoring/MonitorStore";
import { env } from '../config/env';

export function RuntimeBadge() {
  const state = useMonitorStore();

  if (env.IS_PROD) return null;

  const copyError = () => {
    navigator.clipboard.writeText(
      JSON.stringify(
        {
          architecture: state.architectureScore,
          listeners: state.listeners,
          errors: state.errors,
          renderMetrics: state.renderMetrics,
          details: state.details,
          lastError: state.lastError,
        },
        null,
        2
      )
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 15,
        bottom: 15,
        background: state.violations ? "#991b1b" : "#111",
        color: "#fff",
        padding: 12,
        borderRadius: 12,
        zIndex: 99999,
        fontSize: "12px",
        fontFamily: "monospace",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontWeight: "bold" }}>
        {state.violations ? "🔴" : "🟢"} A{state.architectureScore} L{state.listeners} Q{state.queue} T{state.tenantErrors} E{state.errors}
      </div>

      {state.lastError && (
        <div style={{ marginTop: 4, color: "#fca5a5" }}>
          ⚠ {state.lastError}
        </div>
      )}

      <button
        onClick={copyError}
        style={{
          marginTop: 6,
          padding: "2px 8px",
          background: "#333",
          color: "#fff",
          border: "1px solid #555",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: "11px",
        }}
      >
        Copy Report
      </button>
    </div>
  );
}
