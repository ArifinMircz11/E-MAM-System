/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: REPOSITORY (DEXIE OFFLINE-FIRST OPTIMIZED)
 */

import { isReadOnly } from '@/services/authService';
import { auditLog } from '@/services/auditLogService';
import { getMakassarDateString, getMakassarTimeString } from '@/utils/timezone';
import { UserRole } from '@/types';
import type { Student, AttendanceRecord } from '@/types';
import { getSecurityContext } from '@/core/security/contextHelper';
import { assertPermission } from '@/services/securityService';
import { PERMISSIONS } from '@/types/permissions';

import { sanitizeError, sanitizeForJSON } from '@/utils/dataHelpers';
import { TenantContext } from '@/core/context/TenantContext';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { syncRepository } from '@/repositories/SyncRepository';
import { localDb } from '@/database/dexie';
import { useUserStore } from '@/stores/userStore';
import { CacheService } from '@/services/CacheService';
import { normalizeRombelName } from '@/utils/rombelHelpers';

export type AttendanceSession = 'Masuk' | 'Duha' | 'Zuhur' | 'Ashar' | 'Pulang';

const ATT_COL = 'attendance';
const STU_COL = 'students';
const SUM_DOC = 'summaries/dashboard';

/**
 * CACHE-FIRST COMPLIANCE PATTERNS
 */
export const getCachedData = async (tenantId: string) => {
  return await CacheService.getCachedData<AttendanceRecord>(ATT_COL, tenantId);
};

export const saveLocal = async (data: AttendanceRecord | AttendanceRecord[]) => {
  const tenantId = useUserStore.getState().tenantId || 'global';
  if (Array.isArray(data)) {
    for (const record of data) {
      await attendanceRepository.update(record);
    }
    return;
  }
  return await attendanceRepository.update(data);
};

export const enqueueSync = async (payload: any, action = 'SCAN_PRESENSI') => {
  const tenantId = useUserStore.getState().tenantId || 'global';

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
};

/**
 * MENGAMBIL DATA PRESENSI BERDASARKAN KELAS DAN TANGGAL
 */
export const getAttendanceByClassAndDate = async (
  classNameRaw: string,
  date: string,
  forceRefresh = false,
) => {
  try {
    assertPermission(PERMISSIONS.ATTENDANCE_READ, 'Read Attendance By Class');
    const className = normalizeRombelName(classNameRaw);
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    if (!forceRefresh) {
      const cached = await attendanceRepository.getByClassAndDate(tenantId, className, date);
      if (cached.length > 0)
        return cached.sort((a, b) =>
          (a.namaLengkap || (a as any).studentName || '').localeCompare(
            b.namaLengkap || (b as any).studentName || '',
          ),
        );
    }

    // Use getByDate as the general fetcher for today's data if class specific fails or to populate
    const records = await attendanceRepository.getByDate(tenantId, date);
    const results = records || [];

    if (results.length > 0) {
      await CacheService.saveToCache(ATT_COL, results, tenantId);
      await saveLocal(results);
    }

    return results.sort((a, b) => {
      const nameA = a.namaLengkap || (a as any).studentName || (a as any).name || '';
      const nameB = b.namaLengkap || (b as any).studentName || (b as any).name || '';
      return nameA.localeCompare(nameB);
    });
  } catch (error: any) {
    console.warn('Firestore fetch failed, falling back to local Dexie cache:', error.message);
    const context = TenantContext.getContext();
    const className = normalizeRombelName(classNameRaw);
    const cached = await attendanceRepository.getByClassAndDate(context.tenantId, className, date);
    return cached.sort((a, b) => {
      const nameA = a.namaLengkap || (a as any).studentName || (a as any).name || '';
      const nameB = b.namaLengkap || (b as any).studentName || (b as any).name || '';
      return nameA.localeCompare(nameB);
    });
  }
};

/**
 * MENGAMBIL DATA PRESENSI BERDASARKAN SISWA (Personal Attendance)
 */
