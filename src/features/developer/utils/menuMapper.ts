import { NavigationMenuGroup } from '../types/Navigation';
import { DEVELOPER_MENU_GROUPS } from '../constants/menus';

export const filterMenuGroupsByRoleAndQuery = (
  groups: NavigationMenuGroup[],
  userRole?: string,
  userPermissions?: string[],
  query?: string
): NavigationMenuGroup[] => {
  const role = userRole || 'developer';
  const permissions = userPermissions || [];

  return groups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (item.roles && item.roles.length > 0) {
          const hasRole = item.roles.includes(role) || role === 'developer';
          if (!hasRole) return false;
        }
        if (item.permission && permissions.length > 0) {
          const hasPerm = permissions.includes(item.permission) || role === 'developer';
          if (!hasPerm) return false;
        }
        if (query && query.trim()) {
          const q = query.toLowerCase().trim();
          const matches =
            item.label.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
};

export const filterMenuGroupsByQuery = (
  groups: NavigationMenuGroup[],
  query: string
): NavigationMenuGroup[] => {
  if (!query || !query.trim()) return groups;
  const q = query.toLowerCase().trim();

  return groups
    .map((group) => {
      const filteredItems = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
};

export const getAllMenuItems = () => {
  return DEVELOPER_MENU_GROUPS.flatMap((group) => group.items);
};
