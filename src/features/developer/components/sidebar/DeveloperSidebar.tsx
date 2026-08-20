import React, { useState, useMemo } from 'react';
import { ViewState } from '@/types';
import { SearchX } from 'lucide-react';
import { DEVELOPER_MENU_GROUPS } from '../../constants/menus';
import { DeveloperSidebarHeader } from './DeveloperSidebarHeader';
import { DeveloperSidebarSearch } from './DeveloperSidebarSearch';
import { DeveloperSidebarNavGroup } from './DeveloperSidebarNavGroup';
import { DeveloperSidebarFooter } from './DeveloperSidebarFooter';

export interface DeveloperSidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DeveloperSidebar: React.FC<DeveloperSidebarProps> = ({
  currentView,
  onNavigate,
  onClose,
  isCollapsed: propIsCollapsed = false,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isCollapsed = propIsCollapsed || internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Filter groups and items based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return DEVELOPER_MENU_GROUPS;

    const query = searchQuery.toLowerCase().trim();
    return DEVELOPER_MENU_GROUPS.map((group) => {
      const matchingItems = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
      return { ...group, items: matchingItems };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  return (
    <aside
      id="developer-sidebar"
      className={`h-full bg-slate-950 border-r border-slate-800/80 text-slate-300 flex flex-col transition-all duration-300 relative select-none z-20 ${
        isCollapsed ? 'w-20 p-3 items-center' : 'w-72 p-4'
      }`}
    >
      {/* Sidebar Header & Brand */}
      <DeveloperSidebarHeader isCollapsed={isCollapsed} onToggleCollapse={handleToggle} />

      {/* Quick Search Input (When Expanded) */}
      {!isCollapsed && (
        <DeveloperSidebarSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
        />
      )}

      {/* Navigation Groups & Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar my-2 space-y-5 w-full pr-1">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-6 px-2">
            <SearchX className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-[11px] text-slate-500 font-medium">Menu tidak ditemukan</p>
          </div>
        ) : (
          filteredGroups.map((group, groupIdx) => (
            <DeveloperSidebarNavGroup
              key={group.title || `group-${groupIdx}`}
              group={group}
              groupIdx={groupIdx}
              currentView={currentView}
              isCollapsed={isCollapsed}
              onNavigate={onNavigate}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {/* Footer Widgets: Sync Health & Impersonation Alert */}
      <DeveloperSidebarFooter isCollapsed={isCollapsed} />
    </aside>
  );
};

export default DeveloperSidebar;
