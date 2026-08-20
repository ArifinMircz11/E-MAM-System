import React from 'react';
import { Terminal, ChevronRight, ChevronLeft } from 'lucide-react';

export interface DeveloperSidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DeveloperSidebarHeader: React.FC<DeveloperSidebarHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div
      className={`flex items-center pb-4 border-b border-slate-800/80 ${
        isCollapsed ? 'justify-center w-full' : 'justify-between px-2'
      }`}
    >
      {!isCollapsed && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">DEV CONSOLE</h2>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Control Center</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer shrink-0"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
};
