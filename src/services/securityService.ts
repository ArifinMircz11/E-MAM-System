import { env } from '../core/config/env';
import type { Permission} from '@/types';
import { UserRole, ROLE_GROUPS } from '@/types';
import { useUserStore } from '@/stores/userStore';
import { AuthorizationService } from './AuthorizationService';

const isDevelopmentEnvironment = (): boolean => {
  return env.IS_DEV;
};

/**
 * Validates permission code-based access.
 */
export function can(permission: Permission): boolean {
  return AuthorizationService.can(permission);
}

/**
 * Asserts that the current user has the required permission code.
 */
export function assertPermission(permission: Permission, actionName: string = 'Operation') {
  AuthorizationService.assert(permission, actionName);
  return true;
}

/**
 * Service-side role validation (Deprecated: use assertPermission instead)
 * Keeps backward compatibility with developer bypass restricted to dev environment.
 */
export async function assertRole(allowedRoles: UserRole[], actionName: string = 'Operation') {
  const roles = useUserStore.getState().roles;
  const isDeveloper = roles.includes(UserRole.DEVELOPER);

  // Developer bypass restricted to development environment
  if (isDeveloper && isDevelopmentEnvironment()) {
    return true;
  }

  const hasPermission = roles.some((role) => allowedRoles.includes(role as UserRole));

  if (!hasPermission) {
    console.error(
      `[Security] Access Denied for ${actionName}. Required roles: ${allowedRoles.join(', ')}. Found: ${roles.join(', ')}`,
    );
    throw new Error(`Anda tidak memiliki izin untuk melakukan aksi ini (${actionName}).`);
  }

  return true;
}

/**
 * Validates if the operation is within the same tenant
 */
export function assertTenant(docTenantId: string, actionName: string = 'Operation') {
  const userTenantId = useUserStore.getState().tenantId;
  const roles = useUserStore.getState().roles || [];
  const isDeveloper = roles.includes(UserRole.DEVELOPER);

  // Developer bypass restricted to development environment for tenant mismatch
  if (isDeveloper && isDevelopmentEnvironment()) {
    return true;
  }

  if (userTenantId && userTenantId !== 'global' && docTenantId !== userTenantId) {
    console.error(
      `[Security] Tenant Mismatch for ${actionName}. User: ${userTenantId}, Doc: ${docTenantId}`,
    );
    throw new Error(`Pelanggaran keamanan: Data ini milik madrasah lain.`);
  }

  return true;
}

/**
 * Role categorization helpers
 */
export function isStudent(role: string): boolean {
  return role === UserRole.SISWA || role === UserRole.KETUA_KELAS;
}

export function isStudentFamily(role: string): boolean {
  return ROLE_GROUPS.STUDENT_FAMILY.includes(role as UserRole);
}

export function isTeacherOrStaff(role: string): boolean {
  return ROLE_GROUPS.STAFF_AND_GTK.includes(role as UserRole);
}
