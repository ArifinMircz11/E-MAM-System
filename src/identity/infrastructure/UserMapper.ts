import { CanonicalUser } from '../domain/CanonicalUser';

/**
 * UserMapper - Maps raw data to CanonicalUser.
 */
export class UserMapper {
  static toCanonical(data: any): CanonicalUser {
    return {
      id: data.id,
      uid: data.uid,
      email: data.email || '',
      displayName: data.displayName || '',
      accountType: data.accountType,
      role: data.role,
      roles: data.roles || [],
      permissions: data.permissions || [],
      referenceId: data.referenceId || data.uid || data.id,
      isClaimed: Boolean(data.isClaimed),
      isSso: Boolean(data.isSso),
      approvalStatus: data.approvalStatus || 'approved',
      tenantId: data.tenantId,
      status: data.status,
      profile: data.profile,
      metadata: data.metadata,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      syncStatus: data.syncStatus || 'synced',
      version: data.version || 1,
      schemaVersion: data.schemaVersion || 1,
      deleted: data.deleted || false,
    };
  }
}




