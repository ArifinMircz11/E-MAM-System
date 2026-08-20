import { localDb } from '../database/dexie';
import { auditLog } from './auditLogService';

export const userLinkingService = {
  async linkUserToReferenceId(userId: string, referenceId: string, type: 'student' | 'teacher'): Promise<any> {
    const table = type === 'student' ? localDb.students : localDb.teachers;
    const idField = type === 'student' ? 'studentsId' : 'teachersId';

    // 1. Find record in Dexie
    const record = await table.get(referenceId);
    if (!record) {
      throw new Error(`${type === 'teacher' ? 'ID Guru/NIP' : 'ID Siswa/NISN'} tidak ditemukan di data lokal. Pastikan sinkronisasi data master sudah selesai.`);
    }

    if (record.userId && record.userId !== userId) {
      throw new Error('ID ini sudah terhubung dengan akun lain. Silakan hubungi admin.');
    }

    const tenantId = record.tenantId || 'default';
    const now = new Date().toISOString();

    // Check user tenant boundary
    const userRecord = await localDb.users.get(userId);
    if (userRecord && userRecord.tenantId && userRecord.tenantId !== tenantId) {
      throw new Error(`Pelanggaran batas tenant: Akun pengguna (${userRecord.tenantId}) berbeda dengan data master (${tenantId}).`);
    }

    // 2. Update local record
    await table.update(referenceId, {
      userId: userId,
      linked: true,
      isClaimed: true,
      linkedAt: now,
      updatedAt: now
    });

    // 3. Update user profile in Dexie
    await localDb.users.update(userId, {
      referenceId: referenceId, // Strict contract requirement
      [idField]: referenceId,
      isClaimed: true,
      status: 'active',
      accountStatus: 'active',
      tenantId: tenantId,
      updatedAt: now
    });

    // 4. Add to Sync Queue for record
    await localDb.sync_queue.add({
      id: crypto.randomUUID(),
      tenantId,
      collection: type === 'student' ? 'students' : 'teachers',
      documentId: referenceId,
      operation: 'update',
      payload: { userId, linked: true, isClaimed: true, linkedAt: now, updatedAt: now },
      status: 'pending',
      priority: 1,
      createdAt: now,
      retryCount: 0,
      deviceId: 'unknown'
    });

    // 5. Add to Sync Queue for user
    await localDb.sync_queue.add({
      id: crypto.randomUUID(),
      tenantId,
      collection: 'users',
      documentId: userId,
      operation: 'update',
      payload: { referenceId, [idField]: referenceId, isClaimed: true, status: 'active', tenantId, updatedAt: now },
      status: 'pending',
      priority: 1,
      createdAt: now,
      retryCount: 0,
      deviceId: 'unknown'
    });

    // 6. Audit Log
    await auditLog({
      action: type === 'teacher' ? 'MANUAL_LINK_TEACHER' : 'MANUAL_LINK_STUDENT',
      category: 'USER',
      details: `Linked user ${userId} to ${type} ${referenceId}`,
      schoolId: tenantId
    });

    return record;
  }
};
