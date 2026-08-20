/**
 * @license
 * e-Mam System - User Management State Store
 * LAYER: STORE (Zustand Store) (Vertical Slice Architecture Compliant)
 */

import { create } from 'zustand';
import type { UserData, Student, Teacher, UserRole } from '@/types';
import { userService } from '../services/user.service';

interface UserManagementState {
  users: UserData[];
  studentsCache: Student[];
  teachersCache: Teacher[];
  isLoading: boolean;
  isSyncing: boolean;
  isDomainLoading: boolean;
  error: string | null;

  loadUsers: (tenantId: string, forceSync?: boolean) => Promise<void>;
  loadDomainCaches: (tenantId: string) => Promise<void>;
  createUser: (
    operatorUid: string,
    newUser: UserData
  ) => Promise<void>;
  updateUserMetadata: (
    operatorUid: string,
    updatedUser: UserData
  ) => Promise<void>;
  deleteUser: (operatorUid: string, uid: string, tenantId: string) => Promise<void>;
  syncFromCloud: (tenantId: string) => Promise<void>;
  migrateUser: (
    operatorUid: string,
    user: UserData,
    targetType: string,
    selectedRefId: string,
    selectedRoles: UserRole[]
  ) => Promise<void>;
}

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  users: [],
  studentsCache: [],
  teachersCache: [],
  isLoading: false,
  isSyncing: false,
  isDomainLoading: false,
  error: null,

  loadUsers: async (tenantId: string, forceSync = false) => {
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      // 1. Selalu muat dari database lokal (Dexie) terlebih dahulu
      let localUsers = await userService.getUsers(tenantId);

      // 2. Jika lokal kosong atau dipaksa sinkronisasi (forceSync)
      if (localUsers.length === 0 || forceSync) {
        if (forceSync) {
          set({ isSyncing: true });
        }
        localUsers = await userService.syncFromCloud(tenantId);
      }

      set({ users: localUsers, isLoading: false, isSyncing: false });
    } catch (err: any) {
      console.error('[userManagementStore] Gagal memuat data pengguna:', err);
      set({ error: err.message || 'Gagal memuat data pengguna', isLoading: false, isSyncing: false });
      throw err;
    }
  },

  createUser: async (operatorUid, newUser) => {
    set({ isLoading: true, error: null });
    try {
      await userService.createUser(operatorUid, newUser);

      // Perbarui state lokal di store
      const finalUserPayload: UserData = {
        ...newUser,
        role: (newUser.roles && newUser.roles[0]) || newUser.role,
      };

      set((state) => ({
        users: [finalUserPayload, ...state.users],
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('[userManagementStore] Gagal menambahkan pengguna baru:', err);
      set({ error: err.message || 'Gagal menambahkan pengguna', isLoading: false });
      throw err;
    }
  },

  updateUserMetadata: async (operatorUid, updatedUser) => {
    set({ isLoading: true, error: null });
    try {
      // Panggil Service untuk validasi silang, penyimpanan local, audit, dan sinkronisasi
      await userService.updateUserMetadata(operatorUid, updatedUser);

      // Perbarui state lokal di store agar UI langsung reaktif
      const updatedList = get().users.map((u) => {
        if (u.uid === updatedUser.uid) {
          return {
            ...u,
            ...updatedUser,
            role: (updatedUser.roles && updatedUser.roles[0]) || u.role,
          };
        }
        return u;
      });

      set({ users: updatedList, isLoading: false });
    } catch (err: any) {
      console.error('[userManagementStore] Gagal memperbarui metadata pengguna:', err);
      set({ error: err.message || 'Gagal memperbarui pengguna', isLoading: false });
      throw err;
    }
  },

  deleteUser: async (operatorUid, uid, tenantId) => {
    set({ isLoading: true, error: null });
    try {
      await userService.deleteUser(operatorUid, uid, tenantId);

      // Perbarui state lokal di store
      const updatedList = get().users.filter((u) => u.uid !== uid);
      set({ users: updatedList, isLoading: false });
    } catch (err: any) {
      console.error('[userManagementStore] Gagal menghapus pengguna:', err);
      set({ error: err.message || 'Gagal menghapus pengguna', isLoading: false });
      throw err;
    }
  },

  syncFromCloud: async (tenantId) => {
    set({ isSyncing: true, error: null });
    try {
      const syncedUsers = await userService.syncFromCloud(tenantId);
      set({ users: syncedUsers, isSyncing: false });
    } catch (err: any) {
      console.error('[userManagementStore] Gagal sinkronisasi dari cloud:', err);
      set({ error: err.message || 'Gagal sinkronisasi data', isSyncing: false });
      throw err;
    }
  },

  loadDomainCaches: async (tenantId) => {
    if (!tenantId) return;
    set({ isDomainLoading: true });
    try {
      const students = await userService.getStudentsCache(tenantId);
      const teachers = await userService.getTeachersCache(tenantId);
      set({ studentsCache: students, teachersCache: teachers, isDomainLoading: false });
    } catch (err: any) {
      console.error('[userManagementStore] Gagal memuat cache domain:', err);
      set({ isDomainLoading: false });
    }
  },

  migrateUser: async (operatorUid, user, targetType, selectedRefId, selectedRoles) => {
    set({ isLoading: true, error: null });
    try {
      await userService.migrateUser(operatorUid, user, targetType, selectedRefId, selectedRoles);
      
      // Update local users array
      const updatedList = get().users.map((u) => {
        if (u.uid === user.uid) {
          return {
            ...u,
            accountType: targetType as any,
            assignment: u.assignment ? {
              ...u.assignment,
              positionId: selectedRefId || undefined,
            } : {
              positionId: selectedRefId || undefined,
            },
            roles: selectedRoles,
            role: selectedRoles[0] || u.role,
          };
        }
        return u;
      });

      set({ users: updatedList, isLoading: false });
    } catch (err: any) {
      console.error('[userManagementStore] Gagal melakukan migrasi pengguna:', err);
      set({ error: err.message || 'Gagal migrasi pengguna', isLoading: false });
      throw err;
    }
  },
}));
