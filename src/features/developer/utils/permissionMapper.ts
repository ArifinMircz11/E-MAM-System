import { DEVELOPER_PERMISSIONS } from '../constants/permissions';

export const mapRoleToDeveloperPermissions = (role: string): string[] => {
  if (role === 'developer' || role === 'dev') {
    return Object.values(DEVELOPER_PERMISSIONS);
  }
  return [];
};

export const canAccessDeveloperTab = (tabKey: string, userPermissions: string[]): boolean => {
  if (userPermissions.includes(DEVELOPER_PERMISSIONS.CONSOLE_ACCESS)) {
    return true;
  }
  return false;
};
