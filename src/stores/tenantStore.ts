import { create } from 'zustand';

interface TenantConfig {
  npsn: string;
  namaSekolah: string;
  batasWaktuMasuk: string;
  batasWaktuPulang: string;
  geofenceRadius: number;
  latitude: number;
  longitude: number;
}

interface TenantState {
  config: TenantConfig | null;
  setTenantConfig: (config: Partial<TenantConfig>) => void;
  clearTenantConfig: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  config: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('emam_tenant_config');
      return cached ? (JSON.parse(cached) as TenantConfig) : null;
    } catch {
      return null;
    }
  })(),
  setTenantConfig: (newConfig) =>
    set((state) => {
      const updatedConfig = { ...(state.config || {}), ...newConfig } as TenantConfig;
      try {
        localStorage.setItem('emam_tenant_config', JSON.stringify(updatedConfig));
      } catch {}
      return { config: updatedConfig };
    }),
  clearTenantConfig: () => {
    try {
      localStorage.removeItem('emam_tenant_config');
    } catch {}
    set({ config: null });
  },
}));
