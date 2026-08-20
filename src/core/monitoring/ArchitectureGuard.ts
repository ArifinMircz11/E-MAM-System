import { useMonitorStore } from "./MonitorStore";
import { ArchitectureBoundaryError, ArchitectureBoundaryType } from "../boundary/ArchitectureBoundaryError";

/**
 * Single Source of Truth Architecture Guardian
 * Bertugas memantau dan menegakkan kepatuhan 9 Boundary Arsitektur.
 */
export function reportArchitectureViolation(
  layer: string,
  message: string,
  details?: any
) {
  queueMicrotask(() => {
    try {
      const store = useMonitorStore.getState();
      store.addDetail(`${layer}: ${message}`);
    } catch {
      // Safe fallback if store is uninitialized
    }
  });

  console.error(
    `
==================================================
🚨 ARCHITECTURE VIOLATION
==================================================
Layer/Boundary: ${layer}
Problem: ${message}
Details: ${details ? JSON.stringify(details, null, 2) : 'None'}
==================================================
`
  );
}

export class ArchitectureGuard {
  /**
   * Catat dan lempar error boundary
   */
  static fail(boundary: ArchitectureBoundaryType, code: string, message: string, details?: any): never {
    reportArchitectureViolation(boundary, `[${code}] ${message}`, details);
    throw new ArchitectureBoundaryError(boundary, code, message, details);
  }

  /**
   * 1. Identity Boundary
   */
  static assertIdentity(user: { uid?: string | null; id?: string | null } | null | undefined): void {
    if (!user) {
      this.fail('identity', 'IDENTITY_UID_MISSING', 'Identitas pengguna kosong atau tidak terdefinisi.');
    }
    if (!user.uid) {
      this.fail('identity', 'IDENTITY_UID_MISSING', 'Firebase UID wajib tersedia pada konteks identitas.');
    }
    if (!user.id) {
      this.fail('identity', 'IDENTITY_USER_ID_MISSING', 'User ID kanonikal (id) wajib tersedia.');
    }
  }

  /**
   * 2. User Contract Boundary
   */
  static assertUserContract(user: any): void {
    if (!user) {
      this.fail('user_contract', 'USER_CONTRACT_INVALID', 'User contract bernilai null atau undefined.');
    }

    const missingFields: string[] = [];
    if (!user.id) missingFields.push('id');
    if (!user.uid) missingFields.push('uid');
    if (!user.accountType) missingFields.push('accountType');
    if (!user.role) missingFields.push('role');
    if (!Array.isArray(user.roles) || user.roles.length === 0) missingFields.push('roles');
    if (!user.namaTampilan && !user.displayName) missingFields.push('namaTampilan/displayName');
    if (user.tenantId === undefined || user.tenantId === null) missingFields.push('tenantId');
    if (user.status === undefined && user.isActive === undefined) missingFields.push('status/isActive');

    if (missingFields.length > 0) {
      this.fail(
        'user_contract',
        'USER_CONTRACT_INVALID',
        `User contract tidak valid. Field wajib tidak ditemukan: ${missingFields.join(', ')}`,
        { missingFields, userSummary: { id: user.id, uid: user.uid, role: user.role } }
      );
    }

    // Periksa apakah ada upaya pemalsuan developer role tanpa validasi
    const roleLower = String(user.role).toLowerCase().trim();
    if (roleLower === 'developer') {
      const email = (user.email || '').toLowerCase().trim();
      const isKnownDev = ['developer@example.com', 'admin@example.com'].includes(email);
      if (!isKnownDev && user.accountType !== 'developer' && user.scopeType !== 'global') {
        this.fail(
          'user_contract',
          'USER_CONTRACT_INVALID',
          'Akun mengaku sebagai Developer tetapi tidak terdaftar dalam kredensial otoritatif developer.',
          { email, role: user.role }
        );
      }
    }
  }

