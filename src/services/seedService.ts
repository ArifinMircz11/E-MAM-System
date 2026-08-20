import { getCurrentUser } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';

/**
 * e-Mam System - Seed Utility
 * Used to initialize essential system data for new installations.
 */

import { auth, db } from './firebase';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import type { MadrasahData} from '@/types';
import { UserRole } from '@/types';
import { ensureStringIds } from '@/utils/schemaHelpers';

const defaultMadrasahInfo: MadrasahData = {
  nama: 'MAN 1 HULU SUNGAI TENGAH',
  nsm: '131163070001',
  npsn: '30315354',
  alamat: 'Jl. H. Damanhuri No. 12 Barabai',
  telepon: '0517-41234',
  email: 'info@example.com',
  website: 'www.example.com',
  kepalaNama: 'Drs. H. Syamsul Arifin',
  kepalaNip: '196808171995031002',
  akreditasi: 'A (Unggul)',
  visi: 'Mewujudkan Madrasah yang Islami, Mandiri, Amanah, dan Maju melalui keunggulan akademik dan akhlak mulia.',
  misi: [
    'Menanamkan nilai-nilai religius dalam setiap aspek pembelajaran.',
    'Meningkatkan kompetensi guru dan tenaga kependidikan.',
    'Menyediakan fasilitas pembelajaran berbasis teknologi modern.',
    'Membangun karakter siswa yang tangguh dan berjiwa sosial.',
  ],
  photo: '',
  logoApp: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
  logoSurat: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
  logoLayanan: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
  logoFull: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
  motto: 'Islami, Mandiri, Amanah, Maju',
};

const defaultRolePermissions: Record<string, string[]> = {
  [UserRole.ADMIN]: ['all'],
  [UserRole.DEVELOPER]: ['all'],
  [UserRole.KEPALA_MADRASAH]: [
    'students',
    'teachers',
    'classes',
    'attendance',
    'reports',
    'news',
    'letters',
  ],
  [UserRole.GURU]: ['attendance', 'classes', 'schedules', 'news', 'letters', 'student_points'],
  [UserRole.WALI_KELAS]: [
    'attendance',
    'classes',
    'schedules',
    'news',
    'letters',
    'students',
    'student_points',
  ],
  [UserRole.STAF]: ['students', 'teachers', 'letters', 'news', 'attendance'],
  [UserRole.SISWA]: ['schedules', 'points', 'news', 'letters', 'attendance_history'],
  [UserRole.ORANG_TUA]: ['schedules', 'points', 'news', 'attendance_history'],
};

