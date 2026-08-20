import React from 'react';
import { ShieldAlert, ArrowLeftRight } from 'lucide-react';
import { useImpersonation } from '@/core/impersonation';
import { SidebarSyncWidget } from '@/navigation/components/SidebarSyncWidget';

export interface DeveloperSidebarFooterProps {
  isCollapsed: boolean;
}

export const DeveloperSidebarFooter: React.FC<DeveloperSidebarFooterProps> = ({ isCollapsed }) => {
  const { isImpersonating, stopImpersonation } = useImpersonation();

  return (
    <div className="mt-auto pt-3 border-t border-slate-800/80 space-y-2 w-full">
      <SidebarSyncWidget isCollapsed={isCollapsed} />

      {isImpersonating && (
        <div
          className={`bg-rose-950/40 border border-rose-800/50 rounded-xl transition-all ${
            isCollapsed ? 'p-2.5 flex justify-center' : 'p-3 space-y-2'
          }`}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => stopImpersonation()}
              title="Keluar Mode Impersonasi"
              className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider">
                  Impersonasi Aktif
                </span>
              </div>
              <button
                type="button"
                onClick={() => stopImpersonation()}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition-all shadow cursor-pointer"
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
