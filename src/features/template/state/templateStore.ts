import { create } from 'zustand';
import type { TemplateFilterState, TemplateItem } from '../types/template.types';

interface TemplateState {
  selectedItem: TemplateItem | null;
  isModalOpen: boolean;
  filter: TemplateFilterState;
  setSelectedItem: (item: TemplateItem | null) => void;
  setModalOpen: (open: boolean) => void;
  setFilter: (filter: Partial<TemplateFilterState>) => void;
  resetFilter: () => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  selectedItem: null,
  isModalOpen: false,
  filter: {
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },
  setSelectedItem: (item) => set({ selectedItem: item }),
  setModalOpen: (open) => set({ isModalOpen: open }),
  setFilter: (newFilter) =>
    set((state) => ({ filter: { ...state.filter, ...newFilter } })),
  resetFilter: () =>
    set({
      filter: { searchQuery: '', sortBy: 'name', sortOrder: 'asc' },
    }),
}));
