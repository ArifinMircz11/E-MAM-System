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
  role: string | UserRole;

  /** Effective subordinate roles */
  roles: (string | UserRole)[];

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
  phoneNumber?: string;


  /** Canonical presentation/profile data */
  profile?: UserProfile;
  /** Explicit RBAC permission set */
  permissions: string[];

  /** Compatibility/domain links */
  studentsId?: string | null;
  teachersId?: string | null;
  walasOfClass?: string | null;

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

  deleted: boolean;
  deletedAt?: number;

  /** Legacy compatibility fields */
  peran?: string;
  idUnik?: string;
  nisn?: string;
  nik?: string;
  nip?: string;
}












