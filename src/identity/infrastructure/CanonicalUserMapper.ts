import { CanonicalUser } from '../domain/CanonicalUser';
import { AccountType, UserRole } from '@/types/roles';
import { validateCanonicalUser } from '../domain/CanonicalValidation';

export class CanonicalUserMapperException extends Error {
  constructor(message: string) {
    super(`[CanonicalUserMapperException] ${message}`);
    this.name = 'CanonicalUserMapperException';
  }
}

type ReferenceResolution = { referenceId: string; studentsId: string | null; teachersId: string | null; entityType: CanonicalUser['entityType'] };
const STUDENT_ROLES = new Set<UserRole>([UserRole.SISWA, UserRole.KETUA_KELAS]);
const TEACHER_ROLES = new Set<UserRole>([UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK, UserRole.GTK, UserRole.KEPALA_MADRASAH]);

export class CanonicalUserMapper {
  static requireTenantId(tenantId?: string | null): string {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '' || ['unknown', 'default', 'global'].includes(tenantId)) {
      throw new CanonicalUserMapperException(`Invalid or missing explicit tenantId: "${tenantId}". Fallback tenant is strictly forbidden.`);
    }
    return tenantId.trim();
  }

  private static normalizeRole(value: unknown): UserRole {
    const raw = String(value ?? '').toLowerCase().trim();
    const match = Object.values(UserRole).find((role) => role === raw);
    if (!match) throw new CanonicalUserMapperException(`Invalid canonical UserRole: "${value}".`);
    return match;
  }

  private static requireReferenceId(data: any, role: UserRole): ReferenceResolution {
    const explicitReference = typeof data.referenceId === 'string' && data.referenceId.trim() ? data.referenceId.trim() : null;
    const studentsId = typeof data.studentsId === 'string' && data.studentsId.trim() ? data.studentsId.trim() : null;
    const teachersId = typeof data.teachersId === 'string' && data.teachersId.trim() ? data.teachersId.trim() : null;
    if (STUDENT_ROLES.has(role)) {
      const referenceId = explicitReference || studentsId;
      if (!referenceId) throw new CanonicalUserMapperException('Student identity requires explicit referenceId/studentsId. UID fallback is forbidden.');
      return { referenceId, studentsId, teachersId: null, entityType: 'student' };
    }
    if (TEACHER_ROLES.has(role)) {
      const referenceId = explicitReference || teachersId;
      if (!referenceId) throw new CanonicalUserMapperException('Teacher identity requires explicit referenceId/teachersId. UID fallback is forbidden.');
      return { referenceId, studentsId: null, teachersId, entityType: 'teacher' };
    }
    if (!explicitReference) throw new CanonicalUserMapperException('Organization identity requires explicit referenceId. UID/email fallback is forbidden.');
    return { referenceId: explicitReference, studentsId: null, teachersId: null, entityType: data.entityType || null };
  }

  static toCanonical(data: any): CanonicalUser {
    if (!data) throw new CanonicalUserMapperException('Cannot map null or undefined data to CanonicalUser.');
    const tenantId = this.requireTenantId(data.tenantId);
    const uid = typeof data.uid === 'string' && data.uid.trim() ? data.uid.trim() : (typeof data.id === 'string' && data.id.trim() ? data.id.trim() : '');
    if (!uid) throw new CanonicalUserMapperException('CanonicalUser requires a stable uid.');
    if (!data.accountType || !Object.values(AccountType).includes(data.accountType)) throw new CanonicalUserMapperException(`CanonicalUser requires an explicit valid accountType: "${data.accountType}".`);
    const role = this.normalizeRole(data.role || data.peran);
    const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles.map((item: unknown) => this.normalizeRole(item)) : [role];
    const reference = this.requireReferenceId(data, role);
    const canonical: CanonicalUser = {
      id: data.id || uid, uid, tenantId, accountType: data.accountType, role,
      roles: Array.from(new Set(roles.includes(role) ? roles : [role, ...roles])), referenceId: reference.referenceId,
      isClaimed: typeof data.isClaimed === 'boolean' ? data.isClaimed : true, isSso: Boolean(data.isSso),
      approvalStatus: data.approvalStatus === 'pending' || data.approvalStatus === 'rejected' ? data.approvalStatus : 'approved',
      email: data.email || '', displayName: data.displayName || data.namaLengkap || data.namaTampilan || '', photoURL: data.photoURL || null,
      phone: data.phone, phoneNumber: data.phoneNumber, permissions: Array.isArray(data.permissions) ? data.permissions : [],
      studentsId: reference.studentsId, teachersId: reference.teachersId, walasOfClass: data.walasOfClass || null, entityType: reference.entityType,
      targetRombel: data.targetRombel || null, tingkatRombel: data.tingkatRombel || null, class: data.class || null,
      status: data.status || 'active', syncStatus: data.syncStatus || 'synced', rbacVersion: typeof data.rbacVersion === 'number' ? data.rbacVersion : 1,
      securityVersion: typeof data.securityVersion === 'number' ? data.securityVersion : 1, scopeType: data.scopeType, scopeId: data.scopeId,
      profile: data.profile, assignment: data.assignment, scope: data.scope, metadata: data.metadata,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : data.status !== 'inactive', version: typeof data.version === 'number' ? data.version : 1,
      schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : 2, createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(), createdBy: data.createdBy || null, updatedBy: data.updatedBy || null,
      lastLoginAt: typeof data.lastLoginAt === 'number' ? data.lastLoginAt : data.metadata?.lastLoginAt || null, deleted: Boolean(data.deleted), deletedAt: data.deletedAt,
      peran: data.peran, idUnik: data.idUnik, nisn: data.nisn, nik: data.nik, nip: data.nip,
    };
    const validation = validateCanonicalUser(canonical);
    if (!validation.valid) throw new CanonicalUserMapperException(`CanonicalUser validation failed. Missing required fields: ${validation.missing.join(', ')}`);
    return canonical;
  }
}
