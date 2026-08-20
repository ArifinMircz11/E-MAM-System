import { create } from 'zustand';
import type { ClassFilterState, ClassRoom } from '../types/class.types';

interface ClassState {
  selectedClass: ClassRoom | null;
  isModalOpen: boolean;
  filter: ClassFilterState;
  setSelectedClass: (cls: ClassRoom | null) => void;
  setModalOpen: (open: boolean) => void;
  setFilter: (filter: Partial<ClassFilterState>) => void;
  resetFilter: () => void;
}

export const useClassStore = create<ClassState>((set) => ({
  selectedClass: null,
  isModalOpen: false,
  filter: {
    searchQuery: '',
    tingkat: 'all',
    academicYearId: 'all',
    status: 'all',
  },
  setSelectedClass: (cls) => set({ selectedClass: cls }),
  setModalOpen: (open) => set({ isModalOpen: open }),
  setFilter: (newFilter) =>
    set((state) => ({ filter: { ...state.filter, ...newFilter } })),
  resetFilter: () =>
    set({
      filter: { searchQuery: '', tingkat: 'all', academicYearId: 'all', status: 'all' },
    }),
}));
