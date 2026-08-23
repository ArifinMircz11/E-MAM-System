import { useMonitorStore } from './MonitorStore';
import { ArchitectureBoundaryError, ArchitectureBoundaryType } from '../boundary/ArchitectureBoundaryError';
import { SecurityContextService } from '../security/SecurityContextService';

/**
 * Architecture boundary guardian.
 * Security authority never comes from email, client-provided developer flags,
 * or synthetic tenant defaults. Runtime authority belongs to SecurityContextService.
 */
export function reportArchitectureViolation(layer: string, message: string, details?: unknown): void {
  queueMicrotask(() => {
    try { useMonitorStore.getState().addDetail(`${layer}: ${message}`); } catch { /* monitoring is non-authoritative */ }
  });
  console.error(`[ArchitectureGuard] ${layer}: ${message}`, details ?? '');
}

export class ArchitectureGuard {
  static fail(boundary: ArchitectureBoundaryType, code: string, message: string, details?: unknown): never {
    reportArchitectureViolation(boundary, `[${code}] ${message}`, details);
    throw new ArchitectureBoundaryError(boundary, code, message, details);
  }

  static assertIdentity(user: { uid?: string | null; id?: string | null } | null | undefined): void {
    if (!user?.uid) this.fail('identity', 'IDENTITY_UID_MISSING', 'Firebase UID wajib tersedia pada konteks identitas.');
    if (!user.id) this.fail('identity', 'IDENTITY_USER_ID_MISSING', 'User ID kanonikal wajib tersedia.');
  }

  static assertUserContract(user: any): void {
    if (!user) this.fail('user_contract', 'USER_CONTRACT_INVALID', 'User contract kosong.');
    const missing: string[] = [];
    for (const field of ['id', 'uid', 'accountType', 'role', 'tenantId']) {
      if (user[field] === undefined || user[field] === null || user[field] === '') missing.push(field);
    }
    if (!Array.isArray(user.roles) || user.roles.length === 0) missing.push('roles');
    if (!user.namaTampilan && !user.displayName) missing.push('namaTampilan/displayName');
    if (user.status === undefined && user.isActive === undefined) missing.push('status/isActive');
    if (missing.length) this.fail('user_contract', 'USER_CONTRACT_INVALID', `Field wajib tidak ditemukan: ${missing.join(', ')}`, { missing });
    const role = String(user.role).toLowerCase().trim();
    const roles = (user.roles as unknown[]).map(String).map((r) => r.toLowerCase().trim());
    if (role === 'developer' && !roles.includes('developer') && String(user.accountType).toLowerCase() !== 'developer') {
      this.fail('user_contract', 'DEVELOPER_AUTHORITY_INVALID', 'Developer authority harus berasal dari CanonicalUser yang authoritative.');
    }
  }

  static assertReferenceId(role: string | undefined | null, referenceId: string | undefined | null, isDeveloper = false): void {
    const context = SecurityContextService.getNullableContext();
    if (isDeveloper && !context?.isDeveloper) this.fail('identity', 'DEVELOPER_AUTHORITY_INVALID', 'Developer flag bukan authority yang valid.');
    if (context?.isDeveloper) return;
    const normalized = String(role || '').toLowerCase().trim();
    if (['siswa', 'student', 'guru', 'teacher'].includes(normalized) && !referenceId?.trim()) {
      this.fail('identity', 'REFERENCE_ID_MISSING', `Peran '${role}' membutuhkan referenceId canonical.`);
    }
  }

  static assertTenantAccess(userTenantId: string | undefined | null, requestedTenantId: string | undefined | null, scopeType?: string, isDeveloper = false): void {
    const context = SecurityContextService.getNullableContext();
    if (isDeveloper && !context?.isDeveloper) this.fail('tenant', 'DEVELOPER_AUTHORITY_INVALID', 'Developer flag bukan authority yang valid.');
    if (!userTenantId) this.fail('tenant', 'TENANT_ACCESS_DENIED', 'tenantId canonical tidak tersedia.');
    if (['default', 'unknown', 'global'].includes(String(userTenantId).toLowerCase())) this.fail('tenant', 'TENANT_ACCESS_DENIED', 'Tenant fallback/global tidak valid untuk tenant-scoped runtime.');
    if (scopeType === 'global' || scopeType === 'system') {
      if (!context?.isDeveloper) this.fail('tenant', 'TENANT_ACCESS_DENIED', 'Global/system scope membutuhkan SecurityContext developer authoritative.');
      return;
    }
    if (requestedTenantId && requestedTenantId !== userTenantId) this.fail('tenant', 'TENANT_ACCESS_DENIED', `Tenant '${userTenantId}' tidak boleh mengakses '${requestedTenantId}'.`, { userTenantId, requestedTenantId });
  }

  static assertRbac(role: string | undefined, roles: string[] | undefined, permissionRequired?: string, hasPermission?: boolean): void {
    if (!role || !roles?.length) this.fail('rbac', 'RBAC_ACCESS_DENIED', 'Role canonical tidak terdefinisi.');
    if (permissionRequired && hasPermission === false) this.fail('rbac', 'RBAC_ACCESS_DENIED', `Permission '${permissionRequired}' ditolak.`);
  }

