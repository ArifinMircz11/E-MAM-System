import React, { useEffect } from 'react';
import { ViewState } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { getSecurityContext } from '../security/contextHelper';
import { VIEW_PERMISSION_MAP } from '../navigation/navigationRegistry';
import { ROLE_PERMISSIONS } from '@/types/permissions';

interface RouteGuardProps {
  view: ViewState;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  legacyAllowedRoles?: string[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  view,
  children,
  fallback,
  legacyAllowedRoles
}) => {
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  
  // 1. Dapatkan SecurityContext
  let context = null;
  try {
    context = getSecurityContext(true);
  } catch (err) {
    // Context belum siap atau invalid
  }

  const checkAccess = () => {
    if (!context) return false;
    if (context.isDeveloper) return true;

    // 2. Cek Berdasarkan Permission Map (Boundary Utama)
    const requiredPermission = VIEW_PERMISSION_MAP[view];
    if (requiredPermission) {
      const userPermissions = context.permissions;
      const hasPerm = userPermissions instanceof Set 
        ? userPermissions.has(requiredPermission as any)
        : Array.isArray(userPermissions) && userPermissions.includes(requiredPermission as any);

      if (!userPermissions || !hasPerm) {
        // Fallback ke deklarasi role permissions
        const rolePerms = ROLE_PERMISSIONS[context.role as keyof typeof ROLE_PERMISSIONS];
        if (!rolePerms || !rolePerms.includes(requiredPermission as any)) {
          return false;
        }
      }
      return true; // Jika memenuhi permission, izinkan (meskipun legacyAllowedRoles mungkin berbeda)
    }

    // 3. Fallback jika view tidak dipetakan ke spesifik permission
    if (legacyAllowedRoles && legacyAllowedRoles.length > 0) {
      return legacyAllowedRoles.some(r => context.roles?.includes(r) || r === context.role);
    }

    // Default reject
    return false;
  };

  const isAllowed = checkAccess();

  useEffect(() => {
    if (!context) {
      setCurrentView(ViewState.LOGIN);
      return;
    }
    
    if (!isAllowed) {
      console.warn(`[RouteGuard] Access denied for view ${view}. SecurityContext reject.`);
      setCurrentView(ViewState.DASHBOARD);
    }
  }, [context, view, isAllowed, setCurrentView]);

  if (!context || !isAllowed) {
    return (fallback as any) || null;
  }

  return <>{children}</>;
};
