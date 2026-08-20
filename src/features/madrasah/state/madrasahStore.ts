import { create } from 'zustand';
import { Madrasah } from '../types';

interface MadrasahState {
  madrasahs: Madrasah[];
  isLoading: boolean;
  isFormOpen: boolean;
  selectedMadrasah: Madrasah | null;
  
  setMadrasahs: (madrasahs: Madrasah[]) => void;
  setLoading: (loading: boolean) => void;
  openForm: (madrasah?: Madrasah) => void;
  closeForm: () => void;
}

export const useMadrasahStore = create<MadrasahState>((set) => ({
  madrasahs: [],
  isLoading: false,
  isFormOpen: false,
  selectedMadrasah: null,
  
  setMadrasahs: (madrasahs) => set({ madrasahs }),
  setLoading: (isLoading) => set({ isLoading }),
  openForm: (madrasah) => set({ isFormOpen: true, selectedMadrasah: madrasah || null }),
  closeForm: () => set({ isFormOpen: false, selectedMadrasah: null }),
}));
