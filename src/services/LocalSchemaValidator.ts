/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: SERVICE / LOCAL SCHEMA VALIDATOR
 * Performs pre-flight checks on IndexedDB and core structures to prevent "undefined" errors.
 */

import { localDb } from '@/database/dexie';
import { auth, db } from '@/services/firebase';
import { toast } from 'sonner';

export const LocalSchemaValidator = {
  /**
   * Validates that the local database is correctly initialized and all tables are accessible.
   */
  async validateDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 [LocalSchemaValidator] Starting pre-flight system validation...');

      // 1. Check if core services are initialized (non-fatal in mock/offline mode)
      if (typeof auth === 'undefined')
        console.warn('⚠️ [LocalSchemaValidator] Auth service is undefined (running in mock/offline mode).');
      if (typeof db === 'undefined')
        console.warn('⚠️ [LocalSchemaValidator] Firestore service is undefined (running in mock/offline mode).');

      // 2. Check if localDb itself is undefined
      if (!localDb) {
        return { success: false, error: 'Database instance (localDb) is undefined.' };
      }

      // 3. Check if tables are accessible (not null/undefined)
      const requiredTables = [
        'students',
        'teachers',
        'classes',
        'point_categories',
        'attendance',
        'cache',
        'systemSettings',
        'sync_queue',
        'users',
        'points',
        'dead_letter_queue',
        'notifications',
        'schedules',
        'letters',
        'audit_logs',
        'academic_years',
        'student_point_summaries',
      ];

      for (const tableName of requiredTables) {
        if (!(localDb as any)[tableName]) {
          return { success: false, error: `Table '${tableName}' is missing from database schema.` };
        }
      }

      // 4. Perform a test query to verify IndexedDB is open and responsive
      // Wrap in a Promise.race to prevent infinite hanging
      const queryPromise = (async () => {
        await localDb.systemSettings.get('local_schema_version');
        return true;
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Database query timeout (possibly locked by another tab or failed migration)',
              ),
            ),
          3000,
        ),
      );

      try {
        await Promise.race([queryPromise, timeoutPromise]);
      } catch (queryErr: any) {
        console.error('❌ [LocalSchemaValidator] Test query failed:', queryErr);
        return { success: false, error: `IndexedDB query failed: ${queryErr.message}` };
      }

      console.log('✅ [LocalSchemaValidator] System validation passed.');
      return { success: true };
    } catch (err: any) {
      console.error('❌ [LocalSchemaValidator] Fatal validation error:', err);
      return { success: false, error: err.message || 'Unknown validation error' };
    }
  },

  /**
   * Runs the validation and attempts automatic recovery if it fails.
   */
  async runSelfHealingValidation(): Promise<boolean> {
    // Only run on client side
    if (typeof window === 'undefined') return true;

    const result = await this.validateDatabase();

    if (!result.success) {
      console.error(`🚨 [LocalSchemaValidator] SELF-HEALING TRIGGERED: ${result.error}`);

      // Show toast if possible
      toast.error('Sistem mendeteksi inkonsistensi struktur data.', {
        description: 'Mencoba perbaikan otomatis untuk mencegah crash...',
        duration: 5000,
      });

      try {
        // If tables are missing or database is corrupted, we might need to reset
        if (
          result.error?.includes('missing') ||
          result.error?.includes('query failed') ||
          result.error?.includes('timeout')
        ) {
          console.warn(
            '[LocalSchemaValidator] Database integrity compromised. Clearing IndexedDB...',
          );

          // Force close database to unlock it
          if (localDb && localDb.isOpen()) {
            localDb.close();
          }

          // Delete database directly using IndexedDB API for maximum reliability
          const DB_NAME = 'e-Mam_Enterprise_LocalDB';
          const deleteReq = indexedDB.deleteDatabase(DB_NAME);

          deleteReq.onsuccess = () => {
            console.log('[LocalSchemaValidator] Database deleted successfully. Reloading...');
            window.location.reload();
          };

          deleteReq.onerror = () => {
            console.error('[LocalSchemaValidator] Failed to delete database.');
            // fallback: try clearing localStorage too
            localStorage.clear();
            window.location.reload();
          };

          return false;
        }
      } catch (recoveryErr) {
        console.error('[LocalSchemaValidator] Recovery attempt failed:', recoveryErr);
      }

      return false;
    }

    return true;
  },
};
