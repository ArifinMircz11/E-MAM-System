import { UserRole } from '@/types';
import { ROLE_BOTTOM_NAV } from './roleNavigation';
import { ALL_FEATURES_NAV } from './featureNavigation';
import { FeatureNavItem } from './navigation.types';
import { TenantContext } from '@/core/context/TenantContext';
import { ViewState } from '@/types';
import { canAccess } from '@/core/authorization/authorizationResolver';

export const VIEW_PERMISSION_MAP: Record<string, string> = {
  [ViewState.USERS]: 'user.read',
  [ViewState.MADRASAH_MASTER]: 'developer.access',
  [ViewState.TEACHERS]: 'teacher.read',
  [ViewState.STUDENTS]: 'student.read',
  [ViewState.CLASSES]: 'class.read',
  [ViewState.ACADEMIC_YEAR]: 'class.read',
  [ViewState.PROMOTION]: 'class.write',
  [ViewState.SCANNER]: 'attendance.write',
  [ViewState.ATTENDANCE_HISTORY]: 'attendance.read',
  [ViewState.TEACHER_ATTENDANCE]: 'teacher.read',
  [ViewState.LETTERS]: 'letter.read',
  [ViewState.ACCOUNT_APPROVAL]: 'user.read',
  [ViewState.POINT_CATEGORIES]: 'point.read',
  [ViewState.POINTS]: 'point.read',
  [ViewState.DEVELOPER]: 'developer.console',
  [ViewState.KANWIL_DASHBOARD]: 'kanwil.access',
  [ViewState.KEMENAG_HUB]: 'kemenag.access',
  [ViewState.KANWIL_SATUAN_KERJA]: 'kanwil.access',
};

const resolveFeatureAccess = (item: FeatureNavItem, _role: UserRole, isBottomNav = false): boolean => {
  try {
    const context = TenantContext.getContext();
    if (!context) return false;
    return canAccess({
      roles: item.roles,
      permission: isBottomNav ? undefined : VIEW_PERMISSION_MAP[item.view],
    }, context);
  } catch {
    return false;
  }
};

export const navigationRegistry = {
  getBottomNavItems: (role?: UserRole) => {
    let effectiveRole: UserRole = role as UserRole;
    try {
      const context = TenantContext.getContext();
      if (context?.effectiveRole) effectiveRole = context.effectiveRole as UserRole;
    } catch {
      // Use supplied role when context is unavailable.
    }
    const baseTabs = ROLE_BOTTOM_NAV[effectiveRole] || (role ? ROLE_BOTTOM_NAV[role] : undefined) || [];
    return baseTabs.filter((tab) =>
      resolveFeatureAccess({ label: tab.label, icon: tab.icon, view: tab.view, roles: undefined }, effectiveRole, true),
    );
  },

  getAllFeatures: (role: UserRole) => ALL_FEATURES_NAV.filter((item) => resolveFeatureAccess(item, role)),

  getSidebarItems: (role: UserRole) => {
    const items = ALL_FEATURES_NAV.filter((item) => resolveFeatureAccess(item, role));
    const sections: Record<string, any[]> = {};
    items.forEach((item) => {
      const section = item.section || 'Lainnya';
      if (!sections[section]) sections[section] = [];
      sections[section].push({
        id: `${item.view}-${item.label.toLowerCase().replace(/\s+/g, '-')}`,
        title: item.label,
        label: item.label,
        path: item.view,
        view: item.view,
        icon: item.icon,
        section: item.section,
        roles: item.roles,
      });
    });
    return Object.entries(sections).map(([title, items]) => ({ title, section: title, items }));
  },
};
