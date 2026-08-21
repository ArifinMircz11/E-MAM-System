/**
 * Canonical User Contract
 *
 * SINGLE SOURCE OF TRUTH
 * Firebase Auth → Firestore users/{uid} → CanonicalUser → SecurityContext.
 *
 * `referenceId` is never derived from UID. For domain identities it must point
 * to the canonical domain document ID:
 *   student/siswa → students/{referenceId}
 *   teacher/guru → teachers/{referenceId}
 *
 * An authenticated account without users/{uid}, or without an explicit
 * canonical reference, is NOT a CanonicalUser. It remains guest/pending
 * registration until an administrator approves the account.
 */

import type { UserRole, AccountType } from '@/types/roles';

export type CanonicalRole = UserRole;
export type CanonicalSubRole = UserRole;

export type UserStatus = 'active' | 'pending' | 'inactive' | 'suspended' | 'deleted' | 'rejected';

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string;
  phoneNumber?: string;
  nip?: string;
  nik?: string;
  nisn?: string;
}

export interface UserScope {
  level: 'global' | 'tenant' | 'department' | 'class' | 'restricted';
  ids?: string[];
}

export interface UserAssignment {
  departmentId?: string;
  positionId?: string;
  classId?: string;
  studentsId?: string;
  teachersId?: string;
  scope?: UserScope;
}

export type CanonicalFieldCategory = 'CANONICAL' | 'COMPATIBILITY' | 'DERIVED';

export const CANONICAL_USER_FIELD_CLASSIFICATION: Record<string, CanonicalFieldCategory> = {
  id: 'CANONICAL',
  uid: 'CANONICAL',
  tenantId: 'CANONICAL',
  accountType: 'CANONICAL',
  role: 'CANONICAL',
  roles: 'CANONICAL',
  permissions: 'CANONICAL',
  referenceId: 'CANONICAL',
  isClaimed: 'CANONICAL',
  isSso: 'CANONICAL',
  approvalStatus: 'CANONICAL',
  status: 'CANONICAL',
  displayName: 'CANONICAL',
  email: 'CANONICAL',
  isActive: 'DERIVED',
  idUnik: 'COMPATIBILITY',
  nisn: 'COMPATIBILITY',
  nip: 'COMPATIBILITY',
  nik: 'COMPATIBILITY',
  peran: 'COMPATIBILITY',
  phone: 'COMPATIBILITY',
  phoneNumber: 'COMPATIBILITY',
  photoURL: 'COMPATIBILITY',
  profile: 'COMPATIBILITY',
  studentsId: 'COMPATIBILITY',
  teachersId: 'COMPATIBILITY',
  walasOfClass: 'COMPATIBILITY',
  entityType: 'DERIVED',
  assignment: 'COMPATIBILITY',
  scope: 'COMPATIBILITY',
  scopeType: 'COMPATIBILITY',
  scopeId: 'COMPATIBILITY',
  targetRombel: 'COMPATIBILITY',
  tingkatRombel: 'COMPATIBILITY',
  class: 'COMPATIBILITY',
  metadata: 'COMPATIBILITY',
  rbacVersion: 'CANONICAL',
  securityVersion: 'CANONICAL',
  schemaVersion: 'CANONICAL',
  syncStatus: 'CANONICAL',
  version: 'CANONICAL',
  createdAt: 'CANONICAL',
  updatedAt: 'CANONICAL',
  createdBy: 'CANONICAL',
  updatedBy: 'CANONICAL',
  lastLoginAt: 'COMPATIBILITY',
  deleted: 'CANONICAL',
};

export interface UserMetadata {
  isActivationRequest?: boolean;
  requestedAt?: number;
  approvedAt?: number;
  approvedBy?: string;
  lastLoginAt?: number;
  lastModifiedDevice?: string;
  isOfflineFallback?: boolean;
}

export interface CanonicalUser {
  id: string;
  uid: string;

  /** Tenant is mandatory at the canonical/security boundary. Global system accounts use the explicit `system` tenant. */
  tenantId: string;

  /** Organization/account scope from Firestore; never inferred from role alone. */
  accountType: AccountType;

  role: UserRole;
  roles: UserRole[];
  permissions: string[];

  /**
   * Canonical domain reference. Never derived from UID.
   * student/siswa → students/{referenceId}
   * teacher/guru → teachers/{referenceId}
   * Other organization identities must use an explicitly defined canonical
   * organization reference; absence means registration is required.
   */
  referenceId: string | null;

  isClaimed: boolean;
  isSso: boolean;
  approvalStatus: 'approved' | 'pending' | 'rejected';

  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string;
  phoneNumber?: string;
  profile?: UserProfile;

  /** Legacy/compatibility projection. These fields are never identity authority. */
  idUnik?: string;
  nisn?: string;
  nip?: string;
  nik?: string;
  peran?: string;

  studentsId?: string | null;
  teachersId?: string | null;
  walasOfClass?: string | null;
  entityType?: 'student' | 'teacher' | 'staff' | 'admin' | 'developer' | 'parent' | string | null;

  targetRombel?: string | null;
  tingkatRombel?: string | null;
  class?: string | null;

  status: UserStatus;
  syncStatus: 'synced' | 'pending' | 'error';
  rbacVersion?: number;
  securityVersion?: number;

  scopeType?: string;
  scopeId?: string;
  scope?: UserScope;
  assignment?: UserAssignment;
  metadata?: UserMetadata;
  isActive?: boolean;

  version: number;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  lastLoginAt?: number | null;

  deleted: boolean;
  deletedAt?: number;
}
