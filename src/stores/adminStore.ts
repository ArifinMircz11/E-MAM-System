import { create } from 'zustand';

export interface AdminState {
  systemHealth: string;
  activeSessions: number;
  setSystemHealth: (status: string) => void;
  setActiveSessions: (count: number) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  systemHealth: 'healthy',
  activeSessions: 1,
  setSystemHealth: (systemHealth) => set({ systemHealth }),
  setActiveSessions: (activeSessions) => set({ activeSessions }),
}));