  /**
   * Reference ID Boundary for Domain Identity (Siswa / Guru)
   */
  static assertReferenceId(
    role: string | undefined | null,
    referenceId: string | undefined | null,
    isDeveloper?: boolean
  ): void {
    if (isDeveloper) return;
    const roleLower = String(role || '').toLowerCase().trim();
    if (roleLower === 'siswa' || roleLower === 'student') {
      if (!referenceId || referenceId.trim() === '') {
        this.fail(
          'identity',
          'REFERENCE_ID_MISSING',
          'Peran siswa mewajibkan referenceId ke students.id. Akses fitur domain ditolak.',
          { role, referenceId }
        );
      }
    } else if (roleLower === 'guru' || roleLower === 'teacher') {
      if (!referenceId || referenceId.trim() === '') {
        this.fail(
          'identity',
          'REFERENCE_ID_MISSING',
          'Peran guru mewajibkan referenceId ke teachers.id. Akses fitur domain ditolak.',
          { role, referenceId }
        );
      }
    }
  }

  /**
   * 3. Tenant Boundary
   */
  static assertTenantAccess(
    userTenantId: string | undefined | null,
    requestedTenantId: string | undefined | null,
    scopeType?: string,
    isDeveloper?: boolean
  ): void {
    if (isDeveloper || scopeType === 'global' || scopeType === 'system') {
      return; // Developer/system has global scope access
    }

    if (!userTenantId) {
      this.fail('tenant', 'TENANT_ACCESS_DENIED', 'Pengguna tidak memiliki tenantId terdaftar.');
    }

    if (requestedTenantId && requestedTenantId !== 'global' && userTenantId !== requestedTenantId) {
      this.fail(
        'tenant',
        'TENANT_ACCESS_DENIED',
        `Pengguna dari tenant '${userTenantId}' mencoba mengakses tenant '${requestedTenantId}'.`,
        { userTenantId, requestedTenantId }
      );
    }
  }

  /**
   * 4. RBAC Boundary
   */
  static assertRbac(
    role: string | undefined,
    roles: string[] | undefined,
    permissionRequired?: string,
    hasPermission?: boolean
  ): void {
    if (!role) {
      this.fail('rbac', 'RBAC_ACCESS_DENIED', 'Primary role tidak terdefinisi.');
    }
    if (permissionRequired && hasPermission === false) {
      this.fail(
        'rbac',
        'RBAC_ACCESS_DENIED',
        `Akses ditolak: role '${role}' tidak memiliki izin '${permissionRequired}'.`,
        { role, roles, permissionRequired }
      );
    }
  }

  /**
   * 5. Security Context Boundary
   */
  static assertSecurityContext(ctx: {
    uid?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
    effectiveRole?: string;
  } | null | undefined): void {
    if (!ctx) {
      this.fail('security_context', 'SECURITY_CONTEXT_INVALID', 'SecurityContext kosong atau tidak terinisialisasi.');
    }
    if (!ctx.uid) {
      this.fail('security_context', 'SECURITY_CONTEXT_INVALID', 'SecurityContext tidak memiliki uid.');
    }
    if (!ctx.tenantId) {
      this.fail('security_context', 'SECURITY_CONTEXT_INVALID', 'SecurityContext tidak memiliki tenantId.');
    }
    if (!ctx.role && !ctx.effectiveRole) {
      this.fail('security_context', 'SECURITY_CONTEXT_INVALID', 'SecurityContext tidak memiliki role/effectiveRole.');
    }
  }

  /**
   * 6. Navigation Boundary
   */
  static assertNavigation(effectiveRole: string, requestedTabOrRoute: string, allowedTabs: string[]): void {
    if (!allowedTabs.includes(requestedTabOrRoute)) {
      this.fail(
        'navigation',
        'NAVIGATION_ROLE_MISMATCH',
        `Role '${effectiveRole}' tidak diizinkan membuka navigasi/rute '${requestedTabOrRoute}'.`,
        { effectiveRole, requestedTabOrRoute, allowedTabs }
      );
    }
  }

