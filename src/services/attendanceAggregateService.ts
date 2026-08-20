/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: SERVICE LAYER (DEXIE OFFLINE-FIRST OPTIMIZED)
 */
import type { AttendanceRecord } from '../types';
import { localDb } from '@/database/dexie';

export interface MonthlyClassSummary {
  classId: string;
  month: string; // YYYY-MM
  tenantId: string;
  records: AttendanceRecord[];
  lastUpdate: any;
  isAggregate: boolean;
}

/**
 * MENGAMBIL DATA PRESENSI BERDASARKAN KELAS DAN BULAN (Monthly Report)
 * REFACTORED: OFFLINE-FIRST ARCHITECTURE.
 * Data di-query langsung dari IndexedDB (Dexie) untuk kecepatan tinggi dan 0 biaya Firestore.
 */
export const getMonthlyClassSummary = async (
  className: string,
  month: string,
  tenantId: string,
) => {
  const cacheKey = `att_monthly_${month}_${className.replace(/\s+/g, '_')}_${tenantId}`;
  try {
    const start = `${month}-01`;
    const end = `${month}-31`;

    const rawRecords = await localDb.attendance
      .where('tenantId')
      .equals(tenantId)
      .and(record => record.className === className && !!record.tanggal && record.tanggal >= start && record.tanggal <= end)
      .toArray();

    // Sort safety
    rawRecords.sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

    return rawRecords;
  } catch (error) {
    console.error('[AggregateService] Failed to get monthly summary from Dexie:', error);
    // Coba fallback ke cache lama jika ada
    const cached = await localDb.cache.get(cacheKey);
    return cached ? cached.data : [];
  }
};