export const getAttendanceByStudentId = async (studentsId: string, forceRefresh = false) => {
  try {
    if (!studentsId) return [];
    
    // Security Context Hardening
    const secCtx = getSecurityContext(false);
    if (secCtx?.role === UserRole.SISWA || secCtx?.role === UserRole.KETUA_KELAS) {
      if (secCtx.referenceId && secCtx.referenceId !== studentsId) {
        console.error(`[Security] Access Denied: Student ${secCtx.referenceId} attempted to access attendance of ${studentsId}`);
        return [];
      }
    }

    assertPermission(PERMISSIONS.ATTENDANCE_READ, 'Read Student Personal Attendance');
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    if (!forceRefresh) {
      const cached = await attendanceRepository.getByStudentId(tenantId, studentsId);
      if (cached.length > 0)
        return cached.sort(
          (a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime(),
        );
    }

    // For student personal history, we might need a fetcher if not in local cache
    // but for now we use the local repository
    const results = await attendanceRepository.getByStudentId(tenantId, studentsId);

    if (results.length > 0) {
      await saveLocal(results);
    }

    return results.sort(
      (a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime(),
    );
  } catch (error: any) {
    console.warn('getAttendanceByStudentId error:', error.message);
    return [];
  }
};

/**
 * MENGAMBIL DATA PRESENSI BERDASARKAN KELAS DAN BULAN (Monthly Report)
 * Optimized via Repository (Offline-First)
 */
export const getAttendanceByClassAndMonth = async (
  classNameRaw: string,
  month: string,
  forceRefresh = false,
) => {
  try {
    const className = normalizeRombelName(classNameRaw);
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    // 1. Check local data first (Offline-First)
    if (!forceRefresh) {
      const cached = await attendanceRepository.getByClassAndMonth(tenantId, className, month);
      if (cached && cached.length > 0) {
        return cached.sort((a, b) => {
          const dateCompare = (a.tanggal || '').localeCompare(b.tanggal || '');
          if (dateCompare !== 0) return dateCompare;
          return (a.namaLengkap || '').localeCompare(b.namaLengkap || '');
        });
      }
    }

    // 2. Fallback: Fetch from Firestore (via Repository)
    // Note: Repository should ideally handle this, but if not we can use fetchByClassAndMonth if it exists
    // Actually, let's stick to getByClassAndMonth for now.
    const returnData = await attendanceRepository.getByClassAndMonth(tenantId, className, month);

    if (returnData && returnData.length > 0) {
      // Save to local cache
      await saveLocal(returnData);

      returnData.sort((a, b) => {
        const dateCompare = (a.tanggal || '').localeCompare(b.tanggal || '');
        if (dateCompare !== 0) return dateCompare;
        const nameA = a.namaLengkap || '';
        const nameB = b.namaLengkap || '';
        return nameA.localeCompare(nameB);
      });
    }

    return returnData || [];
  } catch (error: any) {
    console.error('Error fetching monthly attendance:', error);
    return [];
  }
};

/**
 * Mencatat kehadiran dengan pola Write-Ahead Logging & Outbox Pattern (Dexie)
 */
export const recordAttendanceByScan = async (
  rawCode: string,
  session: AttendanceSession,
  isHaidMode: boolean = false,
  isFromSync: boolean = false,
) => {
  if (isReadOnly()) throw new Error('Sistem sedang dalam mode Read-Only. Harap coba lagi nanti.');
  assertPermission(PERMISSIONS.ATTENDANCE_WRITE, 'Record Attendance');
  const code = rawCode.trim();
  const today = getMakassarDateString();

  try {
    // 1. Ambil data siswa dari Dexie ONLY (100% Offline, no Firestore leakage!)
    const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
    const tenantIdFromStore = useUserStore.getState().tenantId || 'global';
    const student = await studentRepository.findByQrCode(tenantIdFromStore, code);

    if (!student) return { success: false, message: 'ID_TIDAK_VALID' };

    const idUnik = student.idUnik || (student as any).studentsId;
    const tenantId = student.sistemJangkar?.tenantId || student.tenantId;
    if (!tenantId) throw new Error('tenantId required');
    const academicYear = student.metadataAkademik?.tahunAngkatan || '2025';

    if (!idUnik) return { success: false, message: 'DATA_SISWA_TIDAK_LENGKAP' };

    // Strict Multi-Tenant Security Check
    try {
      const { useUserStore } = await import('@/stores/userStore');
      const currentUserTenantId = useUserStore.getState().tenantId;
      if (
        currentUserTenantId &&
        currentUserTenantId !== 'default' &&
        tenantId !== currentUserTenantId
      ) {
        console.warn(
          `[MultiTenant] Blocked scan due to Tenant Mismatch. User: ${currentUserTenantId}, Student: ${tenantId}`,
        );
        return { success: false, message: 'TENANT_MISMATCH' };
      }
    } catch (_) {}

    // [Write-Ahead Logging] Log outbox lokal dulu agar cepat merespon UI
    const timeStr = getMakassarTimeString();
    let status = 'Hadir';
    let pointsPenalty = 0;
    let penaltyType = '';
    let finalVal = timeStr;
    const fieldName = session.toLowerCase();
    const isPrayerSession = ['duha', 'zuhur', 'ashar'].includes(fieldName);

    const normalizedClass = normalizeRombelName(
      student.tingkatRombel || (student as any).rombel || (student as any).kelas,
    );

    if (session === 'Masuk' && timeStr > '07:30' && !isHaidMode) {
      status = 'T';
      pointsPenalty = 5;
      penaltyType = 'Terlambat';
      finalVal = `${timeStr} [T]`;
    } else if (session === 'Pulang' && timeStr < '16:00' && !isHaidMode) {
      status = 'PC';
      pointsPenalty = 5;
      penaltyType = 'Pulang Cepat (PC)';
      finalVal = `${timeStr} [PC]`;
    } else if (isHaidMode && isPrayerSession) {
      status = 'Haid';
      pointsPenalty = 0;
      finalVal = `${timeStr} + Haid`;
    }

    // Simpan lokal agar muncul di history/cache
    const attId = `${idUnik}_${today}`;
    
    // ATOMIC TRANSACTION: Gunakan localDb.transaction untuk integritas transaksi Dexie
    await localDb.transaction('rw', [localDb.attendance, localDb.sync_queue], async () => {
        const existingLocal = await attendanceRepository.findById(attId, tenantId);

        // Idempotency Check (moved inside transaction to be safe)
        if (existingLocal && (existingLocal as any)[fieldName]) {
          throw new Error(`Sudah terekam di sesi ${session}!`);
        }

        const outboxPayload = {
            id: String(attId),
            studentId: idUnik,
            studentsId: idUnik,
            studentName: student.namaLengkap,
            nisn: student.nisn || '',
            className: normalizedClass,
            class: normalizedClass,
            date: today,
            session: session,
            fieldName: fieldName,
            status: status,
            statusGlobal:
                status === 'T'
                    ? 'Terlambat'
                    : status === 'PC'
                        ? 'PC'
                        : status === 'A'
                            ? 'Alpha'
                            : status || 'Hadir',
            finalVal: finalVal,
            pointsPenalty: pointsPenalty,
            penaltyType: penaltyType,
            isHaidMode: isHaidMode,
            timeStr: timeStr,
            phone: student.kontakDanWali?.nomorHpSiswa || student.noTelepon,
            tenantId: tenantId,
            academicYear: academicYear,
        };

        const updatedLocal: any = {
            id: String(attId), // FIX: Ensure 'id' key path is present for Dexie!
            ...(existingLocal || {}),
            studentsId: idUnik,
            studentId: idUnik,
            studentName: student.namaLengkap,
            idUnik: idUnik,
            nisn: student.nisn || '',
            className: normalizedClass,
            class: normalizedClass,
            date: today,
            tenantId: tenantId,
            [fieldName]: finalVal,
            status: status,
            statusGlobal:
                status === 'T'
                    ? 'Terlambat'
                    : status === 'PC'
                        ? 'PC'
                        : status === 'A'
                            ? 'Alpha'
                            : status || 'Hadir',
            lastUpdated: new Date().toISOString(),
            isOffline: true,
        };

        await attendanceRepository.update(updatedLocal);
        
        // --- OFFLINE MODE: Masuk syncQueue ---
        await enqueueSync(outboxPayload, 'SCAN_PRESENSI');
    });

    // --- AUTOMATED POINT INTEGRATION (Executed outside Dexie atomic transaction to prevent transaction commit conflicts) ---
    try {
        const { addStudentPoint } = await import('@/services/pointService');
        if (status === 'T' && pointsPenalty > 0) {
            await addStudentPoint({
                studentsId: idUnik,
                studentId: idUnik,
                studentName: student.namaLengkap,
                class: normalizedClass,
                classId: normalizedClass,
                points: -pointsPenalty,
                type: 'pelanggaran',
                category: 'Kedisiplinan',
                description: `Otomatis: Terlambat scan ${session} pada pukul ${timeStr}`,
                date: today,
                attendanceId: attId,
            });
        } else if (status === 'Hadir' && session === 'Masuk') {
            await addStudentPoint({
                studentsId: idUnik,
                studentId: idUnik,
                studentName: student.namaLengkap,
                class: normalizedClass,
                classId: normalizedClass,
                points: 2,
                type: 'prestasi',
                category: 'Kedisiplinan & Kehadiran',
                description: `Otomatis: Hadir tepat waktu pada sesi Masuk pukul ${timeStr}`,
                date: today,
                attendanceId: attId,
            });
        }
    } catch (pointErr) {
        console.warn('[AttendanceService] Auto point assignment failed:', pointErr);
    }

    // Trigger background sync non-blocking
    try {
      import('@/services/offlineAutoProcessService').then(({ triggerOfflineProcessing }) => {
        triggerOfflineProcessing().catch(console.warn);
      });
    } catch (_) {}

    return {
      success: true,
      student: sanitizeForJSON<Student>(student),
      message: status,
      isOffline: true,
    };
  } catch (e: any) {
    return { success: false, message: sanitizeError(e) };
  }
};

/**
 * (Logic for server processing moved to src/sync/attendanceSyncService.ts)
 */

export const updateSessionAttendanceAndPoints = async (
  studentId: string,
  classId: string,
  sessionId: any,
  status: string,
  userRole: string,
) => {
  if (isReadOnly()) throw new Error('Sistem sedang dalam mode Read-Only. Harap coba lagi nanti.');
  assertPermission(PERMISSIONS.ATTENDANCE_WRITE, 'Update Attendance Session');
  try {
    let pointApplied = 0;
    if (status === 'alpa') pointApplied = -10;
    else if (['terlambat', 'tidak_scan', 'cabut'].includes(status)) pointApplied = -5;

    const today = getMakassarDateString();
    const attId = `${studentId}_${today}`;
    const tenantId = useUserStore.getState().tenantId || 'global';

    const updateData: any = {
      id: String(attId),
      studentsId: studentId,
      class: classId,
      status,
      pointApplied,
      sessionId,
      tenantId: tenantId,
      lastUpdated: new Date().toISOString(),
    };

    // Repository save automatically handles local write + sync queue enrollment
    await attendanceRepository.update(updateData);

    return { success: true, pointApplied, isCached: true };
  } catch (e: any) {
    throw new Error(sanitizeError(e));
  }
};

const hitungKeterlambatan = (scanTime: string, threshold: string): number => {
  const [h, m, s] = scanTime.split(':').map(Number);
  const [th, tm, ts] = threshold.split(':').map(Number);
  const scanMinutes = h * 60 + m + s / 60;
  const threshMinutes = th * 60 + tm + ts / 60;
  return Math.max(0, Math.floor(scanMinutes - threshMinutes));
};

export const prosesPresensiSiswa = async (studentDocId: string, jamScan: string) => {
  // jamScan format HH:mm:ss
  const thresholdJam = '07:00:00';
  const delay = hitungKeterlambatan(jamScan, thresholdJam);
  const today = getMakassarDateString();
  const poinPotong = 5; // Default penalty point

  const tenantId = useUserStore.getState().tenantId || 'global';

  const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
  const student = await studentRepository.findById(studentDocId, tenantId);
  const className = student?.className || 'Unassigned';

  const statusVal = delay > 0 ? 'T' : 'Hadir';
  const statusGlobalVal = delay > 0 ? 'Terlambat' : 'Hadir';

  const attendanceData: any = {
    id: String(`${studentDocId}_${today}`),
    studentsId: studentDocId,
    studentId: studentDocId,
    className: className,
    date: today,
    masuk: delay > 0 ? `${jamScan} (+${delay})` : jamScan,
    status: statusVal,
    statusGlobal: statusGlobalVal,
    tenantId: tenantId,
    lastUpdated: new Date().toISOString(),
  };

  // 1. Simpan Kehadiran (Local first)
  await attendanceRepository.update(attendanceData);

  // 2. Queue for sync
  await enqueueSync(attendanceData, 'SCAN_PRESENSI');

  // 3. Jika Terlambat: Logika poin juga harus melalui repo/sync
  if (delay > 0) {
    const { pointRepository } = await import('@/repositories/PointRepository');
    // This should ideally be handled by a point service or sync engine
    // For now, we queue it
    await enqueueSync(
      {
        studentsId: studentDocId,
        studentId: studentDocId,
        skor: poinPotong,
        points: poinPotong,
        kategori: 'Pelanggaran',
        keterangan: `Terlambat ${delay} menit`,
        tanggal: today,
        tenantId: tenantId,
      },
      'ADD_POINT',
    );
  }
};

export const deleteAttendanceByDate = async (date: string) => {
  try {
    assertPermission(PERMISSIONS.ATTENDANCE_DELETE, 'Delete Attendance');
    const tenantId = useUserStore.getState().tenantId || 'global';

    // 1. Local Delete
    const count = await attendanceRepository.deleteByDate(tenantId, date);

    // 2. Enqueue Sync
    await syncRepository.enqueue({
      tenantId,
      action: 'BATCH_DELETE' as any,
      collection: 'attendance' as any,
      payload: { filter: { date }, count },
    });

    await auditLog({
      action: 'ATTENDANCE_DELETED_BY_DATE',
      category: 'ATTENDANCE',
      details: `Menghapus data tanggal: ${date} (Offline Enqueued). Estimasi lokal: ${count}`,
    });

    return {
      success: true,
      message: `Berhasil menghapus antrean penghapusan untuk ${count} data lokal`,
    };
  } catch (e: any) {
    return { success: false, message: sanitizeError(e) };
  }
};

export const deleteAttendanceByMonth = async (month: string) => {
  try {
    assertPermission(PERMISSIONS.ATTENDANCE_DELETE, 'Delete Attendance Month');
    const tenantId = useUserStore.getState().tenantId || 'global';

    // Note: deleteByMonth should be implemented in repository or we use deleteByDate in a loop or query
    // For now, let's assume we need a repository method for this
    const count = await attendanceRepository.deleteByMonth(tenantId, month);

    // 2. Enqueue Sync
    await syncRepository.enqueue({
      tenantId,
      action: 'BATCH_DELETE' as any,
      collection: 'attendance' as any,
      payload: { filter: { month }, count },
    });

    await auditLog({
      action: 'ATTENDANCE_DELETED_BY_MONTH',
      category: 'ATTENDANCE',
      details: `Menghapus data bulan: ${month} (Offline Enqueued). Estimasi lokal: ${count}`,
    });

    return {
      success: true,
      message: `Berhasil menghapus antrean penghapusan untuk bulan ${month}`,
    };
  } catch (e: any) {
    return { success: false, message: sanitizeError(e) };
  }
};

/**
 * Update attendance record manually (Developer only usually checked at UI layer)
 */
export const runAttendanceAutoSweep = async () => {
  try {
    assertPermission(PERMISSIONS.ATTENDANCE_VERIFY, 'Run Auto Sweep');
    const tenantId = useUserStore.getState().tenantId || 'global';

    // Logic now moved to SyncQueue as a COMMAND
    await syncRepository.enqueue({
      tenantId,
      action: 'AUTO_SWEEP' as any,
      collection: 'attendance' as any,
      payload: { timestamp: Date.now(), tenantId },
    });

    await auditLog({
      action: 'ATTENDANCE_AUTO_SWEEP_TRIGGERED',
      category: 'SYSTEM',
      details: `Auto Sweep diantrekan untuk tenant: ${tenantId}`,
    });

    return {
      success: true,
      message: 'Auto Sweep telah diantrekan dan akan diproses saat sinkronisasi.',
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

/**
 * Update attendance record manually (Developer only usually checked at UI layer)
 */
/**
 * REPAIR/SYNC: Menghubungkan ulang semua data absensi hari ini ke poin siswa
 * Menutup celah jika ada kegagalan sinkronisasi otomatis
 */
export const repairStudentPoints = async (customDate?: string) => {
  try {
    const tenantId = useUserStore.getState().tenantId || 'global';

    const targetDate = customDate || getMakassarDateString();

    // Enqueue as a SYSTEM COMMAND
    await syncRepository.enqueue({
      tenantId,
      action: 'REPAIR_POINTS' as any,
      collection: 'attendance' as any,
      payload: { date: targetDate, tenantId },
    });

    await auditLog({
      action: 'ATTENDANCE_POINT_REPAIR_TRIGGERED',
      category: 'SYSTEM',
      details: `Repair Points diantrekan untuk tanggal: ${targetDate}`,
    });

    return { success: true, message: 'Repair points telah diantrekan.' };
  } catch (e: any) {
    return { success: false, message: sanitizeError(e) };
  }
};

export const updateAttendanceManual = async (attId: string, data: Partial<AttendanceRecord>) => {
  try {
    const tenantId = useUserStore.getState().tenantId || 'global';

    // Repository save automatically handles local write + sync queue enrollment
    await attendanceRepository.update({
      ...data,
      id: attId,
      tenantId,
      lastUpdated: new Date().toISOString(),
    } as any);

    await auditLog({
      action: 'ATTENDANCE_MANUAL_UPDATE',
      category: 'ATTENDANCE',
      details: `Update Manual ID: ${attId}`,
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, message: sanitizeError(e) };
  }
};
