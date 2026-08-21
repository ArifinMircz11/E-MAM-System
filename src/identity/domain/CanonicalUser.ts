/**
 * Canonical User Contract
 *
 * SINGLE SOURCE OF TRUTH
 * Identity → Tenant → RBAC → SecurityContext → Service → Repository → UI
 */

import type { UserRole, AccountType } from '@/types/roles';

export type CanonicalRole = UserRole;
export type CanonicalSubRole = UserRole;

export type UserStatus =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'suspended'
  | 'deleted'
  | 'rejected'
  | 'aktif'
  | 'Nonaktif';

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

export type CanonicalFieldCategory = 'CANONICAL' | 'COMPATIBILITY' | 'LEGACY' | 'DERIVED';

/**
 * Field classification for CanonicalUser.
 * CANONICAL fields are the authoritative identity/security contract.
 * COMPATIBILITY fields keep current UI/Dexie/Firestore data readable during migration.
 * LEGACY fields are retained only until legacy data is fully normalized.
 * DERIVED fields can be recomputed from canonical/domain state.
 */
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
  isActive: 'DERIVED',
  displayName: 'CANONICAL',
  email: 'CANONICAL',
  phone: 'COMPATIBILITY',
  phoneNumber: 'COMPATIBILITY',
  photoURL: 'COMPATIBILITY',
  profile: 'COMPATIBILITY',
  studentsId: 'COMPATIBILITY',
  teachersId: 'COMPATIBILITY',
  walasOfClass: 'COMPATIBILITY',
  entityType: 'DERIVED',
  idUnik: 'LEGACY',
  nik: 'LEGACY',
  nisn: 'LEGACY',
  nip: 'LEGACY',
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
  /** Stable application-level identity */
  id: string;

  /** Firebase Authentication UID */
  uid: string;

  /** Mandatory tenant boundary */
  tenantId: string;

  /** Organization/account scope */
  accountType: AccountType;

  /** Primary effective role */
  role: UserRole;

  /** Effective subordinate roles */
  roles: UserRole[];

  /**
   * Canonical reference key.
   * Student → students.id
   * Teacher → teachers.id
   * Other identity → stable identity reference derived from UID
   */
  referenceId: string;

  /** Identity claim state */
  isClaimed: boolean;

  /** Authentication source */
  isSso: boolean;

  /** Account approval lifecycle */
  approvalStatus: 'approved' | 'pending' | 'rejected';

  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string;
  phoneNumber?: string;

  /** Canonical presentation/profile data */
  profile?: UserProfile;
  /** Explicit RBAC permission set */
  permissions: string[];

  /** Compatibility/domain links */
  studentsId?: string | null;
  teachersId?: string | null;
  walasOfClass?: string | null;

  /** Derived entity classification for UI and migration compatibility */
  entityType?: 'student' | 'teacher' | 'staff' | 'admin' | 'developer' | 'parent' | string | null;

  /** Compatibility academic placement fields */
  targetRombel?: string | null;
  tingkatRombel?: string | null;
  class?: string | null;

  /** Account lifecycle state */
  status: UserStatus;

  /** Synchronization state */
  syncStatus: 'synced' | 'pending' | 'error';

  /** Security/RBAC versions */
  rbacVersion?: number;
  securityVersion?: number;

  /** Security scope */
  scopeType?: string;
  scopeId?: string;
  scope?: UserScope;

  /** Domain assignment */
  assignment?: UserAssignment;

  /** Operational metadata */
  metadata?: UserMetadata;

  isActive?: boolean;

  /** Versioning */
  version: number;
  schemaVersion: number;

  /** Audit timestamps */
  createdAt: number;
  updatedAt: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  lastLoginAt?: number | null;

  deleted: boolean;
  deletedAt?: number;

  /** Legacy compatibility fields */
  peran?: string;
  idUnik?: string;
  nisn?: string;
  nik?: string;
  nip?: string;
}
