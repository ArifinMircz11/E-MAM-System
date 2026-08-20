import { CanonicalUser } from '../domain/CanonicalUser';
import { validateCanonicalUser } from '../domain/CanonicalValidation';

export class CanonicalUserMapperException extends Error {
  constructor(message: string) {
    super(`[CanonicalUserMapperException] ${message}`);
    this.name = 'CanonicalUserMapperException';
  }
}

export class CanonicalUserMapper {
  /**
   * Strictly enforces explicit tenantId without silent fallbacks.
   */
  static requireTenantId(tenantId?: string | null): string {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '' || tenantId === 'unknown' || tenantId === 'default') {
      throw new CanonicalUserMapperException(
        `Invalid or missing explicit tenantId: "${tenantId}". Fallback tenant is strictly forbidden.`
      );
    }
    return tenantId.trim();
  }

  static toCanonical(data: any): CanonicalUser {
    if (!data) {
      throw new CanonicalUserMapperException('Cannot map null or undefined data to CanonicalUser.');
    }

    const tenantId = this.requireTenantId(data.tenantId);

    const canonical: CanonicalUser = {
      id: data.id || data.uid,
      uid: data.uid || data.id,
      email: data.email || '',
      displayName: data.displayName || data.namaLengkap || '',
      accountType: data.accountType || 'user',
      role: data.role || data.peran || 'user',
      roles: Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : [data.role || data.peran || 'user'],
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      referenceId: data.referenceId || data.studentsId || data.teachersId || null,
      studentsId: data.studentsId || null,
      teachersId: data.teachersId || null,
      walasOfClass: data.walasOfClass || null,
      tenantId,
      status: data.status || 'active',
      syncStatus: data.syncStatus || 'synced',
      profile: data.profile,
      assignment: data.assignment,
      scope: data.scope,
      metadata: data.metadata,
      version: typeof data.version === 'number' ? data.version : 1,
      schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : 1,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      deleted: Boolean(data.deleted),
      deletedAt: data.deletedAt,
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
