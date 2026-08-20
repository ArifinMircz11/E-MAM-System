import { NavigationService } from '../services/navigationService';
import { TenantContext } from '@/core/context/TenantContext';

export function useNavigation() {
  let security: any = null;
  try {
    security = TenantContext.getContext();
  } catch {
    security = null;
  }

  const context = {
    role: security?.role,
    roles: security?.roles || (security?.role ? [security.role] : []),
    permissions: Array.from(security?.permissions || []) as string[],
    scope: security?.accountType || 'global',
    accountType: security?.accountType,
    tenantId: security?.tenantId,
  };

  return {
    menus: NavigationService.resolveNavigation(context),
  };
}
