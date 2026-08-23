import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import type { SecurityContext } from './types';
import type { Permission } from '@/types/permissions';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import { ArchitectureBoundaryEnforcer } from '../boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '../boundary/ArchitectureBoundaryError';

/**
 * Helper to generate SecurityContext from current user state.
 * Developer authority is derived only from the authoritative role claim;
 * email addresses are never treated as privilege grants.
 */
export function getSecurityContext(strict?: true): SecurityContext;
export function getSecurityContext(strict: false): SecurityContext | null;
export function getSecurityContext(strict: boolean = true): SecurityContext | null {
  const userState = useUserStore.getState();
  const authState = useAuthStore.getState();

  const user = userState.user || authState.user;
  const uid = userState.uid || authState.user?.uid || user?.uid;

  if (!uid) {
    if (strict) {
      throw new ArchitectureBoundaryError(
        'identity',
        'IDENTITY_UID_MISSING',
        'Security Context incomplete: Pengguna belum masuk (tidak ada identitas uid).'
      );
    }
    return null;
  }

  const rawRoles = userState.roles && userState.roles.length > 0
    ? userState.roles
    : authState.user?.roles || (authState.user?.role ? [authState.user.role] : []);

  const roles = Array.from(new Set(
    rawRoles.map((r: any) => String(r).toLowerCase().trim()).filter(Boolean),
  ));
  const isDeveloper = roles.includes('developer');

  if (roles.length === 0) {
    if (strict) {
      throw new ArchitectureBoundaryError(
        'security_context',
        'SECURITY_CONTEXT_INVALID',
        'Security Context incomplete: Pengguna tidak memiliki role yang terdaftar.'
      );
    }
    return null;
  }

  const tenantId = userState.tenantId || authState.user?.tenantId || user?.tenantId;

  if (!tenantId) {
    if (strict) {
      throw new ArchitectureBoundaryError(
        'tenant',
        'TENANT_ACCESS_DENIED',
        'Security Context incomplete: tenantId tidak terdefinisi.'
      );
    }
    return null;
  }

  const primaryRole = roles[0] as any;

  const permissionsSet = new Set<Permission>();
  roles.forEach((role) => {
    const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    perms.forEach((p) => permissionsSet.add(p));
  });

  const ctx = {
    uid,
    userId: userState.user?.id || authState.user?.id || uid,
    referenceId: userState.user?.referenceId || authState.user?.referenceId || undefined,
    tenantId,
    role: primaryRole,
    effectiveRole: primaryRole,
    roles,
    permissions: permissionsSet as any,
    scopes: [],
    scope: { level: isDeveloper ? 'global' : 'tenant' },
    isDeveloper,
    accountType: userState.user?.accountType || (isDeveloper ? 'developer' : 'madrasah'),
    featureFlags: {},
    sessionId: `sess_${uid}_${Date.now()}`,
  } as any;

  ArchitectureBoundaryEnforcer.enforceSecurityContext(ctx);
  return ctx;
}
