import { useAuthStore } from '@/stores/authStore';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { handleFirestoreError, OperationType } from './firebase';
import { auditLog } from './auditLogService';
import { incrementMasterVersion } from './systemService';

export const fetchCollectionData = async (collectionName: string, limitCount: number = 100) => {
  try {
    const q = dbGateway.query(dbGateway.collection(dbGateway.db, collectionName), dbGateway.limit(limitCount));
    const snap = await dbGateway.getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, collectionName);
    throw e;
  }
};

export const fetchSystemConfig = async () => {
  try {
    const [alertSnap, featuresSnap, permissionsSnap, locksSnap] = await Promise.all([
      dbGateway.getDoc(dbGateway.doc(dbGateway.db, 'system', 'active_alert')),
      dbGateway.getDoc(dbGateway.doc(dbGateway.db, 'system', 'features')),
      dbGateway.getDoc(dbGateway.doc(dbGateway.db, 'system', 'permissions')),
      dbGateway.getDoc(dbGateway.doc(dbGateway.db, 'system', 'feature_locks')),
    ]);

    return {
      alert: alertSnap.exists() ? alertSnap.data() : null,
      features: featuresSnap.exists() ? featuresSnap.data() : null,
      permissions: permissionsSnap.exists() ? permissionsSnap.data() : null,
      lockedFeatures: locksSnap.exists() ? locksSnap.data()?.locked || [] : [],
    };
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'system');
    throw e;
  }
};

