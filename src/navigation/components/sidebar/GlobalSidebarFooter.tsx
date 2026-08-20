import React from 'react';
import { ShieldAlert, ArrowLeftRight } from 'lucide-react';
import { useImpersonation } from '@/core/impersonation';
import { SidebarSyncWidget } from '../SidebarSyncWidget';

export interface GlobalSidebarFooterProps {
  isCollapsed: boolean;
  onClose?: () => void;
}

export const GlobalSidebarFooter: React.FC<GlobalSidebarFooterProps> = ({
  isCollapsed,
  onClose,
}) => {
  const { isImpersonating, stopImpersonation } = useImpersonation();

  const handleStopImpersonation = async () => {
    await stopImpersonation();
    if (onClose) onClose();
  };

  return (
    <div className="mt-auto flex flex-col gap-3">
      <SidebarSyncWidget isCollapsed={isCollapsed} />

      {isImpersonating && (
        <div
          className={`border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-3xl shadow-soft ${
            isCollapsed ? 'p-3 flex flex-col items-center justify-center' : 'p-4 flex flex-col gap-3'
          }`}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={handleStopImpersonation}
              title="Keluar Mode Impersonasi"
              aria-label="Stop impersonation mode"
              className="p-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-all shadow-float cursor-pointer active:scale-95"
            >
              <ShieldAlert className="w-5 h-5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-slate-900 dark:text-white tracking-wide">
                  Developer Mode
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Anda sedang dalam mode simulasi akun.
              </p>
              <button
                type="button"
                onClick={handleStopImpersonation}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-[11px] uppercase tracking-wide py-3 px-4 rounded-2xl transition-all shadow-float active:scale-[0.98] cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Hentikan</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
