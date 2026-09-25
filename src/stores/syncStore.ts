import { create } from 'zustand';

export interface SyncStoreState {
  isSyncing: boolean;
  pendingWritesCount: number;
  lastSync: number | null;
  progress: number;
  message: string;
  isOnline: boolean;
  setIsSyncing: (value: boolean) => void;
  setPendingWritesCount: (value: number) => void;
  setLastSync: (value: number | null) => void;
  setProgress: (value: number) => void;
  setMessage: (value: string) => void;
  setIsOnline: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  isSyncing: false,
  pendingWritesCount: 0,
  lastSync: null,
  progress: 0,
  message: '',
  isOnline: true,
};

export const useSyncStore = create<SyncStoreState>((set) => ({
  ...initialState,
  setIsSyncing: (value) => set({ isSyncing: value }),
  setPendingWritesCount: (value) => set({ pendingWritesCount: value }),
  setLastSync: (value) => set({ lastSync: value }),
  setProgress: (value) => set({ progress: Math.max(0, Math.min(100, value)) }),
  setMessage: (value) => set({ message: value }),
  setIsOnline: (value) => set({ isOnline: value }),
  reset: () => set({ ...initialState }),
}));
