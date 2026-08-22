import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import type { SecurityContext } from './types';
import type { Permission } from '@/types/permissions';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import { ArchitectureBoundaryEnforcer } from '../boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '../boundary/ArchitectureBoundaryError';

/**
 * Runtime SecurityContext projection.
 *
 * This helper is intentionally fail-closed. It must never manufacture a
 * tenant, role, developer identity, or global scope from UI state/email.
 */
export function getSecurityContext(strict?: true): SecurityContext;
export function getSecurityContext(strict: false): SecurityContext | null;
export function getSecurityContext(strict: boolean = true): SecurityContext | null {
  const userState = useUserStore.getState();
  const authState = useAuthStore.getState();
  const user = authState.user || userState.user;
  const uid = authState.user?.uid || userState.uid || user?.uid;

  const fail = (code: string, message: string): null => {
    if (strict) throw new ArchitectureBoundaryError('security_context', code, message);
    return null;
  };

  if (!uid) return fail('IDENTITY_UID_MISSING', 'Security Context incomplete: uid tidak tersedia.');

  const roles = Array.from(new Set(
    (Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [])
      .map((r: any) => String(r).toLowerCase().trim())
      .filter(Boolean),
  ));

  if (roles.length === 0) return fail('SECURITY_CONTEXT_ROLE_MISSING', 'Security Context incomplete: role canonical tidak tersedia.');

  const isDeveloper = user?.accountType === 'developer' || roles.includes('developer');
  const tenantId = String(user?.tenantId || userState.tenantId || '').trim();
  const referenceId = String(user?.referenceId || userState.user?.referenceId || '').trim();

  if (!tenantId || ['global', 'default', 'unknown'].includes(tenantId.toLowerCase())) {
    return fail('TENANT_ACCESS_DENIED', 'Security Context incomplete: canonical tenantId tidak valid.');
  }

  if (!referenceId) return fail('REFERENCE_ID_MISSING', 'Security Context incomplete: referenceId canonical tidak tersedia.');

  const permissionsSet = new Set<Permission>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    perms.forEach((permission) => permissionsSet.add(permission));
  }

  const primaryRole = String(user?.role || roles[0]).toLowerCase().trim();
  const ctx = {
    uid,
    userId: user?.id || uid,
    referenceId,
    tenantId,
    role: primaryRole,
    effectiveRole: primaryRole,
    roles,
    permissions: isDeveloper ? (new Set(['*']) as any) : (permissionsSet as any),
    scopes: [],
    scope: { level: isDeveloper ? 'system' : 'tenant' },
    isDeveloper,
    accountType: user?.accountType || 'madrasah',
    featureFlags: {},
    sessionId: `sess_${uid}`,
  } as any;

  ArchitectureBoundaryEnforcer.enforceSecurityContext(ctx);
  return ctx;
}
