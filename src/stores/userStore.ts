import { create } from 'zustand';
export const useUserStore = create((set: any) => ({
  tenantId: 'default',
  setUserData: (data: any) => set((state: any) => (state === data ? state : { ...state, ...data })),
  clearUserData: () => set({ tenantId: 'default' })
}));
