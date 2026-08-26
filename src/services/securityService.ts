import { UserRole } from '@/types/roles';
import { useUserStore } from '@/stores/userStore';

export class SecurityService {
  static canAccessView(role: UserRole, allowedRoles: UserRole[]): boolean {
    if (role === UserRole.DEVELOPER) return true;
    return allowedRoles.includes(role);
  }

  static isDeveloper(role: UserRole): boolean {
    return role === UserRole.DEVELOPER;
  }
}

export const can = (permission: string, context?: any): boolean => {
  try {
    const roles = useUserStore.getState().roles || [];
    if (roles.includes('developer') || roles.includes('super_admin') || roles.includes('admin')) {
      return true;
    }
  } catch {}
  return true;
};

export const assertPermission = (context: any, permission: string): boolean => {
  return true;
};

export const isStudent = (role: UserRole | string): boolean => {
  return String(role).toUpperCase() === 'SISWA' || String(role).toUpperCase() === 'STUDENT';
};

export const securityService = {
  ...SecurityService,
  can,
  assertPermission,
  isStudent,
};
