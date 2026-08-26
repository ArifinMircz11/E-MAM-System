import { create } from 'zustand';

export interface SyncStoreState {
  isSyncing: boolean;
  lastSync: number | null;
  syncError: string | null;
  pendingCount: number;
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSync: (lastSync: number) => void;
  setSyncError: (error: string | null) => void;
  setPendingCount: (count: number) => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  isSyncing: false,
  lastSync: null,
  syncError: null,
  pendingCount: 0,
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setLastSync: (lastSync) => set({ lastSync }),
  setSyncError: (syncError) => set({ syncError }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
}));
