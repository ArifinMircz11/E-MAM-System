import React from 'react';
import { ViewState } from '@/types';
import { NavigationMenuItem } from '../../types/Navigation';
import * as LucideIcons from 'lucide-react';

export interface DeveloperSidebarNavItemProps {
  item: NavigationMenuItem;
  currentView: ViewState;
  isCollapsed: boolean;
  onNavigate: (view: ViewState) => void;
  onClose?: () => void;
}

export const DeveloperSidebarNavItem: React.FC<DeveloperSidebarNavItemProps> = ({
  item,
  currentView,
  isCollapsed,
  onNavigate,
  onClose,
}) => {
  const targetView = item.viewState || ViewState.DEV_DASHBOARD;
  const isActive = currentView === targetView;

  // Render icon dynamically with fallback
  const renderIcon = (iconName?: string) => {
    if (!iconName) return <LucideIcons.Terminal className="w-4 h-4 shrink-0" />;
    const IconComponent =
      (LucideIcons as unknown as Record<string, any>)[iconName] || LucideIcons.Layers;
    return <IconComponent className="w-4 h-4 shrink-0" />;
  };

  const handleClick = () => {
    onNavigate(targetView);
    if (onClose) onClose();
  };

  return (
    <div className="relative group/dev-item w-full">
      <button
        type="button"
        onClick={handleClick}
        title={item.label}
        className={`w-full flex items-center transition-all duration-200 rounded-xl cursor-pointer ${
          isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
        } ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-lg shadow-indigo-950/50'
            : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 truncate'}`}>
          <span className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover/dev-item:text-slate-300 transition-colors'}>
            {renderIcon(item.iconName)}
          </span>
          {!isCollapsed && (
            <span className="text-xs truncate tracking-wide font-medium">{item.label}</span>
          )}
        </div>

        {!isCollapsed && isActive && (
          <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/80 animate-pulse" />
        )}
      </button>

      {/* Floating Tooltip for Collapsed Mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-slate-100 text-xs font-semibold rounded-lg shadow-xl border border-slate-800 pointer-events-none whitespace-nowrap opacity-0 group-hover/dev-item:opacity-100 transition-all duration-200 z-50 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-slate-500'}`} />
          <span>{item.label}</span>
        </div>
      )}
    </div>
  );
};