  /**
   * 7. Dashboard Boundary
   */
  static assertDashboardRole(effectiveRole: string, expectedDashboardType: string): void {
    const roleLower = effectiveRole.toLowerCase().trim();
    const dashLower = expectedDashboardType.toLowerCase().trim();

    // Map allowed dashboard relations
    const allowedMap: Record<string, string[]> = {
      developer: ['developer'],
      admin_pusat: ['pusat', 'admin_pusat'],
      admin_provinsi: ['provinsi', 'admin_provinsi'],
      admin_kabupaten: ['kabupaten', 'admin_kabupaten', 'kemenag'],
      admin_madrasah: ['madrasah', 'admin_madrasah', 'admin'],
      admin: ['madrasah', 'admin_madrasah', 'admin'],
      kepala_madrasah: ['kepala_madrasah', 'kepala', 'madrasah'],
      kepala_tu: ['kepala_tu', 'tu', 'madrasah'],
      staf: ['staf', 'tu', 'madrasah'],
      staf_tu: ['staf', 'tu', 'madrasah'],
      guru: ['guru', 'pendidik', 'teacher'],
      wali_kelas: ['guru', 'wali_kelas', 'pendidik'],
      guru_bk: ['guru_bk', 'bk', 'guru'],
      siswa: ['siswa', 'student'],
      orang_tua: ['orang_tua', 'wali_murid', 'parent'],
    };

    const allowed = allowedMap[roleLower] || [roleLower];
    if (!allowed.includes(dashLower)) {
      this.fail(
        'dashboard',
        'DASHBOARD_ROLE_MISMATCH',
        `Role '${effectiveRole}' tidak diizinkan membuka dashboard bertipe '${expectedDashboardType}'.`,
        { effectiveRole, expectedDashboardType, allowed }
      );
    }
  }

  /**
   * 8. Repository Boundary
   */
  static assertRepositoryTenant(tenantId: string | undefined | null, operation: string, isGlobalOp = false): void {
    if (isGlobalOp) return;
    if (!tenantId || tenantId.trim() === '') {
      this.fail(
        'repository',
        'REPOSITORY_TENANT_MISSING',
        `Operasi repository '${operation}' membutuhkan tenantId tetapi tenant context tidak tersedia.`,
        { operation }
      );
    }
  }

  /**
   * 9. UI Boundary
   */
  static assertUiAccess(featureName: string, hasAccess: boolean): void {
    if (!hasAccess) {
      this.fail(
        'ui',
        'UI_UNAUTHORIZED_FEATURE',
        `Akses ke fitur UI '${featureName}' ditolak berdasarkan evaluasi SecurityContext RBAC.`,
        { featureName }
      );
    }
  }

