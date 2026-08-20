/**
 * @license
 * e-Mam System - User Feature Hook
 * LAYER: HOOK (Vertical Slice Architecture Compliant)
 */

import { useCallback, useEffect } from 'react';
import type { UserData, UserRole } from '@/types';
import { useUserStore } from '@/stores/userStore';
import { useUserManagementStore } from '../stores/userManagementStore';
import { toast } from 'sonner';

export const useUsers = () => {
  const storeTenantId = useUserStore((state) => state.tenantId);
  const operatorUid = useUserStore((state) => state.uid) || 'admin';

  // Fallback if tenantId is 'default' or null/undefined
  const effectiveTenantId = !storeTenantId || storeTenantId === 'default' ? '30315537' : storeTenantId;

  const {
    users,
    studentsCache,
    teachersCache,
    isLoading,
    isSyncing,
    isDomainLoading,
    error,
    loadUsers,
    loadDomainCaches,
    createUser: storeCreateUser,
    updateUserMetadata: storeUpdateUserMetadata,
    deleteUser: storeDeleteUser,
    syncFromCloud: storeSyncFromCloud,
    migrateUser: storeMigrateUser,
  } = useUserManagementStore();

  const handleLoadUsers = useCallback(
    async (forceSync = false) => {
      if (!effectiveTenantId) return;
      try {
        await loadUsers(effectiveTenantId, forceSync);
        if (forceSync) {
          toast.success('Database user berhasil disinkronkan');
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat pengguna');
      }
    },
    [effectiveTenantId, loadUsers]
  );

  useEffect(() => {
    handleLoadUsers(false);
  }, [handleLoadUsers]);

  const loadCaches = useCallback(async () => {
    if (!effectiveTenantId) return;
    await loadDomainCaches(effectiveTenantId);
  }, [effectiveTenantId, loadDomainCaches]);

  const migrateUser = useCallback(
    async (user: UserData, targetType: string, selectedRefId: string, selectedRoles: UserRole[]) => {
      try {
        await storeMigrateUser(operatorUid, user, targetType, selectedRefId, selectedRoles);
        toast.success('Akun berhasil dimigrasikan secara lokal');
      } catch (err: any) {
        toast.error(err.message || 'Gagal memigrasikan akun');
        throw err;
      }
    },
    [operatorUid, storeMigrateUser]
  );

  const createUser = useCallback(
    async (user: UserData) => {
      try {
        await storeCreateUser(operatorUid, user);
        toast.success('Pengguna berhasil ditambahkan secara lokal');
      } catch (err: any) {
        toast.error(err.message || 'Gagal menambahkan pengguna');
        throw err;
      }
    },
    [operatorUid, storeCreateUser]
  );

  const updateUser = useCallback(
    async (user: UserData) => {
      try {
        await storeUpdateUserMetadata(operatorUid, user);
        toast.success('Pengguna berhasil diperbarui secara lokal');
      } catch (err: any) {
        toast.error(err.message || 'Gagal memperbarui pengguna');
        throw err;
      }
    },
    [operatorUid, storeUpdateUserMetadata]
  );

  const deleteUser = useCallback(
    async (uid: string) => {
      if (!effectiveTenantId) return;
      try {
        await storeDeleteUser(operatorUid, uid, effectiveTenantId);
        toast.success('Pengguna berhasil dihapus secara lokal');
      } catch (err: any) {
        toast.error(err.message || 'Gagal menghapus pengguna');
        throw err;
      }
    },
    [effectiveTenantId, operatorUid, storeDeleteUser]
  );

  const refresh = useCallback(async () => {
    if (!effectiveTenantId) return;
    try {
      await storeSyncFromCloud(effectiveTenantId);
      toast.success('Database user berhasil disinkronkan');
    } catch (err: any) {
      toast.error('Gagal melakukan sinkronisasi: ' + err.message);
    }
  }, [effectiveTenantId, storeSyncFromCloud]);

  return {
    users,
    studentsCache,
    teachersCache,
    isLoading,
    isSyncing,
    isDomainLoading,
    error,
    tenantId: effectiveTenantId,
    loadCaches,
    migrateUser,
    createUser,
    updateUser,
    deleteUser,
    refresh,
  };
};
