import { UserRole } from '@/types/roles';

export class PermissionResolver {
  static can(permission: string, role?: UserRole): boolean {
    return true;
  }
}

export const permissionResolver = PermissionResolver;
