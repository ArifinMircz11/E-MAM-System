import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';

export class UserRelationRepository {
  async reconcileStudentRelation(uid: string, tenantId: string): Promise<CanonicalUser | null> {
    const context = getSecurityContext(false);
    if (!context?.uid || !context.tenantId) throw new Error('USER_SYNC_SECURITY_CONTEXT_INVALID');
    ArchitectureBoundaryEnforcer.enforceTenantAccess(context.tenantId, tenantId, 'user_relation_sync', context.isDeveloper);

    const user = await localDb.users.get(uid) as CanonicalUser | undefined;
    if (!user || user.tenantId !== tenantId) return null;
    const role = String(user.role || user.accountType || '').toLowerCase();
    if (!['siswa', 'ketua_kelas', 'student'].includes(role)) return user;

    const student = await localDb.students
      .where('tenantId').equals(tenantId)
      .filter((row: any) => row.sistemJangkar?.userId === uid)
      .first();
    if (!student) return user;

    const actualStudentId = student.studentsId || student.id;
    const currentRefId = (user as any).studentsId || (user as any).referenceId;
    if (!actualStudentId || currentRefId === actualStudentId) return user;

    const updated = {
      ...user,
      studentsId: actualStudentId,
      studentId: actualStudentId,
      referenceId: actualStudentId,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    } as CanonicalUser;

    await localDb.transaction('rw', [localDb.users, localDb.sync_queue], async () => {
      await localDb.users.put(updated);
      await syncRepository.enqueue({
        tenantId,
        collection: 'users',
        recordId: uid,
        operation: 'update',
        payload: updated,
      }, context, { triggerSync: false, db: localDb });
    });

    return updated;
  }
}

export const userRelationRepository = new UserRelationRepository();
