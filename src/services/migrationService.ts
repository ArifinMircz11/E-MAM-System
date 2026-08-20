import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from '@/services/firebase';
import {
  transformStudentToV2,
  transformTeacherToV2,
  transformTenantToV2,
  transformDocData,
} from '@/utils/schemaTransforms';
import { UserMigrationV2 } from '../migration/rules/UserMigrationV2';

export const migrationService = {
  async findTargetIdByEmail(tenantId: string, email: string, isStudent: boolean): Promise<string> {
    if (!db) return '';
    try {
      const collName = isStudent ? `tenants/${tenantId}/siswa` : `tenants/${tenantId}/teachers`;
      const emailField = isStudent ? 'emailGoogleSSO' : 'email';
      const q = dbGateway.query(dbGateway.collection(db, collName), dbGateway.where(emailField, '==', email));
      const snap = await dbGateway.getDocs(q);
      if (!snap.empty) {
        const dataDoc = snap.docs[0].data();
        return dataDoc.idUnik || dataDoc.nisn || dataDoc.nik || dataDoc.nip || '';
      }
    } catch (e) {
      console.error('findTargetIdByEmail error:', e);
    }
    return '';
  },

  async fetchMigrations() {
    if (!db) throw new Error('Database not initialized');
    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'migration_logs'));
    return snap.docs.map(
      (d) =>
        ({
          id: d.id,
          ...d.data(),
        }) as any,
    );
  },

  async previewAll(collectionsToPreview: string[], fetchMasterReferences: () => Promise<any>) {
    if (!db) throw new Error('Database not initialized');
    const results: Record<string, { before: any; after: any }> = {};

    for (const collName of collectionsToPreview) {
      try {
        const snap = await dbGateway.getDocs(dbGateway.query(dbGateway.collection(db, collName), dbGateway.limit(1)));
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const oldData = docSnap.data();
          let newData;

          if (collName === 'students') newData = transformStudentToV2(oldData, docSnap.id);
          else if (collName === 'teachers') newData = transformTeacherToV2(oldData, docSnap.id);
          else if (collName === 'tenants') newData = transformTenantToV2(oldData, docSnap.id);
          else newData = transformDocData(oldData, docSnap.id, await fetchMasterReferences());

          results[collName] = { before: oldData, after: newData };
        }
      } catch (e) {
        console.error(`Gagal preview ${collName}`, e);
      }
    }
    return results;
  },

  async runTeacherMigration(
    migrationId: string,
    currentUserId: string,
    onProgress: (stats: any) => void,
  ) {
    if (!db) throw new Error('Database not initialized');

    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'teachers'));
    const total = snap.size;
    let success = 0;
    let failed = 0;
    let currentCount = 0;

    const batchSize = 100;
    let currentBatch = dbGateway.writeBatch(db);
    let opCount = 0;

    for (const document of snap.docs) {
      try {
        const data = document.data();
        const newData = transformTeacherToV2(data, document.id);

        const backupRef = dbGateway.doc(dbGateway.collection(db, 'migration_backups'));
        currentBatch.set(backupRef, {
          migrationId,
          collection: 'teachers',
          teacherId: document.id,
          oldData: data,
          createdAt: dbGateway.serverTimestamp(),
        });

        currentBatch.set(dbGateway.doc(db, 'teachers', document.id), newData);

        opCount += 2;
        success++;
      } catch (e) {
        failed++;
      }

      currentCount++;

      if (opCount >= batchSize) {
        await currentBatch.commit();
        onProgress({ success, failed, current: currentCount, total });
        currentBatch = dbGateway.writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }

    // Setup new migration log for Teachers
    const migrationLogRef = dbGateway.doc(dbGateway.collection(db, 'migration_logs'), migrationId);
    await dbGateway.setDoc(migrationLogRef, {
      migrationId,
      type: 'teachers',
      executedBy: currentUserId,
      processed: total,
      createdAt: dbGateway.serverTimestamp(),
    });

    return { success, failed, total };
  },

  async runStudentMigration(
    migrationId: string,
    currentUserId: string,
    onProgress: (stats: any) => void,
  ) {
    if (!db) throw new Error('Database not initialized');

    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'students'));
    const total = snap.size;
    let success = 0;
    let failed = 0;
    let currentCount = 0;

    const batchSize = 100;
    let currentBatch = dbGateway.writeBatch(db);
    let opCount = 0;

    for (const document of snap.docs) {
      try {
        const data = document.data();
        const newData = transformStudentToV2(data, document.id);

        const backupRef = dbGateway.doc(dbGateway.collection(db, 'migration_backups'));
        currentBatch.set(backupRef, {
          migrationId,
          collection: 'students',
          studentId: document.id,
          oldData: data,
          createdAt: dbGateway.serverTimestamp(),
        });

        currentBatch.set(dbGateway.doc(db, 'students', document.id), newData);

        opCount += 2;
        success++;
      } catch (e) {
        failed++;
      }

      currentCount++;

      if (opCount >= batchSize) {
        await currentBatch.commit();
        onProgress({ success, failed, current: currentCount, total });
        currentBatch = dbGateway.writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }

    // Setup new migration log for Students
    const migrationLogRef = dbGateway.doc(dbGateway.collection(db, 'migration_logs'), migrationId);
    await dbGateway.setDoc(migrationLogRef, {
      migrationId,
      type: 'students',
      executedBy: currentUserId,
      processed: total,
      createdAt: dbGateway.serverTimestamp(),
    });

    return { success, failed, total };
  },

  async runUserMigration(
    migrationId: string,
    currentUserId: string,
    onProgress: (stats: any) => void,
  ) {
    if (!db) throw new Error('Database not initialized');

    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'users'));
    const total = snap.size;
    let success = 0;
    let failed = 0;
    let currentCount = 0;

    const batchSize = 100;
    let currentBatch = dbGateway.writeBatch(db);
    let opCount = 0;

    for (const document of snap.docs) {
      try {
        const data = document.data();
        const { transformed } = await UserMigrationV2.migrate(data, false);

        if (transformed.email === 'admin@example.com' || document.id === 'C8Xb8vh93KgbSAXq8Qj1') {
          transformed.accountType = 'developer';
          transformed.role = 'developer';
          transformed.roles = ['developer'];
          transformed.tenantId = 'global';
          transformed.scope = { level: 'global' };
          transformed.permissions = [
            'system.manage',
            'user.manage',
            'migration.execute',
            'architecture.manage',
            'audit.view',
          ];
        }

        const backupRef = dbGateway.doc(dbGateway.collection(db, 'migration_backups'));
        currentBatch.set(backupRef, {
          migrationId,
          collection: 'users',
          userId: document.id,
          oldData: data,
          createdAt: dbGateway.serverTimestamp(),
        });

        currentBatch.set(dbGateway.doc(db, 'users', document.id), transformed);

        // Also create migration audit log per user as required by WO-007
        const userLogRef = dbGateway.doc(dbGateway.collection(db, 'migration_logs'));
        currentBatch.set(userLogRef, {
          migrationId,
          entity: 'users',
          uid: document.id,
          before: data,
          after: transformed,
          status: 'success',
          timestamp: new Date().toISOString(),
          executedBy: currentUserId,
        });

        opCount += 3;
        success++;
      } catch (e) {
        failed++;
      }

      currentCount++;

      if (opCount >= batchSize) {
        await currentBatch.commit();
        onProgress({ success, failed, current: currentCount, total });
        currentBatch = dbGateway.writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }

    const migrationLogRef = dbGateway.doc(dbGateway.collection(db, 'migration_logs'), migrationId);
    await dbGateway.setDoc(migrationLogRef, {
      migrationId,
      type: 'users',
      executedBy: currentUserId,
      processed: total,
      success,
      failed,
      createdAt: dbGateway.serverTimestamp(),
    });

    return { success, failed, total, beforeCount: total, afterCount: success };
  },

  async fetchMasterReferences() {
    const refs: { students: Record<string, string>; teachers: Record<string, string> } = {
      students: {},
      teachers: {},
    };
    if (!db) return refs;
    const studentsSnap = await dbGateway.getDocs(dbGateway.collection(db, 'students'));
    studentsSnap.forEach((d) => {
      const data = d.data();
      if (data.userId && data.studentsId) refs.students[data.userId] = data.studentsId;
    });

    const teachersSnap = await dbGateway.getDocs(dbGateway.collection(db, 'teachers'));
    teachersSnap.forEach((d) => {
      const data = d.data();
      if (data.userId && data.idUnik) refs.teachers[data.userId] = data.idUnik;
    });

    return refs;
  },

  async createAuditLog(currentUserId: string, action: string, details: any) {
    if (!db) return;
    const auditRef = dbGateway.doc(dbGateway.collection(db, 'audit_logs'));
    await dbGateway.writeBatch(db)
      .set(auditRef, {
        action,
        executedBy: currentUserId,
        timestamp: dbGateway.serverTimestamp(),
        ...details,
      })
      .commit();
  },

  async analyzeUsers() {
    if (!db) throw new Error('Database not initialized');
    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'users'));
    let legacyCount = 0;
    let v2Count = 0;
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.schemaVersion === 2 && data.accountType && data.scope) {
        v2Count++;
      } else {
        legacyCount++;
      }
    });
    return {
      total: snap.size,
      legacyCount,
      v2Count,
      sampleDoc: snap.docs.length > 0 ? snap.docs[0].data() : null,
    };
  },

  async analyzeStudents() {
    if (!db) throw new Error('Database not initialized');
    // Using limit to prevent massive read costs as seen in component optimization
    const q = dbGateway.query(dbGateway.collection(db, 'students'), dbGateway.limit(100));
    const snap = await dbGateway.getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    let legacyCount = 0;
    let v2Count = 0;

    data.forEach((item: any) => {
      if (item.sistemJangkar && item.metadataAkademik) {
        v2Count++;
      } else {
        legacyCount++;
      }
    });

    return {
      total: data.length,
      legacyCount,
      v2Count,
      sampleDoc: data.length > 0 ? data[0] : null,
    };
  },

  async analyzeTeachers() {
    if (!db) throw new Error('Database not initialized');
    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'teachers'));
    let legacyCount = 0;
    let v2Count = 0;

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.sistemJangkar && data.jabatanDanStatus) {
        v2Count++;
      } else {
        legacyCount++;
      }
    });

    return {
      total: snap.size,
      legacyCount,
      v2Count,
      sampleDoc: snap.docs.length > 0 ? snap.docs[0].data() : null,
    };
  },

  async analyzeTenants() {
    if (!db) throw new Error('Database not initialized');
    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'tenants'));
    let activeTenants = 0;
    let inactiveTenants = 0;

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.status === 'Active' || data.isActive === true) {
        activeTenants++;
      } else {
        inactiveTenants++;
      }
    });

    return {
      total: snap.size,
      activeTenants,
      inactiveTenants,
      sampleDoc: snap.docs.length > 0 ? snap.docs[0].data() : null,
    };
  },

  async runTenantMigration(
    migrationId: string,
    currentUserId: string,
    onProgress: (stats: any) => void
  ) {
    if (!db) throw new Error('Database not initialized');

    const snap = await dbGateway.getDocs(dbGateway.collection(db, 'tenants'));
    const total = snap.size;
    let success = 0;
    let failed = 0;
    let currentCount = 0;

    const batchSize = 100;
    let currentBatch = dbGateway.writeBatch(db);
    let opCount = 0;

    for (const document of snap.docs) {
      try {
        const data = document.data();
        const newData = transformTenantToV2(data, document.id);

        const backupRef = dbGateway.doc(dbGateway.collection(db, 'migration_backups'));
        currentBatch.set(backupRef, {
          migrationId,
          collection: 'tenants',
          tenantId: document.id,
          oldData: data,
          createdAt: dbGateway.serverTimestamp(),
        });

        currentBatch.set(dbGateway.doc(db, 'tenants', document.id), newData);

        opCount += 2;
        success++;
      } catch (e) {
        failed++;
      }

      currentCount++;

      if (opCount >= batchSize) {
        await currentBatch.commit();
        onProgress({ success, failed, current: currentCount, total });
        currentBatch = dbGateway.writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }

    // Setup migration log
    const migrationLogRef = dbGateway.doc(dbGateway.collection(db, 'migration_logs'), migrationId);
    await dbGateway.setDoc(migrationLogRef, {
      migrationId,
      type: 'tenants',
      executedBy: currentUserId,
      processed: total,
      success,
      failed,
      createdAt: dbGateway.serverTimestamp(),
    });

    await this.createAuditLog(currentUserId, 'tenant_migration_v2', {
      affectedDocuments: total,
      successCount: success,
      failedCount: failed,
      migrationId,
    });

    return { success, failed, total };
  },

  async runRollback(rollbackId: string, currentUserId: string, onProgress: (restored: number, total: number) => void) {
    if (!db) throw new Error('Database not initialized');

    const snap = await dbGateway.getDocs(
      dbGateway.query(dbGateway.collection(db, 'migration_backups'), dbGateway.where('migrationId', '==', rollbackId))
    );
    const docsToRestore = snap.docs;

    if (docsToRestore.length === 0) {
      throw new Error('Tidak ada data backup ditemukan untuk Migration ID ini.');
    }

    let currentBatch = dbGateway.writeBatch(db);
    let opCount = 0;
    let restored = 0;

    for (const document of docsToRestore) {
      const data = document.data();
      const collectionName = data.collection || 'users';
      const docId = data.userId || data.studentId || data.teacherId || data.tenantId;

      if (docId && data.oldData) {
        currentBatch.set(dbGateway.doc(db, collectionName, docId), data.oldData);
        opCount++;
        restored++;
      }

      if (opCount >= 400) {
        await currentBatch.commit();
        onProgress(restored, docsToRestore.length);
        currentBatch = dbGateway.writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }

    const rollbackLogRef = dbGateway.doc(dbGateway.collection(db, 'migration_logs'), `rollback_${Date.now()}`);
    await dbGateway.setDoc(rollbackLogRef, {
      migrationId: rollbackId,
      rollback: true,
      executedBy: currentUserId,
      createdAt: dbGateway.serverTimestamp(),
    });

    await this.createAuditLog(currentUserId, 'schema_migration_rollback', {
      affectedDocuments: restored,
      migrationId: rollbackId,
    });

    return restored;
  },

  async runUserEdit(uid: string, data: any, currentUserId: string) {
    if (!db) throw new Error('Database not initialized');
    await dbGateway.setDoc(dbGateway.doc(db, 'users', uid), data, { merge: true });
    await this.createAuditLog(currentUserId, 'user_manual_edit', { uid });
  },

  async runAutoFixRefs(singleUid: string | null = null, currentUserId: string) {
    if (!db) throw new Error('Database not initialized');

    let snap;
    if (singleUid) {
      const userDoc = await dbGateway.getDoc(dbGateway.doc(db, 'users', singleUid));
      snap = { docs: userDoc.exists() ? [userDoc] : [] };
    } else {
      snap = await dbGateway.getDocs(dbGateway.collection(db, 'users'));
    }

    let success = 0;
    let currentBatch = dbGateway.writeBatch(db);
    let opCount = 0;
    const fixedUsersLog: any[] = [];

    const accountTypeMap: Record<string, string> = {
      siswa: 'student',
      orang_tua: 'parent',
      guru: 'teacher',
      staf: 'staff',
      staff: 'staff',
      admin: 'admin',
      kepala_tu: 'staff',
      kepala_madrasah: 'management',
      developer: 'developer',
    };

    for (const docSnap of snap.docs as any[]) {
      const data = docSnap.data();
      const docId = docSnap.id;
      const tenantId = data.tenantId || '30315537';
      const roleLower = typeof data.role === 'string' ? data.role.toLowerCase() : '';

      let targetId = '';
      let newDataToUpdate: any = {};
      newDataToUpdate.status = 'Active';

      const isStudent = roleLower.includes('siswa') || roleLower.includes('kelas');
      const isTeacher = roleLower.includes('guru') || roleLower.includes('staf') || roleLower.includes('staff');

      if (isStudent && data.email) {
        targetId = await this.findTargetIdByEmail(tenantId, data.email, true);
        if (targetId) {
          newDataToUpdate = {
            referenceId: targetId,
            studentsId: targetId,
            role: 'Siswa',
            accountType: 'student',
          };
        }
      } else if (isTeacher && data.email) {
        targetId = await this.findTargetIdByEmail(tenantId, data.email, false);
        if (targetId) {
          newDataToUpdate = {
            referenceId: targetId,
            teachersId: targetId,
            role: roleLower.includes('staf') ? 'Staff' : 'Guru',
            accountType: 'teacher',
          };
        }
      }

      if (!targetId) {
        const masterRefs = await this.fetchMasterReferences();
        const newData = transformDocData(data, docId, masterRefs);
        const needsUpdate =
          JSON.stringify(data.roles) !== JSON.stringify(newData.roles) ||
          data.accountType !== newData.accountType ||
          data.referenceId !== newData.referenceId ||
          data.uid !== newData.uid;

        if (needsUpdate) {
          newDataToUpdate = {
            uid: newData.uid,
            roles: newData.roles,
            accountType: newData.accountType,
            referenceId: newData.referenceId,
          };
        }
      }

      if (Object.keys(newDataToUpdate).length > 1) { // more than just status
        newDataToUpdate.updatedAt = new Date().toISOString();
        currentBatch.update(dbGateway.doc(db, 'users', docId), newDataToUpdate);
        opCount++;
        success++;

        if (newDataToUpdate.referenceId) {
          fixedUsersLog.push({
            uid: data.uid || docId,
            name: data.displayName || data.name || 'Unknown',
            oldRole: data.role || 'N/A',
            newRole: newDataToUpdate.role || data.role,
            refId: newDataToUpdate.referenceId,
          });
        }

        if (opCount >= 400) {
          await currentBatch.commit();
          currentBatch = dbGateway.writeBatch(db);
          opCount = 0;
        }
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }

    await this.createAuditLog(currentUserId, 'schema_autofix_ref', {
      affectedDocuments: success,
      migrationId: `autofix_${Date.now()}`,
    });

    return { success, fixedUsersLog };
  },

  async checkDeveloperMigrationStatus(uid: string) {
    if (!db) return false;
    try {
      const markerRef = dbGateway.doc(db, 'system_migrations', 'user_developer_migration_v2');
      const markerSnap = await dbGateway.getDoc(markerRef);
      return markerSnap.exists() && markerSnap.data()?.executed;
    } catch (e) {
      return false;
    }
  },

  async runDeveloperMigration(uid: string, currentEmail: string) {
    if (!db) throw new Error('Database not initialized');

    let beforeData: any = { email: currentEmail, role: 'staf', tenantId: '30315537' };
    try {
      const userRef = dbGateway.doc(db, 'users', uid);
      const userSnap = await dbGateway.getDoc(userRef);
      if (userSnap.exists()) {
        beforeData = userSnap.data();
      }
    } catch (e) {
      // ignore
    }

    const afterData = {
      uid,
      schemaVersion: 2,
      accountType: 'developer',
      role: 'developer',
      roles: ['developer'],
      tenantId: 'global',
      status: 'aktif',
      scope: {
        level: 'global',
      },
      profile: {
        email: currentEmail,
        displayName: beforeData.displayName || 'TATA USAHA',
        photoURL: beforeData.photoURL || 'https://lh3.googleusercontent.com/a/ACg8ocLx2rBcSAXq8Qj1',
      },
      permissions: [
        'system.manage',
        'user.manage',
        'migration.execute',
        'architecture.manage',
        'audit.view',
      ],
      legacy: {
        oldRole: beforeData.role || 'staf',
        oldTenantId: beforeData.tenantId || '30315537',
        studentsId: beforeData.studentsId || '',
        idUnik: beforeData.idUnik || '',
      },
      updatedAt: Date.now(),
    };

    await dbGateway.setDoc(dbGateway.doc(db, 'users', uid), afterData, { merge: true });
    await dbGateway.setDoc(dbGateway.doc(db, 'system_migrations', 'user_developer_migration_v2'), {
      executed: true,
      executedAt: Date.now(),
      executedBy: uid,
    });

    return afterData;
  },
};
