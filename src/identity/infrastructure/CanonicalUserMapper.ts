import { CanonicalUser } from '../domain/CanonicalUser';
import { AccountType } from '@/types/roles';
import { validateCanonicalUser } from '../domain/CanonicalValidation';

export class CanonicalUserMapperException extends Error {
  constructor(message: string) {
    super(`[CanonicalUserMapperException] ${message}`);
    this.name = 'CanonicalUserMapperException';
  }
}

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

    const role = data.role || data.peran || 'staf';
    const roles =
      Array.isArray(data.roles) && data.roles.length > 0
        ? data.roles
        : [role];

    const referenceId =
      data.referenceId ||
      data.studentsId ||
      data.teachersId ||
      uid;

    const canonical: CanonicalUser = {
      id: data.id || uid,
      uid,

      tenantId,

      accountType:
        data.accountType === AccountType.DEVELOPER
          ? AccountType.DEVELOPER
          : AccountType.MADRASAH,

      role,
      roles,

      referenceId,

      isClaimed:
        typeof data.isClaimed === 'boolean'
          ? data.isClaimed
          : true,

      isSso: Boolean(data.isSso),

      approvalStatus:
        data.approvalStatus === 'pending' ||
        data.approvalStatus === 'rejected'
          ? data.approvalStatus
          : 'approved',

      email: data.email || '',
      displayName:
        data.displayName ||
        data.namaLengkap ||
        data.namaTampilan ||
        '',

      photoURL: data.photoURL || null,
      phoneNumber: data.phoneNumber,

      permissions: Array.isArray(data.permissions)
        ? data.permissions
        : [],

      studentsId: data.studentsId || null,
      teachersId: data.teachersId || null,
      walasOfClass: data.walasOfClass || null,

      status: data.status || 'active',
      syncStatus: data.syncStatus || 'synced',

      rbacVersion:
        typeof data.rbacVersion === 'number'
          ? data.rbacVersion
          : 1,

      securityVersion:
        typeof data.securityVersion === 'number'
          ? data.securityVersion
          : 1,

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

      version:
        typeof data.version === 'number'
          ? data.version
          : 1,

      schemaVersion:
        typeof data.schemaVersion === 'number'
          ? data.schemaVersion
          : 2,

      createdAt:
        typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),

      updatedAt:
        typeof data.updatedAt === 'number'
          ? data.updatedAt
          : Date.now(),

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
