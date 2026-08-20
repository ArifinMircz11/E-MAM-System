import { SecurityContext } from '../auth/security-context';
import { PermissionResolver } from '../authorization/permission-resolver';
import { MASTER_PERMISSIONS } from '../authorization/permission/MasterPermissionCatalog';

/**
 * CRUD ACTION RESOLVER
 * 
 * Menentukan aksi operasional (Create, Read, Update, Delete) yang diizinkan
 * untuk sebuah entitas berdasarkan SecurityContext.
 */

export interface CrudActions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  canRestore: boolean;
}

export class CrudActionResolver {
  /**
   * Resolve aksi CRUD untuk entitas Siswa.
   */
  static resolveStudentActions(context: SecurityContext, studentTenantId: string): CrudActions {
    return {
      canCreate: PermissionResolver.can(context, MASTER_PERMISSIONS.STUDENT_CREATE, studentTenantId),
      canRead: PermissionResolver.can(context, MASTER_PERMISSIONS.STUDENT_VIEW, studentTenantId),
      canUpdate: PermissionResolver.can(context, MASTER_PERMISSIONS.STUDENT_UPDATE, studentTenantId),
      canDelete: PermissionResolver.can(context, MASTER_PERMISSIONS.STUDENT_DELETE, studentTenantId),
      canDeactivate: PermissionResolver.can(context, MASTER_PERMISSIONS.STUDENT_UPDATE, studentTenantId),
      canRestore: PermissionResolver.can(context, MASTER_PERMISSIONS.STUDENT_CREATE, studentTenantId),
    };
  }

  /**
   * Resolve aksi CRUD untuk entitas Madrasah (Tenants).
   */
  static resolveMadrasahActions(context: SecurityContext): CrudActions {
    return {
      canCreate: PermissionResolver.can(context, MASTER_PERMISSIONS.MADRASAH_CREATE),
      canRead: PermissionResolver.can(context, MASTER_PERMISSIONS.MADRASAH_VIEW),
      canUpdate: PermissionResolver.can(context, MASTER_PERMISSIONS.MADRASAH_UPDATE),
      canDelete: PermissionResolver.can(context, MASTER_PERMISSIONS.MADRASAH_DELETE),
      canDeactivate: PermissionResolver.can(context, MASTER_PERMISSIONS.MADRASAH_UPDATE),
      canRestore: PermissionResolver.can(context, MASTER_PERMISSIONS.MADRASAH_RESTORE),
    };
  }
}
