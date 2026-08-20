import React from 'react';
import { Globe, X } from 'lucide-react';
import { TenantContext } from '@/core/context/TenantContext';

export interface GlobalSidebarHeaderProps {
  isCollapsed: boolean;
  onClose?: () => void;
  securityAccountType?: string;
}

export const GlobalSidebarHeader: React.FC<GlobalSidebarHeaderProps> = ({
  isCollapsed,
  onClose,
  securityAccountType,
}) => {
  const getTitle = () => {
    let security: any = null;
    try {
      security = TenantContext.getContext();
    } catch {
      security = null;
    }

    if (security?.isDeveloper || securityAccountType === 'developer') {
      return 'Developer Console';
    }
    if (securityAccountType === 'kanwil' || security?.roles?.includes('kanwil')) {
      return 'Kanwil Workspace';
    }
    if (securityAccountType === 'kemenag' || security?.roles?.includes('kemenag')) {
      return 'Kemenag Workspace';
    }
    return 'Global Nav';
  };

  const titleText = getTitle();

  return (
    <div
      className={`py-3.5 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center transition-all ${
        isCollapsed ? 'justify-center w-full px-0' : 'justify-between px-2'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-white dark:to-slate-100 border border-slate-800/80 dark:border-slate-200 flex items-center justify-center text-white dark:text-slate-900 shrink-0 shadow-md transition-transform hover:scale-105"
          title={titleText}
        >
          <Globe className="w-5 h-5" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <h2 className="text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-tight truncate">
              {titleText}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider">e-MAM v8.0</span>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && onClose && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 lg:hidden transition-all cursor-pointer active:scale-95"
            aria-label="Tutup sidebar"
            title="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
