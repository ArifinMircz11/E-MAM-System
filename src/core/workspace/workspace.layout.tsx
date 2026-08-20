import React, { useState, createContext, useContext } from 'react';
import { WorkspaceDefinition } from './workspace.types';
import { PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * WORKSPACE LAYOUT
 * 
 * Shell UI dasar untuk setiap Workspace.
 * Menyediakan struktur Sidebar, Header, dan Content Area.
 * Dilengkapi dengan tombol toggle collapse/expand untuk menghemat ruang layar.
 */

export interface WorkspaceLayoutContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const WorkspaceLayoutContext = createContext<WorkspaceLayoutContextType>({
  isCollapsed: false,
  toggleCollapse: () => {},
  setCollapsed: () => {},
});

export const useWorkspaceLayout = () => useContext(WorkspaceLayoutContext);

export interface WorkspaceLayoutProps {
  workspace: WorkspaceDefinition;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  isCollapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  className?: string;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  workspace,
  sidebar,
  header,
  children,
  isCollapsed: controlledCollapsed,
  defaultCollapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emam_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    }
    return defaultCollapsed;
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emam_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  const handleToggle = () => {
    const nextState = !isCollapsed;
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(nextState);
    }
    onToggleCollapse?.(nextState);
  };

  return (
    <WorkspaceLayoutContext.Provider
      value={{
        isCollapsed,
        toggleCollapse: handleToggle,
        setCollapsed: (c) => {
          if (controlledCollapsed === undefined) setInternalCollapsed(c);
          onToggleCollapse?.(c);
        },
      }}
    >
      <div
        className={`workspace-${workspace.id.toLowerCase()} h-full w-full flex overflow-hidden relative ${className}`}
        id="workspace-layout-container"
      >
        {/* Sidebar Area */}
        {sidebar && (
          <motion.aside
            layout
            initial={false}
            animate={{ width: isCollapsed ? 64 : 280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full hidden lg:flex flex-col shrink-0 relative border-r border-slate-800/80 bg-slate-900 z-30 group overflow-hidden"
            id="workspace-sidebar"
          >
            {/* Collapse Toggle Button Header Bar */}
            <div
              className={`h-12 border-b border-slate-800/80 flex items-center shrink-0 px-3 bg-slate-900/90 backdrop-blur-sm ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              {!isCollapsed && (
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate">
                    {workspace.label}
                  </span>
                </div>
              )}
              <div className="relative group/toggle-tooltip flex items-center">
                <button
                  onClick={handleToggle}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  title={isCollapsed ? `Buka Sidebar (${workspace.label})` : 'Ciutkan Sidebar'}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  id="workspace-sidebar-toggle-btn"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5 text-slate-400 hover:text-white" />
                  )}
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg shadow-xl border border-slate-700/80 pointer-events-none whitespace-nowrap opacity-0 group-hover/toggle-tooltip:opacity-100 transition-all duration-200 z-50 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span>{isCollapsed ? `Buka Sidebar (${workspace.label})` : 'Ciutkan Sidebar'}</span>
                </div>
              </div>
            </div>

            {/* Floating Border Edge Toggle Button for quick access */}
            <button
              onClick={handleToggle}
              className="absolute -right-3.5 top-14 z-40 hidden lg:flex items-center justify-center w-7 h-7 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 rounded-full shadow-md transition-all duration-200 cursor-pointer focus:outline-none hover:scale-110"
              title={isCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              id="workspace-sidebar-floating-toggle-btn"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Sidebar Content */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? 'overflow-x-hidden' : ''}`}>
              {sidebar}
            </div>
          </motion.aside>
        )}

        {/* Main Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0" id="workspace-main-content">
          {/* Header Area */}
          {header && (
            <header className="h-16 shrink-0 z-20 flex items-center">
              {header}
            </header>
          )}

          {/* Floating Expand Toggle Button when sidebar exists and is collapsed without header */}
          {sidebar && isCollapsed && !header && (
            <button
              onClick={handleToggle}
              className="absolute top-3 left-3 z-30 p-2 bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl shadow-lg hover:bg-indigo-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden cursor-pointer"
              title="Buka Sidebar"
              aria-label="Expand sidebar"
              id="workspace-mobile-expand-toggle-btn"
            >
              <PanelLeftOpen className="w-5 h-5 text-indigo-400" />
            </button>
          )}

          {/* Content Area */}
          <section className="flex-1 overflow-y-auto relative p-4 lg:p-6">
            {children}
          </section>
        </main>
      </div>
    </WorkspaceLayoutContext.Provider>
  );
};

