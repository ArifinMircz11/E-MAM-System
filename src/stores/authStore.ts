import { create } from 'zustand';
export const useAuthStore = create((set: any) => ({
  user: null,
  accountStatus: null,
  pendingApprovalCount: 0,
  setUser: (user: any) => set({ user }),
  setAccountStatus: (status: any) => set({ accountStatus: status })
}));
