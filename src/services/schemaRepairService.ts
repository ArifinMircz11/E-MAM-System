import { useUserStore } from '@/stores/userStore';
import { db, handleFirestoreError, OperationType, isMockMode } from './firebase';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { auditLog } from './auditLogService';
import { normalizeRombelName } from '../utils/rombelHelpers';
import { sanitizeForJSON } from '../utils/firestoreHelpers';
import { ensureStringIds } from '../utils/schemaHelpers';

/**
 * e-Mam v8.0 - Schema Repair Service
 * Target: Koleksi 'teachers'
 */

export interface TeacherAuditIssue {
  nip: string;
  name: string;
  issue: string;
  authUid?: string;
  fixed?: boolean;
}

export const incrementMasterVersion = async (): Promise<void> => {
  if (isMockMode) return;
  try {
    const vRef = dbGateway.doc(db, 'system_config', 'master_version');
    const snap = await dbGateway.getDoc(vRef);
    let newVersion = 1;
    if (snap.exists()) {
      newVersion = (snap.data().version || 0) + 1;
    }
    await dbGateway.setDoc(
      vRef,
      {
        version: newVersion,
        lastUpdated: dbGateway.serverTimestamp(),
      },
      { merge: true },
    );

    // Sync to unified config
    await dbGateway.setDoc(
      dbGateway.doc(db, 'system', 'config'),
      {
        master_version: newVersion,
        last_updated: new Date().toISOString(),
      },
      { merge: true },
    );

    await auditLog({
      action: 'MASTER_VERSION_INCREMENT',
      category: 'SYSTEM',
      details: `Versi master naik ke: ${newVersion}`,
    });
  } catch (e: any) {
    const errMsg = e instanceof Error ? e.message : String(e);
    if (errMsg.includes('permission-denied') || errMsg.includes('Missing or insufficient permissions')) {
      console.warn('Insufficient permissions to increment master version (benign):', errMsg);
    } else {
      console.error('Failed to increment master version:', e);
    }
  }
};

