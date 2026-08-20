import { SummaryService } from './SummaryService';
import { useUserStore } from '@/stores/userStore';

/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: ANALYTICS SUMMARY
 */

import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from './firebase';

/**
 * Mengambil ringkasan kelas (Hemat Read)
 * UI tidak lagi menghitung rata-rata nilai, cukup baca dokumen ini.
 */
export const getClassSummary = async (className: string) => {
  try {
    const ref = dbGateway.doc(db, 'summaries', `class_${className.replace(/\s+/g, '_')}`);
    const snap = await dbGateway.getDoc(ref);
    return snap.exists()
      ? snap.data()
      : {
          avgGrade: 0,
          totalStudents: 0,
          attendanceRate: 0,
        };
  } catch (e: any) {
    console.warn(
      `[SummaryService] Failed to fetch class summary for ${className}, using default fallback.`,
    );
    return {
      avgGrade: 0,
      totalStudents: 0,
      attendanceRate: 0,
    };
  }
};

/**
 * Mengambil ringkasan dashboard global
 * Menerapkan pola self-healing berkinerja tinggi menggunakan getCountFromServer (0 total scan, super hemat query-baca).
 */
export const getDashboardSummary = async () => {
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required for dashboard summary');

  // 1. Coba ambil dari Local Dexie (Offline-First)
  try {
    const localStats = await SummaryService.getSummary(tenantId, 'dashboard');
    if (localStats) return localStats;
  } catch (e) {
    console.warn('[SummaryService] Failed to fetch local stats, falling back to Firestore');
  }

  // 2. Jika offline atau tidak ada data lokal, baru ke Firestore
  if (!navigator.onLine) {
    console.log('[SummaryService] Client is offline, skipping Firestore query.');
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalViolations: 0,
      totalAchievements: 0,
      attendanceRate: 0,
      lastUpdate: new Date().toISOString(),
    };
  }

  try {
    const ref = dbGateway.doc(db, 'summaries', `dashboard_${tenantId}`);
    const snap = await dbGateway.getDoc(ref);

    const stats = snap.exists() ? snap.data() : null;

    // Pengecekan data kosong atau tidak terinisialisasi.
    if (!stats || !stats.totalStudents || stats.totalStudents <= 0) {
      console.log('[SummaryService] Tenant summary not found or uninitialized. Recalculating...');
      return await recalculateDashboardSummary();
    }

    return stats;
  } catch (e: any) {
    console.error('[SummaryService] Firestore query failed:', e.message || e);

    // Fallback data
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalViolations: 0,
      totalAchievements: 0,
      attendanceRate: 0,
      lastUpdate: new Date().toISOString(),
    };
  }
};

/**
 * Force-recalculate global statistics using getCountFromServer (0 Scan, incredibly cheap)
 * Bermanfaat dipanggil secara periodik atau melalui tombol sync manual pengembang.
 */
export const recalculateDashboardSummary = async () => {
  try {
    const tenantId = useUserStore.getState().tenantId;

    if (!tenantId) throw new Error('tenantId required for recalculation');

    console.log(`[SummaryService] Explicitly recalculating summary for tenant: ${tenantId}`);
    const [studentCountSnap, teacherCountSnap, violationCountSnap, achievementCountSnap] =
      await Promise.all([
        (dbGateway as any).getCountFromServer(dbGateway.query(dbGateway.collection(db, 'students'), dbGateway.where('tenantId', '==', tenantId))),
        (dbGateway as any).getCountFromServer(dbGateway.query(dbGateway.collection(db, 'teachers'), dbGateway.where('tenantId', '==', tenantId))),
        (dbGateway as any).getCountFromServer(
          dbGateway.query(
            dbGateway.collection(db, 'poin'),
            dbGateway.where('tenantId', '==', tenantId),
            dbGateway.where('kategori', '==', 'Pelanggaran'),
          ),
        ),
        (dbGateway as any).getCountFromServer(
          dbGateway.query(
            dbGateway.collection(db, 'poin'),
            dbGateway.where('tenantId', '==', tenantId),
            dbGateway.where('kategori', '==', 'Prestasi'),
          ),
        ),
      ]);

    const stats = {
      totalStudents: studentCountSnap.data().count,
      totalTeachers: teacherCountSnap.data().count,
      totalViolations: violationCountSnap.data().count,
      totalAchievements: achievementCountSnap.data().count,
      attendanceRate: 95, // static default
      tenantId,
      lastUpdate: new Date().toISOString(),
    };

    const ref = dbGateway.doc(db, 'summaries', `dashboard_${tenantId}`);
    await dbGateway.setDoc(ref, stats, { merge: true });
    console.log('[SummaryService] System stats updated in Firestore document:', stats);
    return stats;
  } catch (err: any) {
    console.warn('[SummaryService] Failed to manually recalculate metrics:', err.message);
    throw err;
  }
};

/**
 * Increment global stats (Atomic)
 */
export const incrementGlobalStat = async (field: string, value: number = 1) => {
  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) return;

    const ref = dbGateway.doc(db, 'summaries', `dashboard_${tenantId}`);
    await dbGateway.setDoc(
      ref,
      {
        [field]: dbGateway.increment(value),
        lastUpdate: new Date().toISOString(),
      },
      { merge: true },
    ).catch((err: any) => console.warn('Failed to increment global stat:', err.message));
  } catch (e) {
    // Ignore errors during stat increment
  }
};
