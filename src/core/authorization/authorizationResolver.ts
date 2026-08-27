import { getSecurityContext } from '@/core/security/contextHelper';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import type { SecurityContext } from '@/core/security/types';

export type AuthorizationRequirement = {
  permission?: string;
  roles?: string[];
  accountTypes?: string[];
  referenceId?: string | null;
};

const normalized = (value: unknown) => String(value ?? '').trim().toLowerCase();

const hasPermission = (context: SecurityContext, permission: string) => {
  if (context.permissions instanceof Set && context.permissions.has(permission as never)) return true;
  if (Array.isArray(context.permissions) && context.permissions.includes(permission as never)) return true;
  const rolePermissions = ROLE_PERMISSIONS[context.role as keyof typeof ROLE_PERMISSIONS];
  return Array.isArray(rolePermissions) && rolePermissions.includes(permission as never);
};

/** Single authorization decision point for views, routes and navigation. */
export const canAccess = (
  requirement: AuthorizationRequirement,
  context: SecurityContext = getSecurityContext(true),
): boolean => {
  if (context.isDeveloper) return true;

  if (requirement.roles?.length) {
    const allowedRoles = requirement.roles.map(normalized);
    if (!context.roles.some((role) => allowedRoles.includes(normalized(role)))) return false;
  }

  if (requirement.accountTypes?.length) {
    const allowedTypes = requirement.accountTypes.map(normalized);
    if (!allowedTypes.includes(normalized(context.accountType))) return false;
  }

  if (requirement.permission && !hasPermission(context, requirement.permission)) return false;

  if (requirement.referenceId !== undefined) {
    if (!requirement.referenceId || normalized(context.referenceId) !== normalized(requirement.referenceId)) return false;
  }

  return Boolean(context.tenantId);
};

export const getAuthorizationContext = () => getSecurityContext(false);
