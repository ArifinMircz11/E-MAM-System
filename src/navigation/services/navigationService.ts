import type { NavigationNode } from '../contracts/navigation.types';
import { GLOBAL_NAVIGATION_REGISTRY } from '../registries/globalNavigationRegistry';
import { FeatureFlagService } from '@/services/featureFlagService';
import { PermissionResolver } from '@/security/services/permissionResolver';
import { NAVIGATION_MODULES } from '../registries/navigationModuleRegistry';
import type { NavigationModule } from '../contracts/navigation.module';
import { navigationCacheRepository, NavigationCache } from '../repositories/NavigationCacheRepository';
import { TenantNavigationResolver } from '../context/TenantNavigationResolver';

export interface NavigationSecurityContext {
  role?: string;
  roles?: string[];
  permissions?: string[];
  scope?: string;
  accountType?: string;
  tenantId?: string;
}

export class NavigationService {
  private static CACHE_ID = 'global_navigation';
  private static CURRENT_VERSION = 1;

  static canUserAccess(item: { roles?: string[] | any[] }, userRole?: string | any): boolean {
    if (!item || !item.roles || item.roles.length === 0) {
      return true;
    }
    if (!userRole) {
      return false;
    }
    return item.roles.includes(userRole);
  }

  static async initializeCache(organizationId: string = 'global'): Promise<void> {
    const cacheId = `navigation:${this.CURRENT_VERSION}:${organizationId}`;
    const cache = await navigationCacheRepository.getCache(cacheId);
    if (!cache || cache.version < this.CURRENT_VERSION) {
      const newCache: NavigationCache = {
        id: cacheId,
        organizationId: organizationId,
        version: this.CURRENT_VERSION,
        syncedAt: Date.now(),
        data: {
          modules: NAVIGATION_MODULES.length,
          nodes: GLOBAL_NAVIGATION_REGISTRY.length
        }
      };
      await navigationCacheRepository.saveCache(newCache);
    }
  }

  static getRegistry(): NavigationNode[] {
    return GLOBAL_NAVIGATION_REGISTRY;
  }

  static getModule(id: string): NavigationModule | undefined {
    return NAVIGATION_MODULES.find(module => module.id === id);
  }

  static checkAccess(menu: NavigationNode, context: NavigationSecurityContext): boolean {
    const access = menu.access;

    if (!access) {
      return true;
    }

    if (access.organizationScopes && access.organizationScopes.length > 0) {
      const currentScope = context.scope || 'global';
      const matchesScope = 
        currentScope === 'global' || 
        access.organizationScopes.includes('global') || 
        access.organizationScopes.includes(currentScope);
      if (!matchesScope) {
        return false;
      }
    }

    if (access.accountTypes && access.accountTypes.length > 0) {
      if (context.accountType && !access.accountTypes.includes(context.accountType)) {
        return false;
      }
    }

    if (access.roles && access.roles.length > 0) {
      const userRoles = context.roles && context.roles.length > 0 
        ? context.roles 
        : (context.role ? [context.role] : []);
      
      const hasAnyRole = access.roles.some(role => 
        userRoles.includes(role) || userRoles.includes('developer')
      );
      
      if (!hasAnyRole) {
        return false;
      }
    }

    if (access.permissions && access.permissions.length > 0) {
      const userRoles = context.roles && context.roles.length > 0 
        ? context.roles 
        : (context.role ? [context.role] : []);
        
      if (!userRoles.includes('developer')) {
        const hasAnyPermission = access.permissions.some(permission => 
          PermissionResolver.hasPermission(context, permission)
        );
        if (!hasAnyPermission) {
          return false;
        }
      }
    }

    return true;
  }

  static resolveNavigation(context: NavigationSecurityContext): NavigationNode[] {
    // Integrate TenantNavigationResolver logic
    const tenantMenus = TenantNavigationResolver.resolveNavigation({
      organizationId: context.tenantId || 'global',
      roles: context.roles || [],
      permissions: context.permissions || [],
    });

    return this.getRegistry().filter((menu) => {
      if (!this.checkAccess(menu, context)) {
        return false;
      }

      if (menu.featureFlag && !FeatureFlagService.enabled(menu.featureFlag)) {
        return false;
      }

      if (menu.tenantRequired && !context.tenantId) {
        return false;
      }

      return true;
    });
  }
}
