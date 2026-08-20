/**
 * @license
 * e-Mam System - Identity & Access Management (IAM)
 * Canonical User Schema Definition v2.0
 */

import type { UserRole } from '@/types/roles';

export type UserStatus = 'active' | 'pending' | 'inactive' | 'suspended' | 'deleted' | 'rejected' | 'aktif' | 'Nonaktif';

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

/**
 * CanonicalUser is the single source of truth for user identity in e-Mam System.
 * It is stored in Firestore 'users' collection and local IndexedDB 'users' table.
 */
/**
 * Domain Authority / Single Source of Truth (SSOT).
 * Represents the identity in Firestore and Dexie.
 * 
 * ADR: This file is the authoritative source for domain entity identity.
 * All repository and service logic must refer to this interface.
 */
export interface CanonicalUser {
  id: string; // Primary ID (same as uid)
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string | null;
  
  // Canonical Contract - First Class Core Identity Fields
  accountType: string; 
  role: string | UserRole; // Primary role string
  roles: (string | UserRole)[]; // List of assigned roles
  permissions: string[]; // Explicit permissions list
  
  // Multi-Tenant Isolation (P0 Invariant)
  tenantId: string;
  
  // Links to Domain Entities (P0/P1 Invariant: referenceId === students.id or teachers.id)
  referenceId?: string | null; // Master Entity Link (Student or Teacher ID)
  studentsId?: string | null; // Direct link to Student ID
  teachersId?: string | null; // Direct link to Teacher ID
  walasOfClass?: string | null; // Link for wali kelas
  
  // Account Claim & SSO Contract (P0 Mandatory Fields)
  isClaimed?: boolean; // Account claimed and bound to login identity
  isSso?: boolean; // Authenticated via SSO / Google Provider
  approvalStatus?: 'approved' | 'pending' | 'rejected' | string; // Account approval state
  
  // Status & Lifecycle
  status: UserStatus;
  syncStatus: 'synced' | 'pending' | 'error';
  rbacVersion?: number;
  securityVersion?: number;
  scopeType?: string;
  scopeId?: string;
  isActive?: boolean;
  
  // Extended Data
  profile?: UserProfile;
  assignment?: UserAssignment;
  scope?: UserScope;
  metadata?: UserMetadata;
  
  // Versioning & Audit
  version: number;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt?: number;

  // Legacy Support (Backward Compatibility)
  peran?: string;
  idUnik?: string;
  isClaimed?: boolean;
  nisn?: string;
  nik?: string;
  nip?: string;
}
