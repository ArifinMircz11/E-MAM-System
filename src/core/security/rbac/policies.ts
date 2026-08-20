import { ROLE_PERMISSIONS } from '@/types/permissions';
import type { UserRole } from './roles';
import type { Permission } from './permissions';

/**
 * policies.ts
 * Role-Based Permission Mapping (Policy)
 */

export const RolePermissions: Record<UserRole, Permission[]> = ROLE_PERMISSIONS;
