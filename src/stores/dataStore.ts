import { create } from 'zustand';
import type { AcademicYear, Semester } from '@/types';

interface DataState {
  academicYears: AcademicYear[];
  semesters: Semester[];
  isDataLoaded: boolean;
  setAcademicYears: (years: AcademicYear[]) => void;
  setSemesters: (semesters: Semester[]) => void;
  setIsDataLoaded: (loaded: boolean) => void;
}

export const useDataStore = create<DataState>((set) => ({
  academicYears: [
    {
      id: 'ay-2024-2025',
      name: '2024/2025',
      startDate: '2024-07-15',
      endDate: '2025-06-20',
      isActive: false,
    },
    {
      id: 'ay-2025-2026',
      name: '2025/2026',
      startDate: '2025-07-14',
      endDate: '2026-06-25',
      isActive: true,
    },
  ],
  semesters: [
    {
      id: 'sem-1',
      academicYearId: 'ay-2025-2026',
      name: 'Ganjil',
      isActive: false,
    },
    {
      id: 'sem-2',
      academicYearId: 'ay-2025-2026',
      name: 'Genap',
      isActive: true,
    },
  ],
  isDataLoaded: true,
  setAcademicYears: (academicYears) => set({ academicYears }),
  setSemesters: (semesters) => set({ semesters }),
  setIsDataLoaded: (isDataLoaded) => set({ isDataLoaded }),
}));
