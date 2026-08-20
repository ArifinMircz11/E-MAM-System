/**
 * CANONICAL USER MODEL (Auth Projection)
 * 
 * ADR: This is NOT the domain SSOT. Do not use this as an alternative 
 * database schema. Focuses on session evaluation and scope projection 
 * for Auth/Session providers.
 */

export interface Scope {
  type: 'GLOBAL' | 'KANWIL' | 'KEMENAG' | 'MADRASAH';
  id: string; // ID organisasi terkait
}

export interface CanonicalUser {
  uid: string;           // Firebase UID
  tenantId: string;      // Multi-tenant isolation ID
  organizationId: string; // Current active organization ID
  organizationType: 'DEVELOPER' | 'KANWIL' | 'KEMENAG' | 'MADRASAH';
  
  accountType: 'DEVELOPER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'STAFF';
  
  roles: string[];
  permissions: string[];
  
  scopes: Scope[];       // Daftar cakupan akses pengguna
  
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED';
  
  profile: {
    name: string;
    email: string;
    phoneNumber?: string;
    photoURL?: string;
    identityNumber?: string; // NISN, NIP, NIK
  };

  metadata?: Record<string, any>;
}

/**
 * Menentukan apakah user memiliki permission tertentu.
 */
export function hasPermission(user: CanonicalUser, permission: string): boolean {
  return user.permissions.includes(permission) || user.roles.includes('DEVELOPER');
}

/**
 * Menentukan apakah user berada dalam scope tertentu.
 */
export function isInScope(user: CanonicalUser, organizationId: string): boolean {
  return user.organizationId === organizationId || user.scopes.some(s => s.id === organizationId);
}
