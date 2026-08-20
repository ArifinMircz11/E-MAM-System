import {create} from "zustand";

interface MonitorState {
  listeners: number;
  queue: number;
  tenantErrors: number;
  errors: number;
  architectureScore: number;
  violations: number;
  lastError: string | null;
  stuck: boolean;
  realtimeDisabled: boolean;
  details: string[];

  renderMetrics: Record<string, { count: number; lastTimeMs: number; avgTimeMs: number }>;

  setMetric(data: Partial<MonitorState>): void;
  recordRenderMetric(componentName: string, durationMs: number): void;
  addDetail(message: string): void;
  resetError(): void;
}

export const useMonitorStore = create<MonitorState>((set) => ({
  listeners: 0,
  queue: 0,
  tenantErrors: 0,
  errors: 0,
  architectureScore: 100,
  violations: 0,
  lastError: null,
  stuck: false,
  realtimeDisabled: false,
  details: [],
  renderMetrics: {},

  setMetric(data) {
    set(data);
  },

  recordRenderMetric(componentName, durationMs) {
    set((state) => {
      const existing = state.renderMetrics[componentName] || { count: 0, lastTimeMs: 0, avgTimeMs: 0 };
      const newCount = existing.count + 1;
      const newAvg = (existing.avgTimeMs * existing.count + durationMs) / newCount;

      return {
        renderMetrics: {
          ...state.renderMetrics,
          [componentName]: {
            count: newCount,
            lastTimeMs: durationMs,
            avgTimeMs: Math.round(newAvg * 100) / 100,
          },
        },
      };
    });
  },

  addDetail(message) {
    set(state => ({
      details: [...state.details, message],
      violations: state.violations + 1,
      architectureScore: Math.max(0, 100 - (state.violations + 1) * 5)
    }));
  },

  resetError() {
    set({
      errors: 0,
      lastError: null
    });
  }
}));
