import { SecurityContext } from '../auth/security-context';
import { WorkspaceType, WorkspaceDefinition } from './workspace.types';
import { WORKSPACE_REGISTRY } from './workspace.registry';

/**
 * WORKSPACE RESOLVER
 * 
 * Menentukan workspace mana yang harus aktif untuk pengguna saat ini.
 */

export class WorkspaceResolver {
  /**
   * Resolve workspace terbaik untuk user berdasarkan SecurityContext.
   */
  static resolve(context: SecurityContext): WorkspaceType {
    if (!context.isAuthenticated || !context.user) return 'GUEST';

    const roles = context.user.roles;

    if (roles.includes('DEVELOPER')) return 'DEVELOPER';
    if (roles.includes('KANWIL')) return 'KANWIL';
    if (roles.includes('KEMENAG')) return 'KEMENAG';
    
    // Default untuk user sekolah
    return 'MADRASAH';
  }

  /**
   * Mendapatkan definisi workspace yang aktif.
   */
  static getActiveDefinition(context: SecurityContext): WorkspaceDefinition {
    const type = this.resolve(context);
    return WORKSPACE_REGISTRY[type] || WORKSPACE_REGISTRY.MADRASAH;
  }
}
