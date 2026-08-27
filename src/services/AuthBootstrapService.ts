import { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { UserRole, AccountType } from '@/types/roles';

export interface AuthBootstrapResult {
  user: CanonicalUser;
  userData: {
    uid: string;
    roles: UserRole[];
    displayName: string;
    photoURL: string | null;
    tenantId: string;
    assignment: {
      studentId: string | null;
      teacherId: string | null;
      classId: string | null;
    };
  };
  accountStatus: string;
  profile: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
  };
}

/**
 * Auth bootstrap is an identity adapter only.
 * It never invents tenant, role, referenceId, permission, or profile values.
 * Canonical authorization data must come from the authenticated identity claims.
 */
export class AuthBootstrapService {
  static async initialize(firebaseUser: any): Promise<AuthBootstrapResult> {
    if (!firebaseUser?.uid) {
      throw new Error('AUTH_UID_MISSING');
    }

    const tokenResult = typeof firebaseUser.getIdTokenResult === 'function'
      ? await firebaseUser.getIdTokenResult()
      : null;
    const claims = tokenResult?.claims ?? {};

    const uid = String(firebaseUser.uid);
    const tenantId = typeof claims.tenantId === 'string' ? claims.tenantId.trim() : '';
    const rawRole = typeof claims.role === 'string' ? claims.role.trim() : '';
    const rawRoles = Array.isArray(claims.roles) ? claims.roles : [];
    const roles = Array.from(new Set(
      [rawRole, ...rawRoles]
        .map((role) => String(role).trim().toLowerCase())
        .filter(Boolean),
    )) as UserRole[];
    const referenceId = typeof claims.referenceId === 'string' && claims.referenceId.trim()
      ? claims.referenceId.trim()
      : null;
    const accountType = typeof claims.accountType === 'string'
      ? claims.accountType.trim().toLowerCase()
      : '';
    const permissions = Array.isArray(claims.permissions)
      ? claims.permissions.map((permission: unknown) => String(permission).trim()).filter(Boolean)
      : [];

    if (!tenantId) throw new Error('CANONICAL_TENANT_ID_MISSING');
    if (!roles.length) throw new Error('CANONICAL_ROLE_MISSING');
    if (!accountType || !Object.values(AccountType).includes(accountType as AccountType)) {
      throw new Error('CANONICAL_ACCOUNT_TYPE_INVALID');
    }

    const role = roles[0];
    const displayName = String(firebaseUser.displayName || firebaseUser.email || uid).trim();
    const email = String(firebaseUser.email || '').trim();
    const now = Date.now();

    const user: CanonicalUser = {
      id: uid,
      uid,
      tenantId,
      accountType: accountType as AccountType,
      role,
      roles,
      permissions,
      referenceId,
      isClaimed: true,
      isSso: Boolean(claims.isSso),
      approvalStatus: claims.approvalStatus === 'pending' || claims.approvalStatus === 'rejected'
        ? claims.approvalStatus
        : 'approved',
      email,
      displayName,
      photoURL: firebaseUser.photoURL || null,
      status: claims.status === 'inactive' || claims.status === 'suspended' || claims.status === 'pending'
        ? claims.status
        : 'active',
      syncStatus: 'synced',
      version: Number.isFinite(claims.version) ? Number(claims.version) : 1,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };

    const userData = {
      uid,
      roles,
      displayName,
      photoURL: firebaseUser.photoURL || null,
      tenantId,
      assignment: {
        studentId: claims.studentId || null,
        teacherId: claims.teacherId || null,
        classId: claims.classId || null,
      },
    };

    return {
      user,
      userData,
      accountStatus: user.status,
      profile: {
        id: user.id,
        name: user.displayName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
