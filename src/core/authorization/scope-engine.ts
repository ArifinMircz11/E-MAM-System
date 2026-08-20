import { SecurityContext } from '../auth/security-context';
import { OrganizationContext } from '../auth/organization-context';

/**
 * SCOPE ENGINE
 * 
 * Mengevaluasi apakah sebuah aksi atau data berada dalam cakupan (scope)
 * yang diizinkan bagi pengguna berdasarkan SecurityContext.
 */

export class ScopeEngine {
  /**
   * Mengevaluasi apakah context diizinkan mengakses data milik targetId.
   */
  static isAllowed(context: SecurityContext, targetId: string): boolean {
    if (!context.isAuthenticated || !context.user) return false;
    
    // Developer memiliki akses global
    if (context.user.accountType === 'DEVELOPER') return true;

    // Cek apakah targetId adalah tenantId saat ini
    if (context.tenant?.id === targetId) return true;

    // Cek apakah targetId ada dalam daftar scope user
    return context.user.scopes.some(s => s.id === targetId);
  }

  /**
   * Mengevaluasi akses berdasarkan hierarki organisasi.
   */
  static isHierarchyAllowed(context: SecurityContext, orgContext: OrganizationContext): boolean {
    if (!context.isAuthenticated || !context.user) return false;
    if (context.user.accountType === 'DEVELOPER') return true;

    // User dari organisasi level lebih tinggi boleh mengakses data organisasi di bawahnya
    // (Misal Kanwil melihat data Madrasah di wilayahnya)
    if (context.organization?.id === orgContext.organizationId) return true;
    
    return context.user.scopes.some(s => 
      s.id === orgContext.organizationId || 
      orgContext.ancestors.includes(s.id)
    );
  }
}
