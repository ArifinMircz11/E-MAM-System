import React, { useEffect } from 'react';
import { ViewState } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { getSecurityContext } from '../security/contextHelper';
import { VIEW_PERMISSION_MAP } from '../navigation/navigationRegistry';
import { canAccess } from './authorizationResolver';

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
  legacyAllowedRoles,
}) => {
  const setCurrentView = useUIStore((state) => state.setCurrentView);

  let context = null;
  try {
    context = getSecurityContext(false);
  } catch {
    context = null;
  }

  const requiredPermission = VIEW_PERMISSION_MAP[view];
  const isAllowed = Boolean(
    context && canAccess({ permission: requiredPermission, roles: legacyAllowedRoles }, context),
  );

  useEffect(() => {
    if (!context) {
      setCurrentView(ViewState.LOGIN);
      return;
    }
    if (!isAllowed) {
      console.warn(`[RouteGuard] Access denied for view ${view}.`);
      setCurrentView(ViewState.DASHBOARD);
    }
  }, [context, view, isAllowed, setCurrentView]);

  if (!context || !isAllowed) return (fallback as any) || null;
  return <>{children}</>;
};
