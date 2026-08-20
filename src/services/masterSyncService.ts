/**
 * @license
 * e-Mam System - Master Data Sync Service
 * LAYER: SERVICE (Architecture Compliant)
 */

import { localDb } from '@/database/dexie';
import { CacheService } from './CacheService';

export const masterSyncService = {
  /**
   * Checks if the locally cached master version matches the current server version.
   * If different or forced, triggers Delta Sync for all master collections.
   */
  async checkAndSyncMasterData(
    tenantId: string,
    currentServerVersion: number,
    force = false,
  ): Promise<boolean> {
    if (!tenantId) {
      console.warn('[masterSyncService] Sync aborted: tenantId is missing');
      return false;
    }

    try {
      // Get user role for selective sync
      const { useAuthStore } = await import('@/stores/authStore');
      const user = useAuthStore.getState().user;
      const roles = user?.roles || [user?.role];
      const isAdmin = roles.some((r) =>
        ['admin', 'super_admin', 'developer', 'kepala_madrasah', 'kepala_tu'].includes(
          String(r).toLowerCase(),
        ),
      );

      // 1. Get last synced version from Dexie systemSettings
      const versionRecord = await localDb.systemSettings.get('last_synced_master_version');
      const lastSyncedVersion = versionRecord ? Number(versionRecord.value) : 0;

      if (!force && lastSyncedVersion === currentServerVersion && currentServerVersion > 0) {
        console.log(
          `[masterSyncService] Master version matches (${currentServerVersion}). Using Dexie 100%.`,
        );
        return false;
      }

      console.log(
        `⚡ [masterSyncService] Master version mismatch (Local: ${lastSyncedVersion}, Server: ${currentServerVersion}). Starting Delta Sync...`,
      );

      // 2. Perform Delta Sync for all master data collections
      const syncOptions = { tenantId, forceRefresh: force };

      const collections = [
        { name: 'students', idField: 'idUnik' },
        { name: 'teachers', idField: 'teachersId' },
        { name: 'classes', idField: 'id' },
        { name: 'point_categories', idField: 'id' },
        { name: 'academic_years', idField: 'id' },
        { name: 'schedules', idField: 'id' },
      ];

      if (isAdmin) {
        collections.push({ name: 'users', idField: 'uid' });
      }

      const { useSyncStore } = await import('@/stores/syncStore');
      const setSyncStatus = useSyncStore.getState().setSyncStatus;
      const { SyncEngine } = await import('./SyncEngine');

      setSyncStatus({ isSyncing: true, progress: 0, message: 'Memulai sinkronisasi data master...' });

      let completedCount = 0;
      let hasFailures = false;

      for (const col of collections) {
        try {
          await SyncEngine.pullCollection(col.name, tenantId, col.idField);
          console.log(`[masterSyncService] Delta pull completed for ${col.name}`);
        } catch (err) {
          console.error(`[masterSyncService] Delta pull failed for ${col.name}:`, err);
          hasFailures = true;
        } finally {
          completedCount++;
          const progress = Math.round((completedCount / collections.length) * 100);
          setSyncStatus({ progress, message: `Sinkronisasi ${col.name}... (${progress}%)` });
        }
      }

      setSyncStatus({ isSyncing: false, progress: 100 });

      if (!hasFailures) {
        // 3. Update last synced master version in Dexie
        await localDb.systemSettings.put({
          key: 'last_synced_master_version',
          value: currentServerVersion,
          lastUpdated: Date.now(),
        });
        console.log(
          `[masterSyncService] Sync completed. Master version updated to ${currentServerVersion}`,
        );

        // Trigger global custom event so hooks can reload Dexie state without queries
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('emam:master_data_synced'));
        }
        return true;
      } else {
        console.warn(
          '[masterSyncService] Some collections failed to sync. Will retry on next check.',
        );
        return false;
      }
    } catch (err) {
      console.error('[masterSyncService] Master data sync failed:', err);
      return false;
    }
  },
};
