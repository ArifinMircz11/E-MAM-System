import { localDb } from '../database/dexie';
import { auditLog } from './auditLogService';
import { syncRepository } from '@/repositories/SyncRepository';
import { SecurityContextService } from '@/core/security/SecurityContextService';

export const userLinkingService = {
  async linkUserToReferenceId(userId: string, referenceId: string, type: 'student' | 'teacher'): Promise<any> {
    const context = SecurityContextService.getContext();
    if (!SecurityContextService.isReady() || context.uid !== userId) throw new Error('SECURITY_CONTEXT_INVALID');
    const tenantId = SecurityContextService.requireActiveTenantId();
    const table = type === 'student' ? localDb.students : localDb.teachers;
    const idField = type === 'student' ? 'studentsId' : 'teachersId';
    const record = await table.get(referenceId);
    if (!record) throw new Error(`${type === 'teacher' ? 'ID Guru/NIP' : 'ID Siswa/NISN'} tidak ditemukan di data lokal. Pastikan sinkronisasi data master sudah selesai.`);
    if (record.userId && record.userId !== userId) throw new Error('ID ini sudah terhubung dengan akun lain. Silakan hubungi admin.');
    if (!record.tenantId || record.tenantId !== tenantId) throw new Error(`Pelanggaran batas tenant: konteks '${tenantId}' berbeda dengan data master '${record.tenantId || 'missing'}'.`);
    const now = new Date().toISOString();
    const userRecord = await localDb.users.get(userId);
    if (!userRecord?.tenantId || userRecord.tenantId !== tenantId) throw new Error('User lokal tidak memiliki tenant canonical yang sesuai SecurityContext.');

    await table.update(referenceId, { userId, linked: true, isClaimed: true, linkedAt: now, updatedAt: now });
    await localDb.users.update(userId, { referenceId, [idField]: referenceId, isClaimed: true, status: 'active', accountStatus: 'active', tenantId, updatedAt: now });
    await syncRepository.enqueue({ tenantId, collection: type === 'student' ? 'students' : 'teachers', recordId: referenceId, operation: 'update', payload: { userId, linked: true, isClaimed: true, linkedAt: now, updatedAt: now, tenantId } });
    await syncRepository.enqueue({ tenantId, collection: 'users', recordId: userId, operation: 'update', payload: { referenceId, [idField]: referenceId, isClaimed: true, status: 'active', tenantId, updatedAt: now } });
    await auditLog({ action: type === 'teacher' ? 'MANUAL_LINK_TEACHER' : 'MANUAL_LINK_STUDENT', category: 'USER', details: `Linked user ${userId} to ${type} ${referenceId}`, schoolId: tenantId });
    return record;
  }
};
