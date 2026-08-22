import { localDb } from '../database/dexie';
import { auditLog } from './auditLogService';
import { syncRepository } from '@/repositories/SyncRepository';

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
      referenceId: referenceId,
      [idField]: referenceId,
      isClaimed: true,
      status: 'active',
      accountStatus: 'active',
      tenantId: tenantId,
      updatedAt: now
    });

    // 4. Add to Sync Queue for record
    await syncRepository.enqueue({
      tenantId,
      collection: type === 'student' ? 'students' : 'teachers',
      recordId: referenceId,
      operation: 'update',
      payload: { userId, linked: true, isClaimed: true, linkedAt: now, updatedAt: now, tenantId },
    });

    // 5. Add to Sync Queue for user
    await syncRepository.enqueue({
      tenantId,
      collection: 'users',
      recordId: userId,
      operation: 'update',
      payload: { referenceId, [idField]: referenceId, isClaimed: true, status: 'active', tenantId, updatedAt: now },
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