export const downloadCollectionBackup = async (
  collectionName: string,
  onProgress?: (msg: string) => void,
): Promise<any[]> => {
  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required for backup');

    if (onProgress) onProgress(`Mengambil data ${collectionName} untuk Backup (Limit 1000)...`);
    // e-Mam v8.0 Optimization: Limit backup to 1000 records to prevent Resource Exhausted
    const snap = await dbGateway.getDocs(
      dbGateway.query(dbGateway.collection(db, collectionName), dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(1000)),
    );
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(sanitizeForJSON(data), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `backup_${collectionName}_${new Date().getTime()}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    if (onProgress)
      onProgress(`✅ Backup ${collectionName} berhasil (Snapshot: ${data.length} records).`);
    return data;
  } catch (error: any) {
    console.error('Gagal backup:', error.message);
    throw error;
  }
};

export const auditTeacherAuth = async (
  onProgress?: (msg: string) => void,
): Promise<TeacherAuditIssue[]> => {
  try {
    const tenantId = useUserStore.getState().tenantId;

    if (onProgress) onProgress('--- Memulai Audit Sinkronisasi Guru (Limit 150) ---');

    // e-Mam v8.0 Optimization: Added limit for audit
    const guruSnap = await dbGateway.getDocs(
      dbGateway.query(dbGateway.collection(db, 'teachers'), dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(150)),
    );
    const issues: TeacherAuditIssue[] = [];
    let checkedCount = 0;

    // Pengecekan paralel dengan limit untuk efisiensi
    const checkPromises = guruSnap.docs.map(async (gDoc) => {
      const gData = gDoc.data() as any;
      const nip = gDoc.id;
      const authUid = gData.authUid;

      if (authUid) {
        const userRef = dbGateway.doc(db, 'users', authUid);
        const userSnap = await dbGateway.getDoc(userRef);

        if (!userSnap.exists()) {
          issues.push({
            nip,
            name: gData.name,
            issue: "authUid ada, tapi dokumen di koleksi 'users' HILANG",
            authUid,
          });
        }
      } else if (gData.isClaimed === true) {
        issues.push({
          nip,
          name: gData.name,
          issue: 'Status isClaimed TRUE, tapi authUid KOSONG',
        });
      }

      checkedCount++;
    });

    await Promise.all(checkPromises);

    if (onProgress) onProgress(`Audit Selesai. Total diperiksa: ${checkedCount}`);

    return issues;
  } catch (error: any) {
    console.error('Gagal menjalankan audit:', error.message);
    throw error;
  }
};

export const fixOrphanedTeacherAuth = async (issues: TeacherAuditIssue[]): Promise<number> => {
  if (issues.length === 0) return 0;

  const batch = dbGateway.writeBatch(db);
  let fixCount = 0;

  issues.forEach((issue) => {
    const teacherRef = dbGateway.doc(db, 'teachers', issue.nip);
    batch.update(teacherRef, {
      isClaimed: false,
      authUid: '',
      updatedAt: dbGateway.serverTimestamp(),
    });
    fixCount++;
  });

  if (fixCount > 0) {
    await batch.commit();
  }

  return fixCount;
};

export const repairUsersSchema = async (): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> => {
  const tenantId = useUserStore.getState().tenantId;

  const userRef = dbGateway.collection(db, 'users');
  const batch = dbGateway.writeBatch(db);
  let counter = 0;

  try {
    // e-Mam v8.0 Optimization: Limit repair to 500 records
    const snapshot = await dbGateway.getDocs(dbGateway.query(userRef, dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(500)));

    snapshot.forEach((userDoc) => {
      // Skip system/misconfigured document
      if (userDoc.id === 'teachers') return;

      const data = userDoc.data() as any;
      const docRef = dbGateway.doc(db, 'users', userDoc.id);

      // Logika Penyesuaian Field
      let newRole = (data.role || '').toLowerCase();
      if (!['admin', 'guru', 'siswa', 'developer', 'staf', 'wk'].includes(newRole)) {
        if ((data.peran || '').toLowerCase() === 'siswa') newRole = 'siswa';
        else if ((data.peran || '').toLowerCase() === 'developer') newRole = 'developer';
        else newRole = 'siswa'; // fallback
      }

      const updatedData: any = {
        uid: userDoc.id,
        email: data.email || '',
        role: newRole,
        teacherId: data.teacherId || data.idUnik || data.uid || data.id || '',
        displayName: data.displayName || data.namaLengkap || data.name || 'Pengguna',
        status: data.status || 'aktif',
        fcmToken: data.fcmToken || '',
        isActive: data.isActive ?? true,
        createdAt: data.createdAt || dbGateway.serverTimestamp(),
        lastLogin: data.lastLogin || dbGateway.serverTimestamp(),
        updatedAt: dbGateway.serverTimestamp(),
      };

      // Remove redundant fields
      const fieldsToDelete = ['id', 'idUnik', 'isSso', 'peran', 'subject'];
      fieldsToDelete.forEach((field) => {
        if (data[field] !== undefined) {
          updatedData[field] = dbGateway.deleteField();
        }
      });

      const sanitized = ensureStringIds(updatedData);
      batch.update(docRef, sanitized);
      counter++;
    });

    if (counter > 0) {
      await batch.commit();
      return { success: true, count: counter };
    } else {
      return { success: true, count: 0 };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users');
    return { success: false, count: counter, error: 'Gagal sinkronisasi user' };
  }
};

export const repairTeachersSchema = async (): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> => {
  const tenantId = useUserStore.getState().tenantId;

  const teacherRef = dbGateway.collection(db, 'teachers');
  const userRef = dbGateway.collection(db, 'users');
  const batch = dbGateway.writeBatch(db);
  let counter = 0;

  try {
    // e-Mam v8.0 Optimization: Added limits to prevent resource-exhausted
    const [snapshot, userSnap] = await Promise.all([
      dbGateway.getDocs(dbGateway.query(teacherRef, dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(150))),
      dbGateway.getDocs(dbGateway.query(userRef, dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(500))),
    ]);

    const usersMap = new Map<string, string>(); // teacherId -> authUid
    userSnap.forEach((uDoc) => {
      const uData = uDoc.data() as any;
      if (uData.teacherId) {
        usersMap.set(uData.teacherId, uDoc.id);
      }
    });

    snapshot.forEach((teacherDoc) => {
      const data = teacherDoc.data() as any;
      const docRef = dbGateway.doc(db, 'teachers', teacherDoc.id);

      // Standardize role to lowercase
      let newRole = (data.role || data.jabatan || 'guru').toLowerCase().replace(/ /g, '_');
      if ((data.peran || '').toLowerCase() === 'guru') newRole = 'guru';

      // Redirect "semua rombel" to "10 A"
      let newRombel = data.rombel || '';
      if (
        newRombel.toLowerCase() === 'semua' ||
        newRombel.toLowerCase() === 'semua rombel' ||
        newRombel.toLowerCase() === 'all' ||
        newRombel.toLowerCase() === 'semua kelas'
      ) {
        newRombel = '10 A';
      }

      const nip = data.nip || data.idUnik || teacherDoc.id;

      // Sync authUid with matching user docs if possible, otherwise keep existing
      const newAuthUid = usersMap.get(nip) || data.authUid || data.linkedUserId || '';

      // Logika Penyesuaian Field
      const updatedData: any = {
        nip: nip,
        role: newRole,
        name: data.name ? data.name.trim().replace(/,\s*$/, '') : data.namaLengkap || '',
        mapel: data.mapel || data.subject || '',
        rombel: newRombel,
        isClaimed: data.isClaimed ?? false,
        authUid: newAuthUid,
        phone: data.phone || data.noTelepon || '',
        address: data.address || data.alamat || '',
        birthDate: data.birthDate || data.tanggalLahir || '',
        updatedAt: dbGateway.serverTimestamp(),
      };

      // Remove redundant fields
      const fieldsToDelete = [
        'idUnik',
        'peran',
        'subject',
        'status',
        'accountStatus',
        'linkedUserId',
        'namaLengkap',
        'noTelepon',
        'alamat',
        'tanggalLahir',
        'lastModified',
        'jabatan',
        'Empty1',
        'Empty2',
        'Empty3',
        'Empty4',
        'Empty5',
        'Empty6',
      ];
      fieldsToDelete.forEach((field) => {
        if (data[field] !== undefined) {
          updatedData[field] = dbGateway.deleteField();
        }
      });

      const sanitized = ensureStringIds(updatedData);
      batch.update(docRef, sanitized);
      counter++;
    });

    if (counter > 0) {
      await batch.commit();
      return { success: true, count: counter };
    } else {
      return { success: true, count: 0 };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'teachers');
    return { success: false, count: counter, error: 'Gagal melakukan perbaikan skema' };
  }
};

export const repairStudentsSchema = async (): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> => {
  const tenantId = useUserStore.getState().tenantId;

  const studentRef = dbGateway.collection(db, 'students');
  const batch = dbGateway.writeBatch(db);
  let counter = 0;

  try {
    // Ambil daftar kelas aktif untuk mapping relasi presisi O(1)
    const classesRef = dbGateway.collection(db, 'classes');
    const classesSnapshot = await dbGateway.getDocs(dbGateway.query(classesRef, dbGateway.where('tenantId', '==', tenantId)));
    const classesMap = new Map<string, string>(); // name -> id (Misalnya: "10 A" -> "10_A_2025")

    classesSnapshot.forEach((cDoc) => {
      const cData = cDoc.data() as any;
      if (cData.name) {
        classesMap.set(cData.name, cDoc.id);
        // Dukungan variasi penulisan alternatif untuk normalisasi
        if (cData.name === '10 A') classesMap.set('X-A', cDoc.id);
        if (cData.name === '10 B') classesMap.set('X-B', cDoc.id);
        if (cData.name === '11 B') classesMap.set('XI-B', cDoc.id);
        if (cData.name === '12 C') classesMap.set('XII-C', cDoc.id);
      }
    });

    // e-Mam v8.0 Optimization: Added limit
    const snapshot = await dbGateway.getDocs(
      dbGateway.query(studentRef, dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(500)),
    );

    snapshot.forEach((studentDoc) => {
      const data = studentDoc.data() as any;
      const docRef = dbGateway.doc(db, 'students', studentDoc.id);

      // Pembersihan dan standarisasi tingkatRombel
      let rombel = normalizeRombelName(data.tingkatRombel);

      if (
        rombel === 'BELUM_DISET' &&
        (data.tingkatRombel === '-- TANPA ROMBEL --' || !data.tingkatRombel)
      ) {
        rombel = 'BELUM_DISET';
      }

      // Tentukan classId relasi database index
      let classId = 'undefined'; // Menjaga tipe konsisten jika kosong
      if (rombel !== 'BELUM_DISET') {
        const foundId = classesMap.get(rombel);
        if (foundId) {
          classId = foundId;
        }
      }

      // Logika Penyesuaian Field Berdasarkan Interface Student
      const updatedData = {
        // Protokol Identitas
        idUnik: data.idUnik || studentDoc.id,
        studentsId: studentDoc.id, // Absolute key untuk O(1) indexing
        role: 'siswa', // Tambahan wajib untuk RBAC

        // Pembersihan & Standarisasi Data Utama
        namaLengkap: data.namaLengkap ? data.namaLengkap.trim().toUpperCase() : '',
        nisn: data.nisn || '',
        tingkatRombel: rombel,
        classId: classId,
        status: data.status || 'Aktif',
        point: data.point ?? 0,

        // Schema Klaim Akun
        isClaimed: data.isClaimed ?? false,
        accountStatus: data.accountStatus || 'Active',
        authUid: data.authUid || data.linkedUserId || '',

        // Metadata
        lastModified: dbGateway.serverTimestamp(),
      };

      const sanitized = ensureStringIds(updatedData);
      batch.update(docRef, sanitized);
      counter++;
    });

    if (counter > 0) {
      await batch.commit();
      await incrementMasterVersion();
      return { success: true, count: counter };
    } else {
      return { success: true, count: 0 };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'students');
    return { success: false, count: counter, error: 'Gagal sinkronisasi siswa' };
  }
};

export const repairPointsSchema = async (
  onProgress?: (msg: string) => void,
): Promise<{ success: boolean; count: number; error?: string }> => {
  const tenantId = useUserStore.getState().tenantId;

  const sourceCollections = ['points', 'student_points', 'point_records'];
  let totalMigrated = 0;

  try {
    if (onProgress) onProgress('Memulai migrasi skema poin (V6.5 Native Optimized)...');

    // 1. Fetch Students mapping to ensure idUnik is used correctly (Omni-Guard Protocol)
    if (onProgress) onProgress('Membangun index identitas siswa (NISN -> idUnik)...');
    const studentSnap = await dbGateway.getDocs(
      dbGateway.query(dbGateway.collection(db, 'students'), dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(1000)),
    );
    const studentMap = new Map<string, string>(); // nisn -> idUnik
    studentSnap.forEach((d) => {
      const data = d.data();
      if (data.nisn && data.idUnik && data.idUnik !== data.nisn) {
        studentMap.set(data.nisn, data.idUnik);
      }
    });
    if (onProgress) onProgress(`Index siap. ${studentMap.size} pemetaan NISN ditemukan.`);

    for (const collName of sourceCollections) {
      if (onProgress) onProgress(`Memeriksa koleksi: ${collName}`);
      const snap = await dbGateway.getDocs(
        dbGateway.query(dbGateway.collection(db, collName), dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(300)),
      );

      if (snap.empty) continue;

      const batch = dbGateway.writeBatch(db);
      let collCount = 0;

      for (const docSnap of snap.docs) {
        const data = docSnap.data() as any;

        // Identify the best available student ID
        const rawStudentId =
          data.idUnik || data.studentId || data.idSiswa || data.nisn || data.idSiswaLegacy;

        // Ensure idUnik is not NISN if mapping exists
        let studentId = rawStudentId;
        if (studentMap.has(rawStudentId)) {
          studentId = studentMap.get(rawStudentId)!;
        }

        if (studentId) {
          const targetId =
            docSnap.id.length > 5 ? docSnap.id : `${studentId}_m_${Date.now()}_${collCount}`;
          const newPointRef = dbGateway.doc(db, 'poin', targetId);

          const normalizedPoint = {
            idUnik: studentId,
            studentsId: studentId, // e-Mam v8.0 Consistency Fix
            namaSiswa: data.namaSiswa || data.studentName || data.name || 'Siswa',
            rombel: data.rombel || data.class || data.classId || data.className || '10 A',
            class: data.class || data.rombel || data.classId || '10 A', // e-Mam v8.0 Consistency Fix
            skor:
              typeof data.skor === 'number'
                ? data.skor
                : typeof data.points === 'number'
                  ? data.points
                  : parseInt(String(data.skor || data.points || '0'), 10) || 0,
            kategori:
              data.kategori ||
              (data.type === 'Achievement' ||
              data.type === 'Prestasi' ||
              (typeof data.points === 'number' && data.points < 0)
                ? 'Prestasi'
                : 'Pelanggaran'),
            keterangan: data.keterangan || data.description || data.content || 'Data Migrasi',
            tanggal:
              data.tanggal ||
              (data.timestamp
                ? typeof data.timestamp === 'string'
                  ? data.timestamp.split('T')[0]
                  : new Date(data.timestamp.seconds * 1000).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]),
            jenis: 'Migrasi System',
            idPetugas: data.authorId || data.idPetugas || 'system',
            migratedAt: new Date().toISOString(),
            serverTime: dbGateway.serverTimestamp(),
          };

          const sanitized = ensureStringIds(normalizedPoint);
          batch.set(newPointRef, sanitized);
          collCount++;
        }
      }

      if (collCount > 0) {
        await batch.commit();
        totalMigrated += collCount;
        if (onProgress) onProgress(`✅ Migrasi ${collCount} data dari ${collName} selesai.`);
      }
    }

    return { success: true, count: totalMigrated };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'poin');
    return { success: false, count: totalMigrated, error: 'Gagal migrasi poin' };
  }
};

/**
 * Sinkronisasi Foto Profil Pengguna (photoURL dari koleksi 'users') ke Data Induk ('students' & 'teachers')
 */
export const syncExistingPhotosToInduk = async (
  onProgress?: (msg: string) => void,
): Promise<{ success: boolean; count: number; error?: string }> => {
  if (isMockMode) return { success: true, count: 0 };

  const tenantId = useUserStore.getState().tenantId;

  let counter = 0;
  try {
    if (onProgress) onProgress('Memulai sinkronisasi foto profil dari users ke data induk...');

    const usersSnap = await dbGateway.getDocs(
      dbGateway.query(dbGateway.collection(db, 'users'), dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(500)),
    );
    if (usersSnap.empty) {
      return { success: true, count: 0 };
    }

    const batch = dbGateway.writeBatch(db);
    let batchCount = 0;

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data() as any;
      const photoURL = data.photoURL;
      if (photoURL && typeof photoURL === 'string' && photoURL.trim() !== '') {
        const studentId = data.studentsId || data.studentId;
        const teacherId = data.teachersId || data.teacherId;

        if (studentId) {
          const studentRef = dbGateway.doc(db, 'students', studentId);
          try {
            const studentSnap = await dbGateway.getDoc(studentRef);
            if (studentSnap.exists()) {
              const studentData = studentSnap.data() as any;
              // Hanya update jika photoURL tidak sama atau kosong untuk mencegah over-writing yang sia-sia
              if (studentData.photoURL !== photoURL) {
                batch.update(studentRef, { photoURL });
                batchCount++;
                counter++;
              }
            }
          } catch (e) {
            console.warn(`Gagal memeriksa data siswa ${studentId}:`, e);
          }
        } else if (teacherId) {
          const teacherRef = dbGateway.doc(db, 'teachers', teacherId);
          try {
            const teacherSnap = await dbGateway.getDoc(teacherRef);
            if (teacherSnap.exists()) {
              const teacherData = teacherSnap.data() as any;
              // Hanya update jika photoURL tidak sama atau kosong
              if (teacherData.photoURL !== photoURL) {
                batch.update(teacherRef, { photoURL });
                batchCount++;
                counter++;
              }
            }
          } catch (e) {
            console.warn(`Gagal memeriksa data guru ${teacherId}:`, e);
          }
        }

        // Hindari limitasi maksimum batch Firestore (500 operasi)
        if (batchCount >= 450) {
          await batch.commit();
          if (onProgress) onProgress(`Mengirimkan sebagian data (${batchCount} item)...`);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      await incrementMasterVersion();
      if (onProgress)
        onProgress(`✅ Berhasil menyinkronkan ${counter} foto profil baru ke data induk.`);
    } else {
      if (onProgress) onProgress('Semua foto profil data induk sudah sinkron dengan users.');
    }

    return { success: true, count: counter };
  } catch (e: any) {
    console.error('Gagal sinkronisasi foto profil:', e);
    return { success: false, count: counter, error: e.message };
  }
};

/**
 * Migrate tenantId field to tenantsId across all main collections
 */
export const migrateTenantIdToTenantsId = async (
  onProgress: (msg: string) => void,
): Promise<void> => {
  const collections = [
    'users',
    'students',
    'attendance',
    'notifications',
    'letters',
    'classes',
    'teachers',
    'poin',
    'teacher_attendance',
    'point_categories',
    'system',
    'admins',
  ];

  for (const collName of collections) {
    onProgress(`Migrating ${collName}...`);
    const q = dbGateway.query(dbGateway.collection(db, collName), dbGateway.where('tenantId', '!=', null));
    const snapshot = await dbGateway.getDocs(q);

    let batch = dbGateway.writeBatch(db);
    let batchSize = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.tenantId && !data.tenantsId) {
        batch.update(docSnap.ref, {
          tenantsId: data.tenantId,
          tenantId: dbGateway.deleteField(),
        });
        batchSize++;
      }

      if (batchSize >= 400) {
        await batch.commit();
        batch = dbGateway.writeBatch(db);
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }
  }
};

/**
 * Scan collections to get sample keys/schema
 */
export const scanCollectionsSchema = async (
  collections: string[],
): Promise<Record<string, string[]>> => {
  const schemaSummary: Record<string, string[]> = {};
  for (const collName of collections) {
    const snap = await dbGateway.getDocs(dbGateway.query(dbGateway.collection(db, collName), dbGateway.limit(5)));
    const keys = new Set<string>();
    snap.forEach((d) => Object.keys(d.data()).forEach((k) => keys.add(k)));
    schemaSummary[collName] = Array.from(keys);
  }
  return schemaSummary;
};

export const downloadFirestoreSchemas = async (): Promise<void> => {
  const collections = [
    'users',
    'students',
    'teachers',
    'classes',
    'attendance',
    'notifications',
    'settings',
    'system',
    'logs',
    'audit_logs',
    'poin',
  ];
  try {
    const schemaSummary = await scanCollectionsSchema(collections);
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(schemaSummary, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `firestore_schema_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  } catch (error: any) {
    console.error('Gagal download schema:', error.message);
    throw error;
  }
};

