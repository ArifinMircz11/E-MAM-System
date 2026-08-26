import { create } from 'zustand';
export const useAuthStore = create((set: any) => ({
  user: null,
  accountStatus: null,
  pendingApprovalCount: 0,
  setUser: (user: any) => set((state: any) => {
    const currentUid = state.user?.uid || state.user?.id;
    const newUid = user?.uid || user?.id;
    return currentUid === newUid ? state : { user };
  }),
  setAccountStatus: (status: any) => set((state: any) => (state.accountStatus === status ? state : { accountStatus: status }))
}));
