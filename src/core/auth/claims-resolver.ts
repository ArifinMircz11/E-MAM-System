import { CanonicalUser, type CanonicalAccountType } from './canonical-user';
import { localDb } from '@/database/dexie';

/**
 * CLAIMS RESOLVER
 *
 * Maps an authoritative user projection into CanonicalUser.
 * No identity is guessed: missing tenant/account/role data is rejected.
 * Legacy fields such as idUnik are intentionally ignored.
 */

export class ClaimsResolver {
  static async resolveFromLocal(uid: string): Promise<CanonicalUser | null> {
    try {
      const userDoc = await localDb.users.get(uid);
      if (!userDoc) return null;
      return this.mapToCanonical(userDoc);
    } catch (error) {
      console.error('[ClaimsResolver] Resolve from local failed:', error);
      return null;
    }
  }

  static mapToCanonical(data: any): CanonicalUser {
    const uid = this.requiredString(data?.uid || data?.id, 'uid');
    const tenantId = this.requiredString(data?.tenantId, 'tenantId');
    const referenceId = this.requiredString(data?.referenceId || uid, 'referenceId');

    const accountType = this.normalizeAccountType(data?.accountType);
    const roles = this.normalizeRoles(data?.roles, data?.role);
    const permissions = Array.isArray(data?.permissions) ? data.permissions.filter(Boolean) : [];

    const organizationType = this.normalizeOrganizationType(
      data?.organizationType,
      accountType,
    );
    const organizationId = this.requiredString(data?.organizationId || tenantId, 'organizationId');

    const scopes = Array.isArray(data?.scopes) && data.scopes.length > 0
      ? data.scopes
          .filter((scope: any) => scope && typeof scope.id === 'string' && typeof scope.type === 'string')
          .map((scope: any) => ({ type: scope.type, id: scope.id }))
      : [{ type: organizationType, id: organizationId }];

    const status = this.normalizeStatus(data?.status);

    return {
      uid,
      referenceId,
      tenantId,
      organizationId,
      organizationType,
      accountType,
      roles,
      permissions,
      scopes,
      status,
      profile: {
        name: this.requiredString(data?.displayName || data?.name, 'displayName'),
        email: this.requiredString(data?.email, 'email'),
        phoneNumber: data?.phoneNumber || data?.phone || undefined,
        photoURL: data?.photoURL || undefined,
      },
      metadata: data?.metadata || {},
    };
  }

  private static requiredString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`[CanonicalUser] Missing required field: ${field}`);
    }
    return value.trim();
  }

  private static normalizeAccountType(value: unknown): CanonicalAccountType {
    const normalized = this.requiredString(value, 'accountType').toUpperCase();
    const allowed: CanonicalAccountType[] = [
      'DEVELOPER',
      'KANWIL',
      'KEMENAG',
      'MADRASAH',
      'ADMIN',
      'TEACHER',
      'STUDENT',
      'PARENT',
      'STAFF',
    ];

    if (!allowed.includes(normalized as CanonicalAccountType)) {
      throw new Error(`[CanonicalUser] Unsupported accountType: ${value}`);
    }

    return normalized as CanonicalAccountType;
  }

  private static normalizeRoles(rolesValue: unknown, roleValue: unknown): string[] {
    const roles = Array.isArray(rolesValue)
      ? rolesValue.filter((role): role is string => typeof role === 'string' && role.trim() !== '')
      : typeof roleValue === 'string' && roleValue.trim() !== ''
        ? [roleValue]
        : [];

    if (roles.length === 0) {
      throw new Error('[CanonicalUser] Missing required field: roles/role');
    }

    return [...new Set(roles.map(role => role.trim().toLowerCase()))];
  }

  private static normalizeOrganizationType(
    value: unknown,
    accountType: CanonicalAccountType,
  ): CanonicalUser['organizationType'] {
    if (typeof value === 'string' && value.trim() !== '') {
      const normalized = value.trim().toUpperCase();
      if (normalized === 'DEVELOPER' || normalized === 'KANWIL' || normalized === 'KEMENAG' || normalized === 'MADRASAH') {
        return normalized;
      }
    }

    if (accountType === 'DEVELOPER') return 'DEVELOPER';
    if (accountType === 'KANWIL') return 'KANWIL';
    if (accountType === 'KEMENAG') return 'KEMENAG';
    return 'MADRASAH';
  }

  private static normalizeStatus(value: unknown): CanonicalUser['status'] {
    const normalized = this.requiredString(value, 'status').toUpperCase();
    if (normalized === 'ACTIVE' || normalized === 'INACTIVE' || normalized === 'PENDING' || normalized === 'DELETED') {
      return normalized;
    }
    throw new Error(`[CanonicalUser] Unsupported status: ${value}`);
  }
}
