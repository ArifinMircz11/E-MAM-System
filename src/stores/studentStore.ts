import { create } from 'zustand';
import type { Student, ClassData } from '@/types';
import { getClasses } from '@/services/classService';
import {
  getStudents,
  getStudentsByClass,
  createStudent,
  updateStudent,
  deleteStudent,
  migrateStudentId,
  moveStudentToCollection,
  bulkImportStudents,
  bulkDeleteStudents,
  deleteAllStudents,
  triggerPasswordReset,
} from '@/services/studentService';

const CACHE_TTL = 24 * 60 * 60 * 1000;

interface StudentState {
  classes: ClassData[];
  students: Student[];
  selectedClass: ClassData | null;
  masterVersion: number | null;
  lastFetched: {
    classes: number | null;
    students: number | null;
  };
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setSelectedClass: (cls: ClassData | null) => void;
  setMasterVersion: (version: number) => void;
  fetchClasses: (force?: boolean) => Promise<ClassData[]>;
  fetchStudents: (force?: boolean) => Promise<Student[]>;
  fetchStudentsByClass: (className: string, bypassFilter?: boolean) => Promise<Student[]>;
  isCacheValid: (key: keyof StudentState['lastFetched'], ttl?: number) => boolean;

  // New CRUD & Bulk actions routing through Service
  createStudent: (student: Partial<Student>) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  migrateStudentId: (oldId: string, newId: string, data: Partial<Student>) => Promise<void>;
  moveStudentToCollection: (id: string, target: 'alumni' | 'mutasi', reason?: string) => Promise<void>;
  bulkImportStudents: (students: Student[]) => Promise<void>;
  bulkDeleteStudents: (studentIds: string[]) => Promise<void>;
  deleteAllStudents: () => Promise<void>;
  triggerPasswordReset: (email: string) => Promise<any>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  classes: [],
  students: [],
  selectedClass: null,
  masterVersion: null,
  lastFetched: {
    classes: null,
    students: null,
  },
  isLoading: false,
  isSubmitting: false,
  error: null,

  setSelectedClass: (selectedClass) => set({ selectedClass }),
  setMasterVersion: (masterVersion) => set({ masterVersion }),

  isCacheValid: (key, ttl = CACHE_TTL) => {
    const last = get().lastFetched[key];
    if (!last) return false;
    return Date.now() - last < ttl;
  },

  fetchClasses: async (force = false) => {
    if (!force && get().isCacheValid('classes') && get().classes.length > 0) return get().classes;

    // Prevent concurrent fetches
    if ((get() as any)._fetching_classes) return get().classes;
    (get() as any)._fetching_classes = true;

    set({ isLoading: true, error: null });
    try {
      const classes = await getClasses(force);
      const sortedClasses = [...classes].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      set({
        classes: sortedClasses,
        lastFetched: { ...get().lastFetched, classes: Date.now() },
        isLoading: false,
      });
      (get() as any)._fetching_classes = false;
      return sortedClasses;
    } catch (error: any) {
      console.warn('Fetch failed for classes', error);
      set({ isLoading: false, error: error.message || 'Gagal memuat kelas' });
      (get() as any)._fetching_classes = false;
      return get().classes;
    }
  },

  fetchStudents: async (force = false) => {
    if (!force && get().isCacheValid('students') && get().students.length > 0)
      return get().students;
    if ((get() as any)._fetching_students) return get().students;
    (get() as any)._fetching_students = true;

    set({ isLoading: true, error: null });
    try {
      const students = await getStudents('All');
      set({
        students,
        lastFetched: { ...get().lastFetched, students: Date.now() },
        isLoading: false,
      });
      (get() as any)._fetching_students = false;
      return students;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Gagal memuat siswa',
      });
      (get() as any)._fetching_students = false;
      return get().students;
    }
  },

  fetchStudentsByClass: async (className, bypassFilter = false) => {
    set({ isLoading: true, error: null });
    try {
      const students = await getStudentsByClass(className, bypassFilter);
      set({ students, isLoading: false });
      return students;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Gagal memuat siswa kelas' });
      return [];
    }
  },

  createStudent: async (student) => {
    set({ isSubmitting: true, error: null });
    try {
      const result = await createStudent(student);
      // Refresh local list
      const updatedStudents = [...get().students, result].sort((a, b) =>
        (a.namaLengkap || '').localeCompare(b.namaLengkap || '')
      );
      set({ students: updatedStudents, isSubmitting: false });
      return result;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal menambahkan siswa' });
      throw error;
    }
  },

  updateStudent: async (id, data) => {
    set({ isSubmitting: true, error: null });
    try {
      await updateStudent(id, data);
      // Refresh local state list
      const updatedStudents = get().students.map((s) => {
        if (s.id === id || s.idUnik === id) {
          return { ...s, ...data };
        }
        return s;
      });
      set({ students: updatedStudents, isSubmitting: false });
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal mengupdate siswa' });
      throw error;
    }
  },

  deleteStudent: async (id) => {
    set({ isSubmitting: true, error: null });
    try {
      await deleteStudent(id);
      // Refresh local list
      const updatedStudents = get().students.filter((s) => s.id !== id && s.idUnik !== id);
      set({ students: updatedStudents, isSubmitting: false });
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal menghapus siswa' });
      throw error;
    }
  },

  migrateStudentId: async (oldId, newId, data) => {
    set({ isSubmitting: true, error: null });
    try {
      await migrateStudentId(oldId, newId, data);
      // Update local state list
      const updatedStudents = get().students.map((s) => {
        if (s.id === oldId || s.idUnik === oldId) {
          return { ...s, ...data, id: newId, idUnik: newId, studentsId: newId };
        }
        return s;
      });
      set({ students: updatedStudents, isSubmitting: false });
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal migrasi ID siswa' });
      throw error;
    }
  },

  moveStudentToCollection: async (id, target, reason) => {
    set({ isSubmitting: true, error: null });
    try {
      await moveStudentToCollection(id, target, reason);
      // Archive/remove from active local list
      const updatedStudents = get().students.filter((s) => s.id !== id && s.idUnik !== id);
      set({ students: updatedStudents, isSubmitting: false });
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal mengarsipkan siswa' });
      throw error;
    }
  },

  bulkImportStudents: async (students) => {
    set({ isSubmitting: true, error: null });
    try {
      await bulkImportStudents(students);
      set({ isSubmitting: false });
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal mengimpor siswa' });
      throw error;
    }
  },

  bulkDeleteStudents: async (studentIds) => {
    set({ isSubmitting: true, error: null });
    try {
      await bulkDeleteStudents(studentIds);
      const updatedStudents = get().students.filter((s) => {
        const id = s.id || s.idUnik;
        return id ? !studentIds.includes(id) : true;
      });
      set({ students: updatedStudents, isSubmitting: false });
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal menghapus beberapa siswa' });
      throw error;
    }
  },

  deleteAllStudents: async () => {
    set({ isSubmitting: true, error: null });
    try {
      await deleteAllStudents();
      set({ students: [], isSubmitting: false });
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message || 'Gagal menghapus semua siswa' });
      throw error;
    }
  },

  triggerPasswordReset: async (email) => {
    try {
      return await triggerPasswordReset(email);
    } catch (error: any) {
      set({ error: error.message || 'Gagal mereset kata sandi' });
      throw error;
    }
  },
}));