/**
 * Update field value in all documents of specified collections
 */
export const updateFieldInCollections = async (
  collections: string[],
  field: string,
  oldValue: any,
  newValue: any,
  onProgress: (msg: string) => void,
): Promise<void> => {
  if (!field || field.trim() === '') {
    throw new Error('Field name cannot be empty');
  }
  for (const collName of collections) {
    onProgress(`Updating ${collName}...`);
    const q = dbGateway.query(dbGateway.collection(db, collName), dbGateway.where(field, '==', oldValue));
    const snapshot = await dbGateway.getDocs(q);

    let batch = dbGateway.writeBatch(db);
    let batchSize = 0;

    for (const docSnap of snapshot.docs) {
      batch.update(docSnap.ref, { [field]: newValue });
      batchSize++;

      if (batchSize >= 400) {
        await batch.commit();
        batch = dbGateway.writeBatch(db);
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }
  }
};

/**
 * Delete field in all documents of specified collections
 */
export const deleteFieldInCollections = async (
  collections: string[],
  field: string,
  onProgress: (msg: string) => void,
): Promise<void> => {
  if (!field || field.trim() === '') {
    throw new Error('Field name cannot be empty');
  }
  for (const collName of collections) {
    onProgress(`Deleting field from ${collName}...`);
    const q = dbGateway.query(dbGateway.collection(db, collName), dbGateway.where(field, '!=', null));
    const snapshot = await dbGateway.getDocs(q);

    let batch = dbGateway.writeBatch(db);
    let batchSize = 0;

    for (const docSnap of snapshot.docs) {
      batch.update(docSnap.ref, { [field]: dbGateway.deleteField() });
      batchSize++;

      if (batchSize >= 400) {
        await batch.commit();
        batch = dbGateway.writeBatch(db);
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }
  }
};

/**
 * Rename a field in all documents of specified collections
 */
export const renameFieldInCollections = async (
  collections: string[],
  oldField: string,
  newField: string,
  onProgress: (msg: string) => void,
): Promise<void> => {
  if (!oldField || oldField.trim() === '' || !newField || newField.trim() === '') {
    throw new Error('Field names cannot be empty');
  }
  for (const collName of collections) {
    onProgress(`Renaming ${oldField} to ${newField} in ${collName}...`);
    // Find documents that contain oldField with a value
    const q = dbGateway.query(dbGateway.collection(db, collName), dbGateway.where(oldField, '!=', null));
    const snapshot = await dbGateway.getDocs(q);

    let batch = dbGateway.writeBatch(db);
    let batchSize = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data[oldField] !== undefined) {
        batch.update(docSnap.ref, {
          [newField]: data[oldField],
          [oldField]: dbGateway.deleteField(),
        });
        batchSize++;

        if (batchSize >= 400) {
          await batch.commit();
          batch = dbGateway.writeBatch(db);
          batchSize = 0;
        }
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }
  }
};

/**
 * e-Mam v8.1 - Extended Migration Tools
 */

export const executeDatabaseSchemaMigration = async () => {
  const users = await repairUsersSchema();
  const teachers = await repairTeachersSchema();
  const students = await repairStudentsSchema();
  return {
    migratedCount: (users.count || 0) + (teachers.count || 0) + (students.count || 0),
  };
};

export const migrateProfileUpdateRequestsData = async (log: (msg: string) => void) => {
  log('Checking profile_update_requests...');
  const snap = await dbGateway.getDocs(dbGateway.query(dbGateway.collection(db, 'profile_update_requests'), dbGateway.limit(100)));
  if (snap.empty) {
    log('No requests found.');
    return 0;
  }

  let migrated = 0;
  const batch = dbGateway.writeBatch(db);

  for (const rDoc of snap.docs) {
    const data = rDoc.data();
    if (data.status === 'approved' && data.studentsId) {
      const studentRef = dbGateway.doc(db, 'students', data.studentsId);
      batch.update(studentRef, {
        ...data.updates,
        updatedAt: dbGateway.serverTimestamp(),
      });
      batch.delete(rDoc.ref);
      migrated++;
    }
  }

  if (migrated > 0) await batch.commit();
  return migrated;
};

export const migrateUserDataToStudents = async (log: (msg: string) => void) => {
  log("Searching for users with role 'siswa' missing student records...");
  const usersSnap = await dbGateway.getDocs(
    dbGateway.query(dbGateway.collection(db, 'users'), dbGateway.where('role', '==', 'siswa'), dbGateway.limit(100)),
  );
  let processed = 0;
  let migrated = 0;

  const batch = dbGateway.writeBatch(db);

  for (const uDoc of usersSnap.docs) {
    const uData = uDoc.data();
    processed++;

    if (uData.studentsId || uData.studentId) {
      const sId = uData.studentsId || uData.studentId;
      const sSnap = await dbGateway.getDoc(dbGateway.doc(db, 'students', sId));
      if (!sSnap.exists()) {
        batch.set(dbGateway.doc(db, 'students', sId), {
          studentsId: sId,
          namaLengkap: uData.displayName || 'Siswa',
          authUid: uDoc.id,
          role: 'siswa',
          tenantId: uData.tenantId || 'default',
          createdAt: dbGateway.serverTimestamp(),
          updatedAt: dbGateway.serverTimestamp(),
        });
        migrated++;
      }
    }
  }

  if (migrated > 0) await batch.commit();
  return { processedCount: processed, migratedCount: migrated };
};

export const migrateToNewRBAC = async (log: (msg: string) => void) => {
  const tenantId = useUserStore.getState().tenantId;

  log('Updating user roles to RBAC v2 structure (roles array)...');
  const usersSnap = await dbGateway.getDocs(
    dbGateway.query(dbGateway.collection(db, 'users'), dbGateway.where('tenantId', '==', tenantId), dbGateway.limit(200)),
  );
  let count = 0;
  const batch = dbGateway.writeBatch(db);

  usersSnap.forEach((uDoc) => {
    const data = uDoc.data();
    if (data.role && !Array.isArray(data.roles)) {
      batch.update(uDoc.ref, {
        roles: [data.role],
        updatedAt: dbGateway.serverTimestamp(),
      });
      count++;
    }
  });

  if (count > 0) await batch.commit();
  return count;
};
