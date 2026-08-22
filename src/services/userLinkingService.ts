import { localDb } from '../database/dexie';
import { auditLog } from './auditLogService';
import { syncRepository } from '@/repositories/SyncRepository';

export const userLinkingService = {
  async linkUserToReferenceId(userId: string, referenceId: string, type: 'student' | 'teacher'): Promise<any> {
    const table = type === 'student' ? localDb.students : localDb.teachers;
    const idField = type === 'student' ? 'studentsId' : 'teachersId';

    const record = await table.get(referenceId);
    if (!record) {
      throw new Error(`${type === 'teacher' ? 'ID Guru/NIP' : 'ID Siswa/NISN'} tidak ditemukan di data lokal. Pastikan sinkronisasi data master sudah selesai.`);
    }
    if (record.userId && record.userId !== userId) {
      throw new Error('ID ini sudah terhubung dengan akun lain. Silakan hubungi admin.');
    }

    const tenantId = record.tenantId || 'default';
    const now = new Date().toISOString();
    const userRecord = await localDb.users.get(userId);
    if (userRecord && userRecord.tenantId && userRecord.tenantId !== tenantId) {
      throw new Error(`Pelanggaran batas tenant: Akun pengguna (${userRecord.tenantId}) berbeda dengan data master (${tenantId}).`);
    }

    await table.update(referenceId, { userId, linked: true, isClaimed: true, linkedAt: now, updatedAt: now });
    await localDb.users.update(userId, {
      referenceId: referenceId,
      [idField]: referenceId,
      isClaimed: true,
      status: 'active',
      accountStatus: 'active',
      tenantId,
      updatedAt: now,
    });

    await syncRepository.enqueue({
      tenantId,
      collection: type === 'student' ? 'students' : 'teachers',
      recordId: referenceId,
      operation: 'update',
      payload: { userId, linked: true, isClaimed: true, linkedAt: now, updatedAt: now, tenantId },
    });

    await syncRepository.enqueue({
      tenantId,
      collection: 'users',
      recordId: userId,
      operation: 'update',
      payload: { referenceId, [idField]: referenceId, isClaimed: true, status: 'active', tenantId, updatedAt: now },
    });

    await auditLog({
      action: type === 'teacher' ? 'MANUAL_LINK_TEACHER' : 'MANUAL_LINK_STUDENT',
      userId,
      tenantId,
      metadata: { referenceId, type },
    });

    return { success: true, userId, referenceId, tenantId };
  },
};
