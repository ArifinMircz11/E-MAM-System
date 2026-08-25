import { create } from 'zustand';
export const useUserStore = create((set: any) => ({
  tenantId: 'default',
  setUserData: (data: any) => set(data),
  clearUserData: () => set({ tenantId: 'default' })
}));
