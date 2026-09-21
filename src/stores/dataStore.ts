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
  academicYears: [],
  semesters: [],
  isDataLoaded: false,
  setAcademicYears: (academicYears) => set({ academicYears }),
  setSemesters: (semesters) => set({ semesters }),
  setIsDataLoaded: (isDataLoaded) => set({ isDataLoaded }),
}));
