import { create } from 'zustand';

export interface SystemState {
  isOnline: boolean;
  maintenanceMode: boolean;
  systemReady: boolean;
  madrasahInfo: {
    namaMadrasah?: string;
    nsm?: string;
    npsn?: string;
    alamat?: string;
    logoApp?: string;
    kepalaMadrasah?: string;
  } | null;
  setIsOnline: (status: boolean) => void;
  setMaintenanceMode: (mode: boolean) => void;
  setMadrasahInfo: (info: any) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  maintenanceMode: false,
  systemReady: true,
  madrasahInfo: {
    namaMadrasah: 'Madrasah Hebat Bermartabat',
    nsm: '1234567890',
    npsn: '30315537',
  },
  setIsOnline: (isOnline) => set({ isOnline }),
  setMaintenanceMode: (maintenanceMode) => set({ maintenanceMode }),
  setMadrasahInfo: (madrasahInfo) => set({ madrasahInfo }),
}));
