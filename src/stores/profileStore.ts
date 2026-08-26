import { create } from 'zustand';
export const useProfileStore = create((set: any) => ({
  profile: null,
  setProfile: (profile: any) => set({ profile }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  clearProfile: () => set({ profile: null })
}));
