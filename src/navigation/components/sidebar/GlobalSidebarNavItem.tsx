import React from 'react';
import { ViewState } from '@/types';
import * as LucideIcons from 'lucide-react';

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  section?: string;
}

export interface GlobalSidebarNavItemProps {
  item: NavigationItem;
  currentView?: ViewState;
  isCollapsed: boolean;
  onNavigate?: (view: ViewState) => void;
  onClose?: () => void;
}

export const GlobalSidebarNavItem: React.FC<GlobalSidebarNavItemProps> = ({
  item,
  currentView,
  isCollapsed,
  onNavigate,
  onClose,
}) => {
  const isActive =
    !!currentView &&
    (item.path.includes(currentView) || currentView === item.path.replace('/', ''));

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <LucideIcons.Circle className="w-4 h-4 shrink-0" />;
    const IconComponent =
      (LucideIcons as unknown as Record<string, any>)[iconName] || LucideIcons.Layers;
    return <IconComponent className="w-4 h-4 shrink-0" />;
  };

  const handleClick = () => {
    if (onNavigate) {
      const view = item.path.startsWith('/') ? item.path.substring(1) : item.path;
      onNavigate(view as ViewState);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="relative group/nav-tooltip w-full flex justify-center">
      <button
        type="button"
        title={item.title}
        onClick={handleClick}
        className={`w-full flex items-center rounded-2xl text-[11px] font-bold uppercase tracking-wide transition-all duration-250 cursor-pointer ${
          isCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'
        } ${
          isActive
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-float scale-[1.02]'
            : 'hover:bg-white dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 hover:shadow-soft'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5 truncate'}`}>
          <span
            className={
              isActive
                ? 'text-white dark:text-slate-900'
                : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'
            }
          >
            {renderIcon(item.icon)}
          </span>
          {!isCollapsed && <span className="truncate">{item.title}</span>}
        </div>
        {!isCollapsed && isActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900 shrink-0 shadow-sm" />
        )}
      </button>

      {/* Hover Tooltip when Sidebar is Collapsed */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg shadow-xl border border-slate-700/80 pointer-events-none whitespace-nowrap opacity-0 group-hover/nav-tooltip:opacity-100 transition-all duration-200 z-50 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-slate-400'}`} />
          <span>{item.title}</span>
        </div>
      )}
    </div>
  );
};
