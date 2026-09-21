import { create } from 'zustand';
export const useUserStore = create(() => ({
  tenantId: null,
  setUserData: () => {},
  clearUserData: () => {},
}));
