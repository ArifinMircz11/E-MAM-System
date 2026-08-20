import { UserRole } from '@/types';
import { ROLE_BOTTOM_NAV } from './roleNavigation';
import { ALL_FEATURES_NAV } from './featureNavigation';
import { FeatureNavItem } from './navigation.types';
import { TenantContext } from '@/core/context/TenantContext';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import { ViewState } from '@/types';

// Map ViewStates to required granular permissions for strict filtering
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

const resolveFeatureAccess = (item: FeatureNavItem, role: UserRole, isBottomNav = false): boolean => {
  try {
    // 1. Get Security Context
    const context = TenantContext.getContext();
    if (!context) return false;

    // Developer gets absolute bypass
    if (context.isDeveloper) return true;

    // 2. Check Active Role Authorized for the item
    const activeRole = role || context.role;
    if (item.roles && !item.roles.includes(activeRole)) {
      return false;
    }

    // 3. Check Granular Permissions from SecurityContext / Fallback mapping (skipped for BottomNav config allocation)
    const requiredPermission = VIEW_PERMISSION_MAP[item.view];
    if (requiredPermission && !isBottomNav) {
      const userPermissions = context.permissions;
      
      // If user permissions doesn't contain the permission, check role permissions configuration
      const hasPerm = userPermissions instanceof Set 
        ? userPermissions.has(requiredPermission as any)
        : Array.isArray(userPermissions) && userPermissions.includes(requiredPermission as any);

      if (!userPermissions || !hasPerm) {
        const rolePerms = ROLE_PERMISSIONS[activeRole];
        if (!rolePerms || !rolePerms.includes(requiredPermission as any)) {
          return false;
        }
      }
    }

    // 4. Tenant Scope Validation
    if (!context.tenantId) {
      return false;
    }

    return true;
  } catch (error) {
    // 5. Fallback check (standard role-based check) if Context is not fully established yet
    return !item.roles || item.roles.includes(role);
  }
};

export const navigationRegistry = {
  getBottomNavItems: (role?: UserRole) => {
    let effectiveRole: UserRole = role as UserRole;
    try {
      const context = TenantContext.getContext();
      if (context && context.effectiveRole) {
        effectiveRole = context.effectiveRole as UserRole;
      }
    } catch {
      // Use passed role if context is uninitialized
    }

    const baseTabs = ROLE_BOTTOM_NAV[effectiveRole] || (role ? ROLE_BOTTOM_NAV[role] : undefined) || [];
    return baseTabs.filter(tab => resolveFeatureAccess({ label: tab.label, icon: tab.icon, view: tab.view, roles: undefined }, effectiveRole, true));
  },
  
  getAllFeatures: (role: UserRole) => {
    return ALL_FEATURES_NAV.filter(item => resolveFeatureAccess(item, role));
  },

  getSidebarItems: (role: UserRole) => {
    const items = ALL_FEATURES_NAV.filter(item => resolveFeatureAccess(item, role));
    const sections: Record<string, any[]> = {};
    
    items.forEach(item => {
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
  }
};

