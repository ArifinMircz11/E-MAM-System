import { CanonicalUser } from '../domain/CanonicalUser';
import { AccountType, UserRole } from '@/types/roles';
import { validateCanonicalUser } from '../domain/CanonicalValidation';

export class CanonicalUserMapperException extends Error {
  constructor(message: string) {
    super(`[CanonicalUserMapperException] ${message}`);
    this.name = 'CanonicalUserMapperException';
  }
}

type ReferenceResolution = {
  referenceId: string;
  studentsId: string | null;
  teachersId: string | null;
  entityType: CanonicalUser['entityType'];
};

const STUDENT_ROLES = new Set<UserRole>([UserRole.SISWA, UserRole.KETUA_KELAS]);
const TEACHER_ROLES = new Set<UserRole>([
  UserRole.GURU,
  UserRole.WALI_KELAS,
  UserRole.GURU_BK,
  UserRole.GTK,
  UserRole.KEPALA_MADRASAH,
]);

export class CanonicalUserMapper {
  static requireTenantId(tenantId?: string | null): string {
    if (
      !tenantId ||
      typeof tenantId !== 'string' ||
      tenantId.trim() === '' ||
      tenantId === 'unknown' ||
      tenantId === 'default'
    ) {
      throw new CanonicalUserMapperException(
        `Invalid or missing explicit tenantId: "${tenantId}". Fallback tenant is strictly forbidden.`
      );
    }

    return tenantId.trim();
  }

  private static normalizeRole(value: unknown): UserRole {
    const raw = String(value ?? '').toLowerCase().trim();
    const match = Object.values(UserRole).find((role) => role === raw);
    if (!match) {
      throw new CanonicalUserMapperException(
        `Invalid canonical UserRole: "${value}".`
      );
    }
    return match;
  }

  private static stableIdentityReference(data: any, uid: string): string {
    return String(data.uid || data.id || data.firebaseUid || data.email || uid).trim();
  }

  private static resolveReference(data: any, role: UserRole, uid: string): ReferenceResolution {
    const stableIdentityRef = this.stableIdentityReference(data, uid);
    const studentsId = typeof data.studentsId === 'string' && data.studentsId.trim() !== ''
      ? data.studentsId.trim()
      : null;
    const teachersId = typeof data.teachersId === 'string' && data.teachersId.trim() !== ''
      ? data.teachersId.trim()
      : null;

    if (STUDENT_ROLES.has(role)) {
      return {
        referenceId: studentsId || stableIdentityRef,
        studentsId,
        teachersId: null,
        entityType: 'student',
      };
    }

    if (TEACHER_ROLES.has(role)) {
      return {
        referenceId: teachersId || stableIdentityRef,
        studentsId: null,
        teachersId,
        entityType: 'teacher',
      };
    }

    return {
      referenceId: typeof data.referenceId === 'string' && data.referenceId.trim() !== ''
        ? data.referenceId.trim()
        : stableIdentityRef,
      studentsId: null,
      teachersId: null,
      entityType: data.entityType || null,
    };
  }

  static toCanonical(data: any): CanonicalUser {
    if (!data) {
      throw new CanonicalUserMapperException(
        'Cannot map null or undefined data to CanonicalUser.'
      );
    }

    const tenantId = this.requireTenantId(data.tenantId);
    const uid = data.uid || data.id;

    if (!uid) {
      throw new CanonicalUserMapperException(
        'CanonicalUser requires a stable uid.'
      );
    }

    const role = this.normalizeRole(data.role || data.peran);
    const roles =
      Array.isArray(data.roles) && data.roles.length > 0
        ? data.roles.map((item: unknown) => this.normalizeRole(item))
        : [role];

    const reference = this.resolveReference(data, role, uid);

    const canonical: CanonicalUser = {
      id: data.id || uid,
      uid,
      tenantId,
      accountType:
        data.accountType === AccountType.DEVELOPER
          ? AccountType.DEVELOPER
          : AccountType.MADRASAH,
      role,
      roles: Array.from(new Set(roles.includes(role) ? roles : [role, ...roles])),
      referenceId: reference.referenceId,
      isClaimed:
        typeof data.isClaimed === 'boolean' ? data.isClaimed : true,
      isSso: Boolean(data.isSso),
      approvalStatus:
        data.approvalStatus === 'pending' || data.approvalStatus === 'rejected'
          ? data.approvalStatus
          : 'approved',
      email: data.email || '',
      displayName:
        data.displayName ||
        data.namaLengkap ||
        data.namaTampilan ||
        '',
      photoURL: data.photoURL || null,
      phone: data.phone,
      phoneNumber: data.phoneNumber,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      studentsId: reference.studentsId,
      teachersId: reference.teachersId,
      walasOfClass: data.walasOfClass || null,
      entityType: reference.entityType,
      targetRombel: data.targetRombel || null,
      tingkatRombel: data.tingkatRombel || null,
      class: data.class || null,
      status: data.status || 'active',
      syncStatus: data.syncStatus || 'synced',
      rbacVersion:
        typeof data.rbacVersion === 'number' ? data.rbacVersion : 1,
      securityVersion:
        typeof data.securityVersion === 'number' ? data.securityVersion : 1,
      scopeType: data.scopeType,
      scopeId: data.scopeId,
      profile: data.profile,
      assignment: data.assignment,
      scope: data.scope,
      metadata: data.metadata,
      isActive:
        typeof data.isActive === 'boolean'
          ? data.isActive
          : data.status !== 'inactive',
      version: typeof data.version === 'number' ? data.version : 1,
      schemaVersion:
        typeof data.schemaVersion === 'number' ? data.schemaVersion : 2,
      createdAt:
        typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt:
        typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      createdBy: data.createdBy || null,
      updatedBy: data.updatedBy || null,
      lastLoginAt: typeof data.lastLoginAt === 'number' ? data.lastLoginAt : data.metadata?.lastLoginAt || null,
      deleted: Boolean(data.deleted),
      deletedAt: data.deletedAt,
      peran: data.peran,
      idUnik: data.idUnik,
      nisn: data.nisn,
      nik: data.nik,
      nip: data.nip,
    };

    const validation = validateCanonicalUser(canonical);

    if (!validation.valid) {
      throw new CanonicalUserMapperException(
        `CanonicalUser validation failed. Missing required fields: ${validation.missing.join(', ')}`
      );
    }

    return canonical;
  }
}