  static assertSecurityContext(ctx: { uid?: string; userId?: string; tenantId?: string; role?: string; effectiveRole?: string } | null | undefined): void {
    if (!ctx?.uid || !ctx.tenantId || (!ctx.role && !ctx.effectiveRole)) this.fail('security_context', 'SECURITY_CONTEXT_INVALID', 'SecurityContext tidak lengkap.');
  }

  static assertNavigation(effectiveRole: string, requestedTabOrRoute: string, allowedTabs: string[]): void {
    if (!allowedTabs.includes(requestedTabOrRoute)) this.fail('navigation', 'NAVIGATION_ROLE_MISMATCH', `Role '${effectiveRole}' tidak diizinkan membuka '${requestedTabOrRoute}'.`);
  }

  static assertDashboardRole(effectiveRole: string, expectedDashboardType: string): void {
    const role = effectiveRole.toLowerCase().trim();
    const dashboard = expectedDashboardType.toLowerCase().trim();
    if (role === 'developer' && !SecurityContextService.getNullableContext()?.isDeveloper) this.fail('dashboard', 'DEVELOPER_AUTHORITY_INVALID', 'Developer dashboard membutuhkan SecurityContext developer authoritative.');
    const compatible = role === dashboard ||
      (role === 'admin' && ['admin', 'madrasah', 'admin_madrasah'].includes(dashboard)) ||
      (role === 'guru' && ['guru', 'pendidik', 'teacher'].includes(dashboard)) ||
      (role === 'siswa' && ['siswa', 'student'].includes(dashboard));
    if (!compatible) this.fail('dashboard', 'DASHBOARD_ROLE_MISMATCH', `Role '${effectiveRole}' tidak diizinkan membuka dashboard '${expectedDashboardType}'.`);
  }

  static assertRepositoryTenant(tenantId: string | undefined | null, operation: string, isGlobalOp = false): void {
    const context = SecurityContextService.getNullableContext();
    if (isGlobalOp) {
      if (!context?.isDeveloper) this.fail('repository', 'GLOBAL_OPERATION_DENIED', `Operasi '${operation}' bukan operasi global yang authorized.`);
      return;
    }
    if (!tenantId?.trim() || ['default', 'unknown', 'global'].includes(tenantId.toLowerCase())) this.fail('repository', 'REPOSITORY_TENANT_MISSING', `Operasi '${operation}' membutuhkan tenant canonical valid.`);
  }

  static assertUiAccess(featureName: string, hasAccess: boolean): void {
    if (!hasAccess) this.fail('ui', 'UI_UNAUTHORIZED_FEATURE', `Akses UI '${featureName}' ditolak.`);
  }

  static assertSyncQueue(item: any, context?: { tenantId?: string; uid?: string; isDeveloper?: boolean } | null): void {
    if (!item) this.fail('sync_queue', 'SYNC_QUEUE_ITEM_INVALID', 'Item sinkronisasi kosong.');
    const tenantId = item.tenantId || item.payload?.tenantId;
    if (!tenantId || ['default', 'unknown'].includes(String(tenantId).toLowerCase())) this.fail('sync_queue', 'SYNC_QUEUE_TENANT_MISSING', 'Item sinkronisasi membutuhkan tenant canonical.');
    if (context) {
      const authoritative = SecurityContextService.getNullableContext();
      if (!authoritative?.uid || !authoritative.tenantId) this.fail('sync_queue', 'SYNC_QUEUE_SECURITY_CONTEXT_INVALID', 'SecurityContext authoritative belum READY.');
      if (context.isDeveloper && !authoritative.isDeveloper) this.fail('sync_queue', 'DEVELOPER_AUTHORITY_INVALID', 'Developer flag bukan authority yang valid.');
      if (!authoritative.isDeveloper && tenantId !== authoritative.tenantId) this.fail('sync_queue', 'SYNC_QUEUE_TENANT_MISMATCH', 'Tenant item tidak sesuai SecurityContext.');
    }
  }

  static assertSyncEngineTenant(queueItemTenantId: string | undefined | null, contextTenantId: string | undefined | null, isDeveloper = false): void {
    const context = SecurityContextService.getNullableContext();
    if (isDeveloper && !context?.isDeveloper) this.fail('sync_engine', 'DEVELOPER_AUTHORITY_INVALID', 'Developer flag bukan authority yang valid.');
    if (!queueItemTenantId || !contextTenantId) this.fail('sync_engine', 'SYNC_ENGINE_TENANT_MISMATCH', 'Tenant sync context tidak lengkap.');
    if (!context?.isDeveloper && queueItemTenantId !== contextTenantId) this.fail('sync_engine', 'SYNC_ENGINE_TENANT_MISMATCH', 'Tenant item sinkronisasi tidak sesuai SecurityContext.');
  }
}
