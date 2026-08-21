/**
 * CANONICAL USER MODEL (Auth Projection)
 *
 * Canonical session identity. Firebase UID identifies the account;
 * referenceId identifies the domain identity. Legacy identity fields such as
 * idUnik are never part of this contract.
 */

export interface Scope {
  type: 'GLOBAL' | 'KANWIL' | 'KEMENAG' | 'MADRASAH';
  id: string;
}

export type CanonicalAccountType =
  | 'DEVELOPER'
  | 'KANWIL'
  | 'KEMENAG'
  | 'MADRASAH'
  | 'ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'STAFF';

export interface CanonicalUser {
  /** Firebase authentication identity. */
  uid: string;

  /** Domain identity reference. Never derived from idUnik/studentsId/studentId. */
  referenceId: string;

  /** Current tenant boundary. */
  tenantId: string;

  /** Current organization scope. */
  organizationId: string;
  organizationType: 'DEVELOPER' | 'KANWIL' | 'KEMENAG' | 'MADRASAH';

  accountType: CanonicalAccountType;

  roles: string[];
  permissions: string[];
  scopes: Scope[];

  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED';

  profile: {
    name: string;
    email: string;
    phoneNumber?: string;
    photoURL?: string;
  };

  metadata?: Record<string, any>;
}

export function hasPermission(user: CanonicalUser, permission: string): boolean {
  return user.permissions.includes(permission) || user.roles.includes('developer');
}

export function isInScope(user: CanonicalUser, organizationId: string): boolean {
  return user.organizationId === organizationId || user.scopes.some(s => s.id === organizationId);
}
