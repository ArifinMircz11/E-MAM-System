import { create } from 'zustand';
import type { Student, Teacher, ClassData, AcademicYear, Semester } from '@/types';

interface DataState {
  students: Student[];
  teachers: Teacher[];
  classes: ClassData[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  isDataLoaded: {
    students: boolean;
    teachers: boolean;
    classes: boolean;
    academicYears: boolean;
    semesters: boolean;
  };

  setStudents: (data: Student[]) => void;
  setTeachers: (data: Teacher[]) => void;
  setClasses: (data: ClassData[]) => void;
  setAcademicYears: (data: AcademicYear[]) => void;
  setSemesters: (data: Semester[]) => void;

  resetData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  students: [],
  teachers: [],
  classes: [],
  academicYears: [],
  semesters: [],
  isDataLoaded: {
    students: false,
    teachers: false,
    classes: false,
    academicYears: false,
    semesters: false,
  },

  setStudents: (data) =>
    set((state) => ({
      students: data,
      isDataLoaded: { ...state.isDataLoaded, students: true },
    })),

  setTeachers: (data) =>
    set((state) => ({
      teachers: data,
      isDataLoaded: { ...state.isDataLoaded, teachers: true },
    })),

  setClasses: (data) =>
    set((state) => ({
      classes: data,
      isDataLoaded: { ...state.isDataLoaded, classes: true },
    })),

  setAcademicYears: (data) =>
    set((state) => ({
      academicYears: data,
      isDataLoaded: { ...state.isDataLoaded, academicYears: true },
    })),

  setSemesters: (data) =>
    set((state) => ({
      semesters: data,
      isDataLoaded: { ...state.isDataLoaded, semesters: true },
    })),

  resetData: () =>
    set({
      students: [],
      teachers: [],
      classes: [],
      academicYears: [],
      semesters: [],
      isDataLoaded: {
        students: false,
        teachers: false,
        classes: false,
        academicYears: false,
        semesters: false,
      },
    }),
}));
