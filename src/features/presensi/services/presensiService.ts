import { isReadOnly } from '@/services/authService';
import { auditLog } from '@/services/auditLogService';
import { getMakassarDateString, getMakassarTimeString } from '@/utils/timezone';
import type { Student, AttendanceRecord} from '@/types';
import { assertPermission } from '@/services/securityService';
import { PERMISSIONS } from '@/types/permissions';
import { sanitizeError, sanitizeForJSON } from '@/utils/firestoreHelpers';
import { TenantContext } from '@/core/context/TenantContext';
import { presensiRepository } from '../repositories/presensiRepository';
import { syncRepository } from '@/repositories/SyncRepository';
import { localDb } from '@/database/dexie';
import { useUserStore } from '@/stores/userStore';
import { CacheService } from '@/services/CacheService';
import { normalizeRombelName } from '@/utils/rombelHelpers';

export type AttendanceSession = 'Masuk' | 'Duha' | 'Zuhur' | 'Ashar' | 'Pulang';

const ATT_COL = 'attendance';

export class PresensiService {
  async getCachedData(tenantId: string) {
    return await CacheService.getCachedData<AttendanceRecord>(ATT_COL, tenantId);
  }

  async saveLocal(data: AttendanceRecord | AttendanceRecord[]) {
    const context = TenantContext.getContext();
    if (Array.isArray(data)) {
      return await presensiRepository.saveBatch(context, data);
    }
    return await presensiRepository.save(context, data);
  }

  async enqueueSync(payload: any, action = 'SCAN_PRESENSI') {
    const context = TenantContext.getContext();
    const tenantId = context.tenantId;

    let targetCollection = ATT_COL;
    if (action === 'ADD_POINT') {
      targetCollection = 'points';
    }

    return await syncRepository.enqueue({
      tenantId,
      action: action as any,
      collection: targetCollection as any,
      payload,
    } as any);
  }

  async getAttendanceByClassAndDate(
    classNameRaw: string,
    date: string,
    forceRefresh = false,
  ) {
    try {
      assertPermission(PERMISSIONS.ATTENDANCE_READ, 'Read Attendance By Class');
      const className = normalizeRombelName(classNameRaw);
      const tenantId = useUserStore.getState().tenantId;
      if (!tenantId) throw new Error('tenantId required');
  
      const context = TenantContext.getContext();
      if (!forceRefresh) {
        const cached = await presensiRepository.getByClassAndDate(tenantId, className, date);
        if (cached.length > 0)
          return cached.sort((a, b) =>
            (a.namaLengkap || (a as any).studentName || '').localeCompare(
              b.namaLengkap || (b as any).studentName || '',
            ),
          );
      }
  
      const records = await presensiRepository.getByDate(tenantId, date);
      const results = records || [];
  
      if (results.length > 0) {
        await CacheService.saveToCache(ATT_COL, results, tenantId);
        await this.saveLocal(results);
      }
  
      return results.sort((a, b) => {
        const nameA = a.namaLengkap || (a as any).studentName || (a as any).name || '';
        const nameB = b.namaLengkap || (b as any).studentName || (b as any).name || '';
        return nameA.localeCompare(nameB);
      });
    } catch (error: any) {
      console.warn('Firestore fetch failed, falling back to local Dexie cache:', error.message);
      const tenantId = useUserStore.getState().tenantId || '30315537';
      const className = normalizeRombelName(classNameRaw);
      const cached = await presensiRepository.getByClassAndDate(tenantId, className, date);
      return cached.sort((a, b) => {
        const nameA = a.namaLengkap || (a as any).studentName || (a as any).name || '';
        const nameB = b.namaLengkap || (b as any).studentName || (b as any).name || '';
        return nameA.localeCompare(nameB);
      });
    }
  }

  // ... (Other methods migrated similarly)
}

export const presensiService = new PresensiService();
