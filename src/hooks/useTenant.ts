export { useTenantStore } from '@/stores/tenantStore';

export const useTenant = () => {
  return {
    tenantId: 'tenant-demo',
    tenantName: 'Madrasah Aliyah Negeri 1',
  };
};
