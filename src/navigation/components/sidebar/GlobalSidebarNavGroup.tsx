import React from 'react';
import { ViewState } from '@/types';
import { GlobalSidebarNavItem, NavigationItem } from './GlobalSidebarNavItem';

export interface NavigationGroup {
  section?: string;
  items: NavigationItem[];
}

export interface GlobalSidebarNavGroupProps {
  group: NavigationGroup;
  groupIdx: number;
  currentView?: ViewState;
  isCollapsed: boolean;
  onNavigate?: (view: ViewState) => void;
  onClose?: () => void;
}

export const GlobalSidebarNavGroup: React.FC<GlobalSidebarNavGroupProps> = ({
  group,
  groupIdx,
  currentView,
  isCollapsed,
  onNavigate,
  onClose,
}) => {
  return (
    <div className="space-y-1">
      {!isCollapsed && group.section && (
        <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {group.section}
        </div>
      )}

      {isCollapsed && groupIdx > 0 && (
        <div className="my-2 border-t border-slate-200/60 dark:border-slate-800/80 w-full" />
      )}

      <div className="space-y-1">
        {group.items.map((item) => (
          <GlobalSidebarNavItem
            key={item.id}
            item={item}
            currentView={currentView}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
};
