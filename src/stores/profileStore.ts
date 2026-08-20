import { create } from 'zustand';
import type { Student, Teacher } from '@/types';

interface ProfileState {
  profile: Student | Teacher | any | null;
  isLoading: boolean;
  error: string | null;

  setProfile: (profile: any) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  setProfile: (profile) => set({ profile, isLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearProfile: () => set({ profile: null, error: null, isLoading: false }),
}));
