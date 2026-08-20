import { env } from '../core/config/env';
import { create } from 'zustand';

export type LogLayer = 'UI' | 'Hook' | 'Store' | 'Service' | 'Repository' | 'SyncQueue' | 'SyncEngine' | 'Firestore';
export type LogStatus = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface DevLogItem {
  id: string;
  timestamp: string;
  layer: LogLayer;
  action: string;
  status: LogStatus;
  duration?: number;
  metadata?: any;
}

interface DeveloperLogState {
  logs: DevLogItem[];
  isOpen: boolean;
  isCollapsed: boolean;
  isPaused: boolean;
  filterLayer: string | null;
  filterStatus: string | null;
  searchQuery: string;

  add: (log: Omit<DevLogItem, 'id' | 'timestamp'>) => void;
  clear: () => void;
  pause: () => void;
  resume: () => void;
  copy: () => void;
  exportLogs: () => void;
  toggle: () => void;
  collapse: () => void;
  setFilterLayer: (layer: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useDeveloperLogStore = create<DeveloperLogState>((set, get) => ({
  logs: [],
  isOpen: true,
  isCollapsed: false,
  isPaused: false,
  filterLayer: null,
  filterStatus: null,
  searchQuery: '',

  add: (log) => {
    if (get().isPaused) return;
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const newItem: DevLogItem = {
      id: 'LOG_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
      timestamp,
      ...log,
    };
    set((state) => {
      const updated = [newItem, ...state.logs];
      if (updated.length > 500) {
        updated.length = 500;
      }
      return { logs: updated };
    });
  },

  clear: () => set({ logs: [] }),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  copy: () => {
    const text = get().logs.map(l => `[${l.timestamp}] [${l.layer}] [${l.status}] ${l.action} ${l.metadata ? JSON.stringify(l.metadata) : ''}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  },
  exportLogs: () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(get().logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `developer_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  collapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setFilterLayer: (layer) => set({ filterLayer: layer }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

export const devLog = {
  info: (layer: LogLayer, action: string, metadata?: any, duration?: number) => {
    if (env.IS_PROD) return;
    useDeveloperLogStore.getState().add({ layer, action, status: 'INFO', metadata, duration });
  },
  success: (layer: LogLayer, action: string, metadata?: any, duration?: number) => {
    if (env.IS_PROD) return;
    useDeveloperLogStore.getState().add({ layer, action, status: 'SUCCESS', metadata, duration });
  },
  warning: (layer: LogLayer, action: string, metadata?: any, duration?: number) => {
    if (env.IS_PROD) return;
    useDeveloperLogStore.getState().add({ layer, action, status: 'WARNING', metadata, duration });
  },
  error: (layer: LogLayer, action: string, metadata?: any, duration?: number) => {
    if (env.IS_PROD) return;
    useDeveloperLogStore.getState().add({ layer, action, status: 'ERROR', metadata, duration });
  },
};
