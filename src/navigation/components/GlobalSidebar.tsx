import React, { useState, useEffect, useMemo } from 'react';
import { ViewState } from '@/types';
import { navigationRegistry } from '@/core/navigation/navigationRegistry';
import { TenantContext } from '@/core/context/TenantContext';
import { useWorkspaceLayout } from '@/core/workspace/workspace.layout';
import { UserRole } from '@/types/roles';
import {
  GlobalSidebarHeader,
  GlobalSidebarNavGroup,
  GlobalSidebarFooter,
} from './sidebar';

export interface GlobalSidebarProps {
  currentView?: ViewState;
  onNavigate?: (view: ViewState) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
}

export function GlobalSidebar({
  currentView,
  onNavigate,
  onClose,
  isCollapsed: propIsCollapsed,
}: GlobalSidebarProps) {
  let security: any = null;
  try {
    security = TenantContext.getContext();
  } catch {
    security = null;
  }
  
  const { isCollapsed: contextIsCollapsed } = useWorkspaceLayout();

  // Read persisted sidebar collapse state from localStorage
  const [persistedCollapsed, setPersistedCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emam_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const isCollapsed =
    propIsCollapsed !== undefined
      ? propIsCollapsed
      : contextIsCollapsed !== undefined
      ? contextIsCollapsed
      : persistedCollapsed;

  // Persist collapse preference to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emam_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  const groupedMenus = useMemo(() => {
    const effectiveRole = security?.effectiveRole || security?.role || UserRole.TAMU;
    return navigationRegistry.getSidebarItems(effectiveRole as UserRole);
  }, [security?.effectiveRole, security?.role]);

  return (
    <div
      className={`h-full max-h-full min-h-0 w-full bg-[#F7F9FC] dark:bg-[#0B1121] border-r border-slate-200/50 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 flex flex-col gap-5 overflow-y-auto overflow-x-hidden custom-scrollbar shadow-soft transition-all duration-300 relative ${
        isCollapsed ? 'p-3 items-center' : 'p-5'
      }`}
      id="global-sidebar"
    >
      {/* Visual Swipe-Left Drag Indicator Bar for Mobile */}
      {onClose && (
        <div
          className="lg:hidden absolute right-1 top-1/2 -translate-y-1/2 w-1 h-20 bg-slate-300/80 dark:bg-slate-700/80 rounded-full flex items-center justify-center pointer-events-none"
          title="Geser kiri untuk menutup"
        />
      )}

      {/* Sidebar Header */}
      <GlobalSidebarHeader
        isCollapsed={isCollapsed}
        onClose={onClose}
        securityAccountType={(security as any)?.accountType}
      />

      {/* Sidebar Menu Groups */}
      <div className="space-y-4 flex-1 min-h-0 w-full">
        {groupedMenus.map((group, groupIdx) => (
          <GlobalSidebarNavGroup
            key={group.section || `group-${groupIdx}`}
            group={group}
            groupIdx={groupIdx}
            currentView={currentView}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
            onClose={onClose}
          />
        ))}
      </div>

      {/* Sidebar Footer */}
      <GlobalSidebarFooter isCollapsed={isCollapsed} onClose={onClose} />
    </div>
  );
}

export default GlobalSidebar;
