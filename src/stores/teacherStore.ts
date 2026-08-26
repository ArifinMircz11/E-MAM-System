import { create } from 'zustand';
import { Teacher } from '@/types';

export interface TeacherState {
  teachers: Teacher[];
  selectedTeacher: Teacher | null;
  isLoading: boolean;
  setTeachers: (teachers: Teacher[]) => void;
  setSelectedTeacher: (teacher: Teacher | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useTeacherStore = create<TeacherState>((set) => ({
  teachers: [],
  selectedTeacher: null,
  isLoading: false,
  setTeachers: (teachers) => set({ teachers }),
  setSelectedTeacher: (selectedTeacher) => set({ selectedTeacher }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
