/**
 * types.ts
 * WO-RBAC-05 / Tahap 3.1: Core Security Types
 */

export type SecurityLifecycleState =
  | "BOOTSTRAPPING"
  | "AUTHENTICATED"
  | "IDENTITY_RESOLVED"
  | "READY"
  | "SIGNED_OUT"
  | "ERROR";

export type AccountType =
  | "developer"
  | "kanwil"
  | "kemenag"
  | "madrasah";

export type AppPermission =
  | "student:profile:view"
  | "student:profile:create"
  | "student:profile:update"
  | "student:profile:delete"
  | "teacher:profile:view"
  | "teacher:profile:create"
  | "teacher:profile:update"
  | "attendance:record:view"
  | "attendance:record:create"
  | "attendance:record:update"
  | "attendance:approval:approve"
  | "letter:submission:view"
  | "letter:submission:create"
  | "letter:approval:approve"
  | "point:record:view"
  | "point:record:create"
  | "system:user:manage"
  | "system:tenant:manage"
  | "audit:log:view"
  | "madrasah:view"
  | "madrasah:create"
  | "madrasah:update"
  | "madrasah:delete"
  | "madrasah:restore"
  | "madrasah:archive"
  | string; // Allow extensible custom permissions

export type SystemRole =
  | "developer"
  | "admin"
  | "kamad"
  | "keptu"
  | "guru"
  | "guru_bk"
  | "staf"
  | "siswa"
  | "orang_tua"
  | string;

export interface SecurityScope {
  level?: string;
  classIds?: string[];
  academicYear?: string;
  modules?: string[];
  isGlobalTenantAccess?: boolean;
  [key: string]: any;
}

export interface CanonicalSecurityUser {
  uid: string;
  tenantId: string;
  accountType: AccountType;
  roles: SystemRole[];
  primaryRole: SystemRole;
  scope: SecurityScope;
}

export interface SecurityContext {
  readonly uid: string;
  readonly tenantId: string;
  readonly permissions: Set<AppPermission> | AppPermission[];
  readonly scope: SecurityScope;
  readonly roles?: string[];
  readonly accountType?: string;
  readonly isDeveloper?: boolean;
  readonly role?: string;
  hasPermission?: (permission: AppPermission) => boolean;
  can?: (permission: AppPermission) => boolean;
  canAll?: (permissions: AppPermission[]) => boolean;
  canAny?: (permissions: AppPermission[]) => boolean;
  getScope?: () => SecurityScope;
  [key: string]: any;
}


