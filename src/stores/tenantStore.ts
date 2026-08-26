import { create } from 'zustand';

export interface TenantConfig {
  tenantId: string;
  name: string;
  npsn: string;
  nsm?: string;
  address?: string;
  logoUrl?: string;
}

export interface TenantState {
  config: TenantConfig;
  setTenantConfig: (config: Partial<TenantConfig>) => void;
}

export const useTenantStore = create<TenantState>((set) => {
  const defaultTenantConfig: TenantConfig = {
    tenantId: 'tenant-demo',
    name: 'Madrasah Aliyah Negeri 1',
    npsn: '20500001',
    nsm: '121235000001',
    address: 'Jl. Pendidikan No. 1',
  };

  return {
    config: defaultTenantConfig,
    setTenantConfig: (updates) => {
      set((state) => ({
        config: { ...state.config, ...updates },
      }));
    },
  };
});
