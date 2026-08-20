import { create } from 'zustand';
import { useUserStore } from './userStore';
import { localDb } from '../database/dexie';
import { TenantContext } from '../core/context/TenantContext';
import {
  subscribePendingApprovals as subPending,
  subscribeUsers,
  suspendUser as suspend,
  reactivateUser as reactivate,
  rejectPendingAccount as reject,
  approveProfileUpdateRequest as approve,
  rejectProfileUpdateRequest as rejectProfile,
  deleteProfileUpdateRequest as delProfile,
  reviseProfileUpdateRequest as reviseProfile,
  updateUserDataAndSync as syncUpdate,
} from '../services/userService';

interface AdminState {
  pendingApprovals: any[];
  usersList: any[];

  // Actions
  subscribePendingApprovals: () => () => void;
  subscribeUsersList: () => () => void;
  suspendUser: (userId: string, displayName: string) => Promise<boolean>;
  reactivateUser: (userId: string, displayName: string) => Promise<boolean>;
  rejectPendingAccount: (userId: string) => Promise<boolean>;
  approveProfileUpdateRequest: (
    reqId: string,
    studentId: string,
    userId: string,
    changes: any,
  ) => Promise<boolean>;
  rejectProfileUpdateRequest: (reqId: string) => Promise<boolean>;
  deleteProfileUpdateRequest: (reqId: string) => Promise<boolean>;
  reviseProfileUpdateRequest: (reqId: string, requestedChanges: any) => Promise<boolean>;
  updateUserDataAndSync: (userId: string, updatedData: any, appClasses: any[]) => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set) => ({
  pendingApprovals: [],
  usersList: [],

  subscribePendingApprovals: () => {
    let unsub: () => void;

    // 1. Instantly load from local storage/Dexie cache
    const tenantId = useUserStore.getState().tenantId;
    if (tenantId) {
      const cacheKey = `pending_approvals_${tenantId}`;
      localDb.cache
        .get(cacheKey)
        .then((cached) => {
          if (cached && cached.data && Array.isArray(cached.data)) {
            console.log(`[Cache-First] Loaded ${cached.data.length} approvals from Dexie cache`);
            set({ pendingApprovals: cached.data });
          }
        })
        .catch((err) => console.warn('[Cache] Failed to load approvals from Dexie:', err));
    }

    const onUpdate = (data: any[]) => {
      set({ pendingApprovals: data });
      // 2. Save fresh data to local cache
      const currentTenantId = useUserStore.getState().tenantId;
      if (currentTenantId) {
        const cacheKey = `pending_approvals_${currentTenantId}`;
        localDb.cache
          .put({
            key: cacheKey,
            data: data,
            updatedAt: Date.now(),
          })
          .catch((err) => console.warn('[Cache] Failed to save approvals to Dexie:', err));
      }
    };

    unsub = subPending(onUpdate);
    return () => unsub && unsub();
  },

  subscribeUsersList: () => {
    let unsub: () => void;

    // 1. Instantly load from local storage/Dexie cache
    const tenantId = useUserStore.getState().tenantId;
    if (tenantId) {
      const cacheKey = `users_list_${tenantId}`;
      localDb.cache
        .get(cacheKey)
        .then((cached) => {
          if (cached && cached.data && Array.isArray(cached.data)) {
            console.log(`[Cache-First] Loaded ${cached.data.length} users from Dexie cache`);
            set({ usersList: cached.data });
          }
        })
        .catch((err) => console.warn('[Cache] Failed to load users from Dexie:', err));
    }

    const onUpdate = (users: any[]) => {
      set({ usersList: users });
      // 2. Save fresh data to Dexie cache for subsequent loads
      const currentTenantId = useUserStore.getState().tenantId;
      if (currentTenantId) {
        const cacheKey = `users_list_${currentTenantId}`;
        localDb.cache
          .put({
            key: cacheKey,
            data: users,
            updatedAt: Date.now(),
          })
          .catch((err) => console.warn('[Cache] Failed to save users to Dexie:', err));
      }
    };

    unsub = subscribeUsers(onUpdate);
    return () => unsub && unsub();
  },

  suspendUser: async (userId, displayName) => {
    return await suspend(userId, displayName);
  },

  reactivateUser: async (userId, displayName) => {
    return await reactivate(userId, displayName);
  },

  rejectPendingAccount: async (userId) => {
    return await reject(userId);
  },

  approveProfileUpdateRequest: async (reqId, studentId, userId, changes) => {
    return await approve(reqId, studentId, userId, changes);
  },

  rejectProfileUpdateRequest: async (reqId) => {
    return await rejectProfile(reqId);
  },

  deleteProfileUpdateRequest: async (reqId) => {
    return await delProfile(reqId);
  },

  reviseProfileUpdateRequest: async (reqId, requestedChanges) => {
    return await reviseProfile(reqId, requestedChanges);
  },

  updateUserDataAndSync: async (userId, updatedData, appClasses) => {
    return await syncUpdate(userId, updatedData, appClasses);
  },
}));
