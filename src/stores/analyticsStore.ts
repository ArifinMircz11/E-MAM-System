import { create } from 'zustand';

export interface AnalyticsState {
  metrics: Record<string, any>;
  setMetric: (key: string, value: any) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  metrics: {},
  setMetric: (key, value) =>
    set((state) => ({ metrics: { ...state.metrics, [key]: value } })),
}));
