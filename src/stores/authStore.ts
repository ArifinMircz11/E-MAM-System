import { create } from 'zustand';
export const useAuthStore = create(() => ({
  user: null,
  accountStatus: null,
  pendingApprovalCount: 0,
  setUser: () => {},
  setAccountStatus: () => {},
}));
