import { SecurityContext, can } from '../auth/security-context';
import { ScopeEngine } from './scope-engine';
import { OrganizationContext } from '../auth/organization-context';

/**
 * PERMISSION RESOLVER
 * 
 * Entry point utama untuk pengecekan hak akses di seluruh aplikasi.
 * Menggabungkan evaluasi Permission, Scope, dan Policy.
 */

export class PermissionResolver {
  /**
   * Mengevaluasi apakah context diizinkan melakukan aksi berdasarkan permission dan target.
   */
  static can(context: SecurityContext, permission: string, targetId?: string): boolean {
    // 1. Cek Permission dasar
    if (!can(context, permission)) return false;

    // 2. Jika ada targetId, cek Scope
    if (targetId && !ScopeEngine.isAllowed(context, targetId)) {
      return false;
    }

    return true;
  }

  /**
   * Mengevaluasi akses lintas organisasi.
   */
  static canAccessOrg(context: SecurityContext, permission: string, orgContext: OrganizationContext): boolean {
    if (!can(context, permission)) return false;

    return ScopeEngine.isHierarchyAllowed(context, orgContext);
  }

  /**
   * Mengevaluasi apakah user adalah pemilik (owner) dari data tersebut.
   */
  static isOwner(context: SecurityContext, ownerUid: string): boolean {
    return context.user?.uid === ownerUid;
  }
}
