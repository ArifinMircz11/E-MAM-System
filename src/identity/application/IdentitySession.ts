import type { CanonicalUser } from '@/identity/domain/CanonicalUser';

/**
 * Runtime identity boundary for the authenticated application.
 *
 * Authentication answers "who authenticated?"; this context answers
 * "which canonical application identity is allowed to operate?".
 *
 * It deliberately contains no Firebase or Firestore dependency. Operational
 * services must consume this boundary rather than reaching into Firebase Auth.
 */
export interface IdentitySession {
  uid: string;
  tenantId: string;
  role: CanonicalUser['role'];
  roles: CanonicalUser['roles'];
  accountType: CanonicalUser['accountType'];
  approvalStatus: CanonicalUser['approvalStatus'];
  status: CanonicalUser['status'];
  referenceId: CanonicalUser['referenceId'];
  user: CanonicalUser;
}

let currentSession: IdentitySession | null = null;

function assertCanonicalUser(user: CanonicalUser): void {
  if (!user.uid) throw new Error('Identity session rejected: uid is required');
  if (!user.tenantId) throw new Error('Identity session rejected: tenantId is required');
  if (!user.role) throw new Error('Identity session rejected: role is required');
  if (!Array.isArray(user.roles)) throw new Error('Identity session rejected: roles are required');
  if (user.approvalStatus !== 'approved') {
    throw new Error(`Identity session rejected: approvalStatus=${user.approvalStatus}`);
  }
  if (user.status !== 'active') {
    throw new Error(`Identity session rejected: status=${user.status}`);
  }
  if (user.deleted) throw new Error('Identity session rejected: user is deleted');
}

export const IdentitySessionService = {
  establish(user: CanonicalUser): IdentitySession {
    assertCanonicalUser(user);

    currentSession = {
      uid: user.uid,
      tenantId: user.tenantId,
      role: user.role,
      roles: [...user.roles],
      accountType: user.accountType,
      approvalStatus: user.approvalStatus,
      status: user.status,
      referenceId: user.referenceId,
      user,
    };

    return currentSession;
  },

  get(): IdentitySession | null {
    return currentSession;
  },

  require(): IdentitySession {
    if (!currentSession) throw new Error('No authenticated canonical identity session');
    return currentSession;
  },

  clear(): void {
    currentSession = null;
  },
};
