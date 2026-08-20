import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  message: string;
  progress: number;
  lastSync: number | null;
  pendingWritesCount: number;

  setSyncStatus: (
    status: Partial<Omit<SyncState, 'setSyncStatus' | 'setPendingWritesCount'>>,
  ) => void;
  setPendingWritesCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  message: '',
  progress: 0,
  lastSync: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('emam_last_sync');
      return stored ? parseInt(stored) : null;
    } catch (e) {
      return null;
    }
  })(),
  pendingWritesCount: 0,

  setSyncStatus: (status) =>
    set((state) => {
      const newSyncStatus = { ...state, ...status };
      if (status.lastSync) {
        try {
          localStorage.setItem('emam_last_sync', status.lastSync.toString());
        } catch (e) {}
      }
      return newSyncStatus;
    }),
  setPendingWritesCount: (count) => set({ pendingWritesCount: count }),
}));
