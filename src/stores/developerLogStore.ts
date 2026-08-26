import { create } from 'zustand';

export interface DeveloperLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface DeveloperLogState {
  logs: DeveloperLog[];
  addLog: (log: Omit<DeveloperLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useDeveloperLogStore = create<DeveloperLogState>((set) => ({
  logs: [
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Sistem e-MAM diinisialisasi dalam mode offline-first (Dexie ready).',
    },
  ],
  addLog: (log) =>
    set((state) => ({
      logs: [
        {
          ...log,
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...state.logs,
      ].slice(0, 200),
    })),
  clearLogs: () => set({ logs: [] }),
}));