export const seedInitialData = async () => {
  if (!db || !auth) return;

  // Only run if auth state is likely initialized
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return;
  }

  try {
    console.log('[CoreSystem] Scanning Integrities...');

    // 1. Check Madrasah Info (Read is true for all)
    const infoDoc = await dbGateway.getDoc(dbGateway.doc(db, 'system_settings', 'madrasah_info'));
    if (!infoDoc.exists()) {
      console.log('[CoreSystem] Initializing Domain...');
      await dbGateway.setDoc(dbGateway.doc(db, 'system_settings', 'madrasah_info'), defaultMadrasahInfo);
    }

    // 2. Check Role Permissions (Requires isSignedIn)
    const permDoc = await dbGateway.getDoc(dbGateway.doc(db, 'system_settings', 'role_permissions'));
    if (!permDoc.exists()) {
      console.log('[CoreSystem] Initializing RBAC Engine...');
      await dbGateway.setDoc(dbGateway.doc(db, 'system_settings', 'role_permissions'), defaultRolePermissions);
    }

    // 3. Check System Features
    const featureDoc = await dbGateway.getDoc(dbGateway.doc(db, 'system_settings', 'features'));
    if (!featureDoc.exists()) {
      await dbGateway.setDoc(dbGateway.doc(db, 'system_settings', 'features'), {
        scheduleReminder: true,
      });
    }

    // 4. Check Maintenance Config
    const maintDoc = await dbGateway.getDoc(dbGateway.doc(db, 'system_settings', 'maintenance_config'));
    if (!maintDoc.exists()) {
      await dbGateway.setDoc(dbGateway.doc(db, 'system_settings', 'maintenance_config'), {
        isMaintenance: false,
        allowedRoles: ['Developer', 'Admin'],
        message: 'Update rutin, silakan kembali nanti.',
      });
    }

    // 5. Check & Align Feature Locks Config
    const featureLockDoc = await dbGateway.getDoc(dbGateway.doc(db, 'system_settings', 'feature_locks'));
    const requiredLocks = ['reports', 'teacher_attendance', 'advisor'];
    if (!featureLockDoc.exists()) {
      console.log('[CoreSystem] Initializing Emergency Feature Locks...');
      await dbGateway.setDoc(dbGateway.doc(db, 'system_settings', 'feature_locks'), {
        locked: requiredLocks,
      });
    } else {
      const rawLocked = featureLockDoc.data()?.locked;
      const curr = Array.isArray(rawLocked) ? rawLocked : [];
      const hasCorrectLocks =
        requiredLocks.every((x) => curr.includes(x)) && curr.length === requiredLocks.length;
      if (!hasCorrectLocks) {
        console.log('[CoreSystem] Re-aligning Emergency Feature Locks to requested state...');
        await dbGateway.setDoc(
          dbGateway.doc(db, 'system_settings', 'feature_locks'),
          {
            locked: requiredLocks,
          },
          { merge: true },
        );
      }
    }

    // 6. Sync Unified Config
    const unifiedConfigDoc = await dbGateway.getDoc(dbGateway.doc(db, 'system', 'config'));
    if (!unifiedConfigDoc.exists()) {
      console.log('[CoreSystem] Creating Unified Config Hub...');
      await dbGateway.setDoc(dbGateway.doc(db, 'system', 'config'), {
        master_version: 1,
        feature_locks: requiredLocks,
        role_permissions: defaultRolePermissions,
        maintenance_mode: false,
        last_updated: new Date().toISOString(),
      });
    }

    console.log('[CoreSystem] System Integrity Verified.');
  } catch (e: any) {
    // Log errors only if they aren't about permissions (which we expect for non-admins)
    if (e.code === 'permission-denied') {
      console.log('[CoreSystem] Access Restricted (Standard Privilege)');
    } else if (e.message?.includes('offline')) {
      console.warn('[CoreSystem] Offline Mode Active');
    } else {
      console.error('[CoreSystem] Integrity Check Error:', e.message);
    }
  }
};

/**
 * Generate Dummy Students if collection is empty
 */
export const seedDummyStudents = async (targetClass: string = '10 A') => {
  if (!db) return;
  try {
    const tenantId = useUserStore.getState().tenantId || '30315537';

    const q = dbGateway.query(
      dbGateway.collection(db, 'students'),
      dbGateway.where('tenantId', '==', tenantId),
      dbGateway.where('classId', '==', targetClass),
      dbGateway.limit(1),
    );
    const snap = await dbGateway.getDocs(q);
    if (!snap.empty) return;

    const firstNames = [
      'Ahmad',
      'Siti',
      'Budi',
      'Lani',
      'Zaki',
      'Nur',
      'Rian',
      'Dewi',
      'Fajar',
      'Maya',
      'Hendra',
      'Siska',
    ];
    const lastNames = [
      'Hidayat',
      'Aminah',
      'Susanto',
      'Purnama',
      'Ramadan',
      'Fauzi',
      'Wulandari',
      'Saputra',
      'Lestari',
    ];

    for (let i = 1; i <= 20; i++) {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gender = Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan';
      const name = `${first} ${last} ${i}`;
      const idUnik = `${tenantId}_IDS_${1000 + i}`;

      const studentData = {
        idUnik,
        namaLengkap: name,
        nisn: `00${1234567 + i}`,
        tingkatRombel: targetClass, // legacy
        classId: targetClass, // modern
        className: targetClass, // modern
        rombelId: targetClass, // extra safe
        status: 'Aktif',
        jenisKelamin: gender,
        isClaimed: false,
        point: 0,
        tenantId,
        createdAt: new Date().toISOString(),
      };

      const sanitized = ensureStringIds(studentData);

      await dbGateway.setDoc(dbGateway.doc(db, 'students', idUnik), sanitized);
    }
  } catch (e) {
    console.error('Failed to seed dummy students:', e);
  }
};

/**
 * Generate Bulk Dummy Attendance for a date range
 */