export const saveDocumentToCollection = async (
  collectionName: string,
  id: string | null,
  data: any,
) => {
  try {
    if (id) {
      await dbGateway.setDoc(
        dbGateway.doc(dbGateway.db, collectionName, id),
        {
          ...data,
          updatedAt: dbGateway.serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await dbGateway.addDoc(dbGateway.collection(dbGateway.db, collectionName), {
        ...data,
        createdAt: dbGateway.serverTimestamp(),
        updatedAt: dbGateway.serverTimestamp(),
      });
    }
    await auditLog({
      action: id ? 'UPDATE_DOC' : 'ADD_DOC',
      category: 'SYSTEM',
      details: `Doc ${id || 'new'} in ${collectionName}`,
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, collectionName);
    throw e;
  }
};

export const deleteDocumentFromCollection = async (collectionName: string, id: string) => {
  try {
    await dbGateway.deleteDoc(dbGateway.doc(dbGateway.db, collectionName, id));
    await auditLog({
      action: 'DELETE_DOC',
      category: 'SYSTEM',
      details: `Doc ${id} in ${collectionName}`,
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, collectionName);
    throw e;
  }
};

export const toggleFeatureLock = async (id: string, lockedFeatures: string[]) => {
  try {
    const newLocked = lockedFeatures.includes(id)
      ? lockedFeatures.filter((x) => x !== id)
      : [...lockedFeatures, id];

    // Update individual doc
    await dbGateway.setDoc(
      dbGateway.doc(dbGateway.db, 'system', 'feature_locks'),
      {
        locked: newLocked,
        updatedAt: dbGateway.serverTimestamp(),
      },
      { merge: true },
    );

    // Sync to unified config for high-efficiency listeners
    await dbGateway.setDoc(
      dbGateway.doc(dbGateway.db, 'system', 'config'),
      {
        feature_locks: newLocked,
        last_updated: new Date().toISOString(),
      },
      { merge: true },
    );

    await incrementMasterVersion();
    return newLocked;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'system');
    throw e;
  }
};

export const savePermissions = async (rolePermissions: any) => {
  try {
    // Update individual doc
    await dbGateway.setDoc(dbGateway.doc(dbGateway.db, 'system', 'permissions'), rolePermissions);

    // Sync to unified config
    await dbGateway.setDoc(
      dbGateway.doc(dbGateway.db, 'system', 'config'),
      {
        role_permissions: rolePermissions,
        last_updated: new Date().toISOString(),
      },
      { merge: true },
    );

    await incrementMasterVersion();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'system');
    throw e;
  }
};

export const generateTeacherAttendanceDummy = async (log: (msg: string) => void) => {
  try {
    const attendanceRef = dbGateway.collection(dbGateway.db, 'teacher_attendance');
    const batch = dbGateway.writeBatch(dbGateway.db);
    const teachers = [
      { id: 'T001', name: 'Budi Santoso' },
      { id: 'T002', name: 'Siti Aminah' },
    ];
    for (const teacher of teachers) {
      const docRef = dbGateway.doc(attendanceRef);
      batch.set(docRef, {
        teacherId: teacher.id,
        teacherName: teacher.name,
        classId: 'C10A',
        className: '10 A',
        qrToken: `QR-${teacher.id}-${Math.random().toString(36).substring(7)}`,
        lat: -6.1751,
        lng: 106.8272,
        distance: 5,
        status: 'VALID',
        timestamp: new Date().toISOString(),
        deviceInfo: 'Android-Dummy',
      });
    }
    await batch.commit();
    log(`SUKSES: ${teachers.length} dummy attendance records added.`);
  } catch (e: any) {
    log(`ERROR: ${e.message}`);
    handleFirestoreError(e, OperationType.WRITE, 'teacher_attendance');
    throw e;
  }
};

export const generateRandomPointsForRombels = async (
  rombels: string[],
  log: (msg: string) => void,
) => {
  try {
    const tenantId = useAuthStore.getState().user?.tenantId || '30315537';
    const batch = dbGateway.writeBatch(dbGateway.db);
    let count = 0;

    for (const rombelId of rombels) {
      log(`Mengambil siswa untuk rombel ${rombelId}...`);
      const q = dbGateway.query(
        dbGateway.collection(dbGateway.db, 'students'),
        dbGateway.where('tenantId', '==', tenantId),
        dbGateway.where('classId', '==', rombelId),
      );
      const snap = await dbGateway.getDocs(q);

      for (const docSnap of snap.docs) {
        const s = docSnap.data();
        // Randomly assign points based on rules
        // 30% alpha (10 points), 30% late (5 points), 40% clean (0 points)
        const rand = Math.random();
        let point = 0;
        let description = '';

        if (rand < 0.3) {
          point = 10;
          description = 'Alpha (Tanpa Keterangan) - Generated by Omni-Guard';
        } else if (rand < 0.6) {
          point = 5;
          description = 'Terlambat / Izin - Generated by Omni-Guard';
        } else {
          continue; // no points to add
        }

        const ref = dbGateway.doc(dbGateway.collection(dbGateway.db, 'point_transactions'));
        batch.set(ref, {
          id: ref.id,
          tenantId,
          studentId: s.id,
          studentName: s.namaLengkap || s.name || 'Unknown',
          type: 'pelanggaran',
          point,
          description,
          createdBy: 'system_omniguard',
          createdAt: new Date().toISOString(),
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      log(`Berhasil menyuntikkan ${count} transaksi poin untuk rombel yang dipilih.`);
    } else {
      log('Tidak ada siswa atau tidak ada poin yang disuntikkan.');
    }
    return { success: true, count };
  } catch (error: any) {
    log(`Gagal generate poin: ${error.message}`);
    throw error;
  }
};

export const generateRandomLettersForRombels = async (
  rombels: string[],
  log: (msg: string) => void,
) => {
  try {
    const tenantId = useAuthStore.getState().user?.tenantId || '30315537';
    const batch = dbGateway.writeBatch(dbGateway.db);
    let count = 0;

    for (const rombelId of rombels) {
      log(`Mengambil siswa untuk rombel ${rombelId} untuk surat...`);
      const q = dbGateway.query(
        dbGateway.collection(dbGateway.db, 'students'),
        dbGateway.where('tenantId', '==', tenantId),
        dbGateway.where('classId', '==', rombelId),
      );
      const snap = await dbGateway.getDocs(q);

      for (const docSnap of snap.docs) {
        const s = docSnap.data();
        if (Math.random() > 0.4) continue; // Only generate for some

        const ref = dbGateway.doc(dbGateway.collection(dbGateway.db, 'letters'));
        batch.set(ref, {
          id: ref.id,
          tenantId,
          studentId: s.id,
          studentName: s.namaLengkap || 'Unknown',
          type: Math.random() > 0.5 ? 'sakit' : 'izin',
          description: 'Simulasi surat generated by Omni-Guard',
          status: 'approved',
          createdAt: new Date().toISOString(),
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      log(`Berhasil menyuntikkan ${count} surat acak.`);
    }
    return { success: true, count };
  } catch (error: any) {
    log(`Gagal generate surat: ${error.message}`);
    throw error;
  }
};

export const analyzeSchemaQuality = async (tabelSistem: any[], log: (msg: string) => void) => {
  log('=== [MEMULAI] ANALISIS SCHEMA DATABASE ===');
  log('Daftar koleksi target: ' + tabelSistem.map((t) => t.id).join(', '));

  let grandTotalDocs = 0;
  let highIssuesCount = 0;
  let mediumIssuesCount = 0;

  for (const col of tabelSistem) {
    log(`📂 Memindai koleksi '${col.id}' (${col.label})...`);
    try {
      const snap = await dbGateway.getDocs(dbGateway.query(dbGateway.collection(dbGateway.db, col.id), dbGateway.limit(150)));
      const count = snap.size;
      grandTotalDocs += count;
      log(`   ↳ Membaca ${count} dokumen.`);

      let missingTenant = 0;
      let legacyKeys = 0;

      snap.forEach((d: any) => {
        const data = d.data();
        if (data.tenantId === undefined || data.tenantId === null) missingTenant++;
        if (data.studentID || data.idSiswa || data.teacherID || data.NIP) legacyKeys++;
      });

      if (missingTenant > 0) {
        log(`   ⚠️ [MEDIUM] ${missingTenant} data di koleksi '${col.id}' tidak memiliki tenantId.`);
        mediumIssuesCount += missingTenant;
      }
      if (legacyKeys > 0) {
        log(`   ⚠️ [HIGH] ${legacyKeys} data di koleksi '${col.id}' menggunakan field relasi lama.`);
        highIssuesCount += legacyKeys;
      }
    } catch (e: any) {
      log(`   ❌ [ERROR] Gagal memproses koleksi '${col.id}': ${e.message}`);
    }
  }

  return `Analisis Selesai! Ditemukan ${highIssuesCount + mediumIssuesCount} masalah. Scan total ${grandTotalDocs} dokumen.`;
};
