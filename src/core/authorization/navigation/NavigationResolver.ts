import type { SecurityContext } from '@/core/identity/security-context';
import { AuthorizationEngine } from '../engine/AuthorizationEngine';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  permission?: string;
  requiredAccountType?: 'developer' | 'madrasah';
  children?: NavItem[];
}

export class NavigationResolver {
  static resolveNavigation(context: SecurityContext, menuCatalog: NavItem[]): NavItem[] {
    if (!context || !context.isAuthenticated) {
      return [];
    }

    return menuCatalog
      .filter((item) => {
        if (item.requiredAccountType && item.requiredAccountType !== context.accountType) {
          return false;
        }
        if (item.permission) {
          const decision = AuthorizationEngine.evaluate(context, item.permission);
          return decision.allowed;
        }
        return true;
      })
      .map((item) => ({
        ...item,
        children: item.children ? NavigationResolver.resolveNavigation(context, item.children) : undefined,
      }));
  }

  /**
   * Validasi apakah target tab / menu diperbolehkan untuk role pengguna aktif.
   */
  static validateNavigationAccess(effectiveRole: string, requestedTab: string, allowedTabs: string[]): void {
    ArchitectureBoundaryEnforcer.enforceNavigation(effectiveRole, requestedTab, allowedTabs);
  }
}

