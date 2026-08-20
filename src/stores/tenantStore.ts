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
  config: TenantConfig;
  setTenantConfig: (config: Partial<TenantConfig>) => void;
}

const defaultTenantConfig: TenantConfig = {
  npsn: '30315537',
  namaSekolah: 'MAN 1 Hulu Sungai Tengah',
  batasWaktuMasuk: '07:15',
  batasWaktuPulang: '14:30',
  geofenceRadius: 100, // meters
  latitude: -2.593, // Default koordinat MAN 1 HST
  longitude: 115.385,
};

export const useTenantStore = create<TenantState>((set) => ({
  config: (() => {
    if (typeof window === 'undefined') return defaultTenantConfig;
    try {
      const cached = localStorage.getItem('emam_tenant_config');
      return cached ? { ...defaultTenantConfig, ...JSON.parse(cached) } : defaultTenantConfig;
    } catch (e) {
      return defaultTenantConfig;
    }
  })(),
  setTenantConfig: (newConfig) =>
    set((state) => {
      const updatedConfig = { ...state.config, ...newConfig };
      try {
        localStorage.setItem('emam_tenant_config', JSON.stringify(updatedConfig));
      } catch (e) {}
      return { config: updatedConfig };
    }),
}));
