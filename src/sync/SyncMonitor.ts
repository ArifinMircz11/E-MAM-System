/**
 * @license
 * e-Mam System - Sync Monitor
 * LAYER: CORE SYNC LAYER
 */

import { create } from 'zustand';

export interface SyncMonitorState {
  pendingQueue: number;
  lastSync: string;
  failedCount: number;
  conflictCount: number;
  network: 'ONLINE' | 'OFFLINE';
  updateStatus: (updates: Partial<Omit<SyncMonitorState, 'updateStatus'>>) => void;
}

export const useSyncMonitor = create<SyncMonitorState>((set) => ({
  pendingQueue: 0,
  lastSync: '-',
  failedCount: 0,
  conflictCount: 0,
  network: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
  updateStatus: (updates) => set((state) => ({ ...state, ...updates })),
}));
