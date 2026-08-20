import type { Permission } from '@/types/permissions';
import { AuthorizationService } from './AuthorizationService';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: Permission;
}

export const NavigationService = {
  getNavItems: (allNavItems: NavItem[]): NavItem[] => {
    return allNavItems.filter(item => {
      if (!item.permission) return true;
      return AuthorizationService.can(item.permission);
    });
  }
};