  /**
   * 10. Sync Queue Boundary
   */
  static assertSyncQueue(item: any, context?: { tenantId?: string; uid?: string; isDeveloper?: boolean } | null): void {
    if (!item) {
      this.fail('sync_queue', 'SYNC_QUEUE_ITEM_INVALID', 'Item antrean sinkronisasi bernilai kosong.');
    }

    // 1. Tenant ID validation
    const itemTenantId = item.tenantId || (item.payload && item.payload.tenantId);
    if (!itemTenantId || typeof itemTenantId !== 'string' || itemTenantId.trim() === '') {
      this.fail(
        'sync_queue',
        'SYNC_QUEUE_TENANT_MISSING',
        'Item antrean sinkronisasi tidak memiliki tenantId.',
        { itemSummary: { collection: item.collection, action: item.action } }
      );
    }

    // 2. Entity / Collection validation
    const entity = item.collection || item.entity || item.entityType;
    if (!entity || typeof entity !== 'string' || entity.trim() === '') {
      this.fail(
        'sync_queue',
        'SYNC_QUEUE_ENTITY_INVALID',
        'Item antrean sinkronisasi tidak memiliki entitas/koleksi target.',
        { item }
      );
    }

    // 3. Entity ID / Document ID validation
    const entityId =
      item.entityId ||
      item.documentId ||
      item.payload?.id ||
      item.payload?.idUnik ||
      item.payload?.uid ||
      item.payload?.userId ||
      item.payload?.studentId ||
      item.payload?.teacherId ||
      item.payload?.classId;

    if (!entityId || String(entityId).trim() === '') {
      this.fail(
        'sync_queue',
        'SYNC_QUEUE_ENTITY_ID_MISSING',
        `Item antrean sinkronisasi untuk koleksi '${entity}' tidak memiliki entityId / documentId.`,
        { collection: entity, action: item.action || item.operation }
      );
    }

    // 4. Operation validation
    let op = String(item.operation || '').toLowerCase();
    if (!op && item.action) {
      const act = String(item.action).toUpperCase();
      if (act === 'CREATE' || act === 'CREATE_STUDENT' || act === 'CREATE_TEACHER') op = 'create';
      else if (act === 'DELETE' || act === 'DELETE_STUDENT' || act === 'DELETE_TEACHER') op = 'delete';
      else if (act === 'PATCH') op = 'patch';
      else if (act === 'BULK_CREATE') op = 'bulk_create';
      else if (act === 'BULK_UPDATE') op = 'bulk_update';
      else if (act === 'SCAN_PRESENSI' || act === 'ADD_POINT') op = 'create';
      else if (act === 'ATTENDANCE_PROCESS' || act === 'AUTO_SWEEP' || act === 'REPAIR_POINTS') op = 'patch';
      else if (act === 'BATCH_SYNC') op = 'bulk_create';
      else if (act === 'BATCH_DELETE') op = 'delete';
      else op = 'update';
    }

    const validOperations = [
      'create',
      'update',
      'delete',
      'patch',
      'bulk_create',
      'bulk_update'
    ];
    if (!op || !validOperations.includes(op)) {
      this.fail(
        'sync_queue',
        'SYNC_QUEUE_OPERATION_INVALID',
        `Operasi antrean sinkronisasi '${op}' tidak valid. Harus salah satu dari: ${validOperations.join(', ')}`,
        { operation: op, collection: entity }
      );
    }

    // 5. SecurityContext validation (if actor context passed)
    if (context) {
      if (!context.uid || !context.tenantId) {
        this.fail(
          'sync_queue',
          'SYNC_QUEUE_SECURITY_CONTEXT_INVALID',
          'SecurityContext yang dilampirkan pada antrean sinkronisasi tidak valid (uid atau tenantId kosong).',
          { context }
        );
      }

      if (!context.isDeveloper && context.tenantId !== 'global' && itemTenantId !== context.tenantId) {
        this.fail(
          'sync_queue',
          'SYNC_QUEUE_TENANT_MISMATCH',
          `Ketidakcocokan tenant: Konteks pengguna '${context.tenantId}' tidak sesuai dengan tenant antrean '${itemTenantId}'.`,
          { contextTenantId: context.tenantId, itemTenantId }
        );
      }
    }
  }

  /**
   * 11. Sync Engine Tenant Boundary
   */
  static assertSyncEngineTenant(
    queueItemTenantId: string | undefined | null,
    contextTenantId: string | undefined | null,
    isDeveloper?: boolean
  ): void {
    if (isDeveloper || contextTenantId === 'global') {
      return;
    }

    if (!queueItemTenantId || !contextTenantId) {
      this.fail(
        'sync_engine',
        'SYNC_ENGINE_TENANT_MISMATCH',
        'TenantId pada item sinkronisasi atau SecurityContext tidak terdefinisi.',
        { queueItemTenantId, contextTenantId }
      );
    }

    if (queueItemTenantId !== contextTenantId) {
      this.fail(
        'sync_engine',
        'SYNC_ENGINE_TENANT_MISMATCH',
        `SyncEngine mendeteksi ketidakcocokan tenant: Item '${queueItemTenantId}' vs Konteks '${contextTenantId}'.`,
        { queueItemTenantId, contextTenantId }
      );
    }
  }

  /**
   * 12. Sync Version & Concurrency Boundary
   */
  static assertSyncVersion(localVersion: number, remoteVersion: number, canResolve: boolean = true): void {
    if (!canResolve && remoteVersion > localVersion) {
      this.fail(
        'sync_engine',
        'SYNC_VERSION_CONFLICT',
        `Konflik konkurensi data terdeteksi: Versi remote (${remoteVersion}) mendahului versi lokal (${localVersion}).`,
        { localVersion, remoteVersion }
      );
    }
  }
}

