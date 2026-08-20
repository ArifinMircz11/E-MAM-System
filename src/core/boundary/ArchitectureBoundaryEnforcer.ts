import { ArchitectureGuard } from '../monitoring/ArchitectureGuard';
import { ArchitectureBoundaryError } from './ArchitectureBoundaryError';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import type { SecurityContext } from '../security/types';
import { UserRole } from '@/types/roles';

/**
 * Architecture Boundary Enforcer
 * Enforcer sentral yang menegakkan 9 boundary sistem e-MAM.
 * Jika terdapat pelanggaran kontrak, eksekusi HARUS FAIL CLOSED (tolak proses secara tegas).
 */
export class ArchitectureBoundaryEnforcer {
  /**
   * 1. Enforce Identity
   * Menolak jika user tidak memiliki UID atau ID.
   */
  static enforceIdentity(user: { uid?: string | null; id?: string | null } | null | undefined): void {
    ArchitectureGuard.assertIdentity(user);
  }

  /**
   * 1b. Enforce Domain Reference ID
   * Menolak jika siswa/guru tidak memiliki referenceId yang valid.
   */
  static enforceReferenceId(
    role: string | undefined | null,
    referenceId: string | undefined | null,
    isDeveloper?: boolean
  ): void {
    ArchitectureGuard.assertReferenceId(role, referenceId, isDeveloper);
  }

  /**
   * 2. Enforce User Contract
   * Menolak jika CanonicalUser tidak memenuhi standar integritas (misal kehilangan role, nama, tenant).
   */
  static enforceUserContract(user: CanonicalUser | any): void {
    ArchitectureGuard.assertUserContract(user);
  }

  /**
   * 3. Enforce Tenant Isolation
   * Menolak akses lintas tenant kecuali untuk Developer/Global Scope.
   */
  static enforceTenantAccess(
    userTenantId: string | undefined | null,
    requestedTenantId: string | undefined | null,
    scopeType?: string,
    isDeveloper?: boolean
  ): void {
    ArchitectureGuard.assertTenantAccess(userTenantId, requestedTenantId, scopeType, isDeveloper);
  }

  /**
   * 4. Enforce RBAC Permission
   * Menolak aksi jika role tidak memiliki permission yang diminta.
   */
  static enforceRbac(
    role: string | undefined,
    roles: string[] | undefined,
    permissionRequired?: string,
    hasPermission?: boolean
  ): void {
    ArchitectureGuard.assertRbac(role, roles, permissionRequired, hasPermission);
  }

  /**
   * 5. Enforce Security Context Integrity
   * Menolak jika SecurityContext tidak lengkap atau tidak valid.
   */
  static enforceSecurityContext(ctx: SecurityContext | any): void {
    ArchitectureGuard.assertSecurityContext(ctx);
  }

  /**
   * 6. Enforce Navigation Routing
   * Menolak perpindahan ke menu/tab yang tidak diizinkan untuk role terkait.
   */
  static enforceNavigation(effectiveRole: string, requestedTab: string, allowedTabs: string[]): void {
    ArchitectureGuard.assertNavigation(effectiveRole, requestedTab, allowedTabs);
  }

  /**
   * 7. Enforce Dashboard Type
   * Menolak rendering dashboard jika tidak cocok dengan role aktif.
   */
  static enforceDashboard(effectiveRole: string, expectedDashboardType: string): void {
    ArchitectureGuard.assertDashboardRole(effectiveRole, expectedDashboardType);
  }

  /**
   * 8. Enforce Repository Tenant Context
   * Menolak query Dexie tenant-scoped tanpa tenantId.
   */
  static enforceRepositoryTenant(tenantId: string | undefined | null, operation: string, isGlobalOp = false): void {
    ArchitectureGuard.assertRepositoryTenant(tenantId, operation, isGlobalOp);
  }

  /**
   * 9. Enforce UI Feature Access
   * Menolak rendering/interaksi fitur UI yang tidak terotorisasi.
   */
  static enforceUiAccess(featureName: string, hasAccess: boolean): void {
    ArchitectureGuard.assertUiAccess(featureName, hasAccess);
  }

  /**
   * 10. Enforce Sync Queue Boundary
   * Menolak item queue jika entity, entityId, operation, tenantId, atau actor context tidak valid.
   */
  static enforceSyncQueue(item: any, context?: { tenantId?: string; uid?: string; isDeveloper?: boolean } | null): void {
    ArchitectureGuard.assertSyncQueue(item, context);
  }

  /**
   * 11. Enforce Sync Engine Tenant Boundary
   * Menolak proses sinkronisasi jika queueItem.tenantId != SecurityContext.tenantId (kecuali developer/global).
   */
  static enforceSyncEngineTenant(
    queueItemTenantId: string | undefined | null,
    contextTenantId: string | undefined | null,
    isDeveloper?: boolean
  ): void {
    ArchitectureGuard.assertSyncEngineTenant(queueItemTenantId, contextTenantId, isDeveloper);
  }

  /**
   * 12. Enforce Sync Version & Concurrency Boundary
   * Menolak penulisan yang melanggar konkurensi versi data.
   */
  static enforceSyncVersion(localVersion: number, remoteVersion: number, canResolve: boolean = true): void {
    ArchitectureGuard.assertSyncVersion(localVersion, remoteVersion, canResolve);
  }
}
