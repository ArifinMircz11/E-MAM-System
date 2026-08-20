import type { Permission } from '@/types/permissions';
import { PermissionChecker } from './PermissionChecker';

export const AuthorizationService = {
  can: (permission: Permission): boolean => PermissionChecker.can(permission),
  assert: (permission: Permission, actionName: string = 'Operation'): void => PermissionChecker.assert(permission, actionName),
};
