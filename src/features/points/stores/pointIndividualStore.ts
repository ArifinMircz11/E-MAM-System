/**
 * @license
 * e-Mam System - Student Points Individual Store
 * LAYER: STORE (Zustand UI State)
 */

import { create } from 'zustand';

export type IndividualSubTab = 'summary' | 'timeline' | 'charts' | 'letters';

interface PointIndividualState {
  selectedStudentId: string | null;
  selectedStudentData: any | null;
  activeSubTab: IndividualSubTab;

  // Actions
  setSelectedStudent: (student: any | null) => void;
  setSelectedStudentId: (id: string | null) => void;
  setActiveSubTab: (tab: IndividualSubTab) => void;
  clearSelection: () => void;
}

export const usePointIndividualStore = create<PointIndividualState>((set) => ({
  selectedStudentId: null,
  selectedStudentData: null,
  activeSubTab: 'summary',

  setSelectedStudent: (student) =>
    set({
      selectedStudentData: student,
      selectedStudentId: student?.id || student?.idUnik || null,
    }),
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  setActiveSubTab: (activeSubTab) => set({ activeSubTab }),
  clearSelection: () =>
    set({
      selectedStudentId: null,
      selectedStudentData: null,
      activeSubTab: 'summary',
    }),
}));
