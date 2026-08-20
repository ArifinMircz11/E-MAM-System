import { NavigationModule } from '../contracts/navigation.module';
import { NAVIGATION_MODULES } from '../registries/navigationModuleRegistry';
import { PermissionResolver } from '@/security/services/permissionResolver';

export class TenantNavigationResolver {
  static resolveNavigation({
    organizationId,
    roles,
    permissions,
  }: {
    organizationId: string;
    roles: string[];
    permissions: string[];
  }) {
    // Filter NAVIGATION_MODULES based on the organizationId, roles, and permissions.
    return {
      menus: NAVIGATION_MODULES.map(module => ({
        ...module,
        visible: (module.permissions || []).every(permission => 
          PermissionResolver.hasPermission({ permissions }, permission)
        ),
      })),
    };
  }
}
