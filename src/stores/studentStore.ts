import { create } from 'zustand';
import { Student } from '@/types';

export interface StudentState {
  students: Student[];
  selectedStudent: Student | null;
  isLoading: boolean;
  searchQuery: string;
  selectedClassId: string | null;
  setStudents: (students: Student[]) => void;
  setSelectedStudent: (student: Student | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedClassId: (classId: string | null) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  selectedStudent: null,
  isLoading: false,
  searchQuery: '',
  selectedClassId: null,
  setStudents: (students) => set({ students }),
  setSelectedStudent: (selectedStudent) => set({ selectedStudent }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedClassId: (selectedClassId) => set({ selectedClassId }),
}));
