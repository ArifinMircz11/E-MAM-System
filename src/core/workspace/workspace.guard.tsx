import React, { useEffect } from 'react';
import { WorkspaceType } from './workspace.types';
import { WorkspaceResolver } from './workspace.resolver';
import { sessionProvider } from '../auth/session-provider';
import { useUIStore } from '@/stores/uiStore';
import { ViewState } from '@/types';

/**
 * WORKSPACE GUARD
 * 
 * Memastikan pengguna berada di workspace yang diizinkan.
 * Jika tidak, akan mengarahkan ke workspace default atau login.
 */

interface WorkspaceGuardProps {
  requiredWorkspace: WorkspaceType;
  children: React.ReactNode;
  fallbackView?: ViewState;
}

export const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({
  requiredWorkspace,
  children,
  fallbackView = ViewState.DASHBOARD
}) => {
  const context = sessionProvider.getContext();
  const activeWorkspace = WorkspaceResolver.resolve(context);
  const setCurrentView = useUIStore((state) => state.setCurrentView);

  useEffect(() => {
    if (!context.isAuthenticated) {
      setCurrentView(ViewState.LOGIN);
      return;
    }

    if (activeWorkspace !== requiredWorkspace && context.user?.accountType !== 'DEVELOPER') {
      console.warn(`[WorkspaceGuard] Unauthorized access to workspace: ${requiredWorkspace}. User is in ${activeWorkspace}`);
      setCurrentView(fallbackView);
    }
  }, [context, activeWorkspace, requiredWorkspace, setCurrentView, fallbackView]);

  if (!context.isAuthenticated || (activeWorkspace !== requiredWorkspace && context.user?.accountType !== 'DEVELOPER')) {
    return null;
  }

  return <>{children}</>;
};
