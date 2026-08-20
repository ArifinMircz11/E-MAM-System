import { create } from 'zustand';
import type { Teacher } from '@/types';
import { 
  getTeachers, 
  addTeacher, 
  updateTeacher, 
  deleteTeacher 
} from '@/services/teacherService';
import { toast } from 'sonner';

interface TeacherState {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
  fetchTeachers: (forceRefresh?: boolean) => Promise<Teacher[]>;
  addTeacher: (teacher: Teacher) => Promise<string>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  teachers: [],
  loading: false,
  error: null,

  fetchTeachers: async (forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const data = await getTeachers(forceRefresh);
      set({ teachers: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return [];
    }
  },

  addTeacher: async (teacher: Teacher) => {
    try {
      const id = await addTeacher(teacher);
      await get().fetchTeachers(true);
      return id;
    } catch (err: any) {
      toast.error('Gagal menambah guru: ' + err.message);
      throw err;
    }
  },

  updateTeacher: async (id: string, teacher: Partial<Teacher>) => {
    try {
      await updateTeacher(id, teacher);
      await get().fetchTeachers(true);
    } catch (err: any) {
      toast.error('Gagal memperbarui guru: ' + err.message);
      throw err;
    }
  },

  deleteTeacher: async (id: string) => {
    try {
      await deleteTeacher(id);
      await get().fetchTeachers(true);
    } catch (err: any) {
      toast.error('Gagal menghapus guru: ' + err.message);
      throw err;
    }
  },
}));