export const generateBulkDummyAttendance = async (payload: {
  className: string;
  startDate: string;
  endDate: string;
  session: 'all' | 'masuk' | 'duha' | 'zuhur' | 'ashar' | 'pulang';
  progressCallback?: (msg: string) => void;
}) => {
  if (!db) return { success: false, message: 'Database not connected' };

  const { className, startDate, endDate, session, progressCallback } = payload;

  const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const curr = new Date(start);
    const last = new Date(end);
    let safety = 0;
    while (curr <= last && safety < 100) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      safety++;
    }
    return dates;
  };

  const dates = getDatesInRange(startDate, endDate);
  if (dates.length === 0) return { success: false, message: 'Rentang tanggal tidak valid' };

  try {
    progressCallback?.(`Menyiapkan data siswa untuk rombel ${className}...`);
    let snap;
    if (className === 'All') {
      snap = await dbGateway.getDocs(dbGateway.query(dbGateway.collection(db, 'students'), dbGateway.limit(500)));
    } else {
      snap = await dbGateway.getDocs(
        dbGateway.query(dbGateway.collection(db, 'students'), dbGateway.where('tingkatRombel', '==', className), dbGateway.limit(100)),
      );
    }

    if (snap.empty) return { success: false, message: `Tidak ada siswa di rombel ${className}` };

    const getRandomTime = (minH: number, minM: number, maxH: number, maxM: number) => {
      const minTotal = minH * 60 + minM;
      const maxTotal = maxH * 60 + maxM;
      const rnd = Math.floor(Math.random() * (maxTotal - minTotal + 1)) + minTotal;
      return `${Math.floor(rnd / 60)
        .toString()
        .padStart(2, '0')}:${(rnd % 60).toString().padStart(2, '0')}`;
    };

    let totalCount = 0;
    for (const date of dates) {
      progressCallback?.(`Memproses tanggal: ${date}...`);
      const batch = dbGateway.writeBatch(db);
      let dayCount = 0;

      for (const docSnap of snap.docs) {
        const student = { id: docSnap.id, ...docSnap.data() } as any;
        const rand = Math.random();
        const isFemale =
          student.jenisKelamin === 'Perempuan' ||
          (student.namaLengkap &&
            (student.namaLengkap.includes('Siti') || student.namaLengkap.includes('Adellya')));
        const isHaid = isFemale && rand < 0.15;
        const isAlpha = rand < 0.05;

        const attId = `${student.idUnik || student.id}_${date}`;
        const scanData: any = {
          studentId: student.id,
          studentName: student.namaLengkap,
          idUnik: student.idUnik || '',
          nisn: student.nisn || '',
          class: student.tingkatRombel || className,
          date: date,
          status: 'Hadir',
          tenantId: student.tenantId || 'global',
          lastUpdated: dbGateway.serverTimestamp(),
        };

        if (isAlpha) {
          scanData.status = 'Alpha';
        } else {
          if (session === 'all' || session === 'masuk') {
            const isLate = rand > 0.85;
            scanData.masuk = isLate ? getRandomTime(7, 31, 8, 30) : getRandomTime(6, 45, 7, 30);
            if (isLate) scanData.status = 'Terlambat';
          }
          if (session === 'all' || session === 'duha') {
            scanData.duha = isHaid
              ? `${getRandomTime(8, 0, 8, 30)} (haid)`
              : getRandomTime(8, 0, 8, 30);
          }
          if (session === 'all' || session === 'zuhur') {
            const isTs = rand > 0.92;
            if (isTs) scanData.zuhur = 'TS (Tidak Scan)';
            else
              scanData.zuhur = isHaid
                ? `${getRandomTime(12, 15, 12, 45)} (haid)`
                : getRandomTime(12, 15, 12, 45);
          }
          if (session === 'all' || session === 'ashar') {
            const isTs = rand > 0.94;
            if (isTs) scanData.ashar = 'TS (Tidak Scan)';
            else
              scanData.ashar = isHaid
                ? `${getRandomTime(15, 15, 15, 45)} (haid)`
                : getRandomTime(15, 15, 15, 45);
          }
          if (session === 'all' || session === 'pulang') {
            const isPc = rand > 0.95;
            if (isPc) {
              scanData.pulang = getRandomTime(13, 0, 15, 30);
              scanData.status = 'PC';
            } else {
              scanData.pulang = getRandomTime(16, 0, 17, 30);
            }
          }
          if (isHaid && scanData.status === 'Hadir') scanData.status = 'Haid';
        }

        batch.set(dbGateway.doc(db, 'attendance', attId), ensureStringIds(scanData), { merge: true });
        dayCount++;
      }
      await batch.commit();
      totalCount += dayCount;
    }

    return {
      success: true,
      message: `${totalCount} data presensi berhasil digenerate untuk ${dates.length} hari.`,
    };
  } catch (e: any) {
    console.error('Gagal generate bulk dummy attendance:', e);
    return { success: false, message: e.message };
  }
};
