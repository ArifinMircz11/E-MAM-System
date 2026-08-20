/**
 * @license
 * e-Mam System - User Role Resolver & RBAC Enterprise Pipeline (Local-First Dexie Implementation)
 */

import { userRepository } from '@/repositories/userRepository';
import type { SecurityContext } from '@/core/security/types';

export interface CanonicalUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  accountType: string;
  role: string;
  roles: string[];
  permissions: string[];
  status: string;
  tenantId?: string | null;
  scope?: {
    level: string;
    schoolId?: string;
    classIds?: string[];
    subjectIds?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export class UserRoleResolver {
  /**
   * Resolves canonical user and permissions from Dexie operational database via UserRepository.
   */
  static async resolveUser(uid: string): Promise<CanonicalUser | null> {
    if (!uid) return null;
    try {
      const context: SecurityContext = { tenantId: 'global', uid, role: 'user', roles: ['user'], permissions: new Set() } as any;
      const user = await userRepository.getByUid(uid);
      
      const isDeveloper = user?.role === 'developer';

      if (!user) {
        return null;
      }

      const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role || 'pending'];
      const role = user.role || roles[0] || 'pending';
      const permissions = Array.isArray(user.permissions) ? user.permissions : [];

      return {
        id: user.id || uid,
        uid: user.uid || uid,
        email: user.profile?.email || '',
        displayName: user.profile?.displayName || 'Pengguna',
        photoURL: user.profile?.photoURL || null,
        accountType: isDeveloper ? 'developer' : user.accountType || 'Madrasah',
        role: isDeveloper ? 'developer' : role,
        roles: isDeveloper ? ['developer'] : roles,
        permissions: isDeveloper ? ['*'] : permissions,
        status: isDeveloper ? 'aktif' : user.status || 'pending',
        tenantId: isDeveloper ? 'global' : user.tenantId || null,
        scope: isDeveloper
          ? { level: 'global' }
          : {
              level: user.scope?.level || 'restricted',
              schoolId: (user.scope as any)?.schoolId,
              classIds: (user.scope as any)?.classIds,
              subjectIds: (user.scope as any)?.subjectIds,
            },
        createdAt: user.createdAt?.toString(),
        updatedAt: user.updatedAt?.toString(),
      };
    } catch (err) {
      console.error('[UserRoleResolver] Failed to resolve user from Dexie:', err);
      return null;
    }
  }

  /**
   * Resolves permissions based on user role and overrides.
   */
  static resolvePermissions(user: CanonicalUser): string[] {
    if (user.role === 'developer' || user.permissions.includes('*')) {
      return ['*'];
    }
    const basePermissions = new Set<string>(user.permissions);
    if (['admin', 'kepala_madrasah'].includes(user.role)) {
      basePermissions.add('user.manage');
      basePermissions.add('tenant.manage');
      basePermissions.add('audit.read');
      basePermissions.add('grade.manage');
      basePermissions.add('attendance.manage');
    } else if (['guru', 'wali_kelas'].includes(user.role)) {
      basePermissions.add('grade.write');
      basePermissions.add('attendance.write');
      basePermissions.add('journal.write');
    } else if (user.role === 'bk') {
      basePermissions.add('bk.manage');
    } else if (['staf', 'kepala_tu'].includes(user.role)) {
      basePermissions.add('letter.manage');
      basePermissions.add('finance.manage');
    }
    return Array.from(basePermissions);
  }

  /**
   * Determines if user has access to navigation / features.
   */
  static canAccess(user: CanonicalUser, permission: string): boolean {
    if (user.status !== 'aktif' && user.role !== 'developer') {
      return false;
    }
    if (user.permissions.includes('*') || user.role === 'developer') {
      return true;
    }
    const permissions = this.resolvePermissions(user);
    return permissions.includes(permission) || permissions.includes('*');
  }
}
