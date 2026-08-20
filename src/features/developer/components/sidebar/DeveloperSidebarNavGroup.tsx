import React from 'react';
import { ViewState } from '@/types';
import { NavigationMenuGroup } from '../../types/Navigation';
import { DeveloperSidebarNavItem } from './DeveloperSidebarNavItem';

export interface DeveloperSidebarNavGroupProps {
  group: NavigationMenuGroup;
  groupIdx: number;
  currentView: ViewState;
  isCollapsed: boolean;
  onNavigate: (view: ViewState) => void;
  onClose?: () => void;
}

export const DeveloperSidebarNavGroup: React.FC<DeveloperSidebarNavGroupProps> = ({
  group,
  groupIdx,
  currentView,
  isCollapsed,
  onNavigate,
  onClose,
}) => {
  return (
    <div className="space-y-1.5">
      {!isCollapsed && group.title && (
        <div className="px-2 py-1 text-[10px] font-black text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
          <span>{group.title}</span>
        </div>
      )}

      {isCollapsed && groupIdx > 0 && (
        <div className="my-2 border-t border-slate-800/80 w-full" />
      )}

      <div className="space-y-1">
        {group.items.map((item) => (
          <DeveloperSidebarNavItem
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
