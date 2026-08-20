import React from 'react';
import type { UserRole } from '@/types';
import { ViewState } from '@/types';
import {
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@/shared/Icons';
import { roleIcons, getRoleScope } from '@/constants/dashboard';
import { useSyncStore } from '@/stores/syncStore';
import { useTenantStore } from '@/stores/tenantStore';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { HeaderSyncIndicator } from './HeaderSyncIndicator';
import { useImpersonation } from '@/core/impersonation';
import { ArrowLeftRight } from 'lucide-react';

interface DashboardHeaderProps {
  onNavigate: (view: ViewState) => void;
  onOpenSidebar?: () => void;
  userName: string;
  userPhoto: string;
  userRole: UserRole;
  roleLabels: Record<string, string>;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  unreadNotifCount: number;
  unreadChatCount: number;
  pendingLetterCount: number;
  tenantData: any;
  referenceId?: string | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onNavigate,
  onOpenSidebar,
  userName,
  userPhoto,
  userRole,
  roleLabels,
  isDarkMode,
  onToggleTheme,
  unreadNotifCount,
  unreadChatCount,
  pendingLetterCount,
  tenantData,
  referenceId,
}) => {
  const { isImpersonating, stopImpersonation } = useImpersonation();
  const pendingWritesCount = useSyncStore((state) => state.pendingWritesCount);
  const { config: tenantConfig } = useTenantStore();
  const totalBadges = unreadNotifCount + unreadChatCount + pendingLetterCount;

  const fullTenantName =
    tenantData?.namaSekolah || tenantConfig?.namaSekolah || 'MAN 1 Hulu Sungai Tengah';
  const tenantNameShort = fullTenantName.includes('Hulu Sungai Tengah')
    ? fullTenantName.replace('Hulu Sungai Tengah', 'HST')
    : fullTenantName;

  return (
    <header className="px-4 md:px-5 min-h-[72px] safe-pt py-3 md:py-0 bg-[#F7F9FC] dark:bg-[#0B1121] border-b border-slate-100 dark:border-slate-900 relative shrink-0 flex flex-col justify-center">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="relative z-10 flex justify-between items-center h-full max-w-7xl mx-auto gap-3 w-full">
        {/* --- MOBILE SIDEBAR TOGGLE --- */}
        <button
          onClick={onOpenSidebar}
          className="hidden p-2 rounded-2xl bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800 shadow-soft active:scale-95 transition-all relative shrink-0"
        >
          <div className="flex flex-col gap-1 w-5">
            <span className="h-0.5 w-full bg-current rounded-full" />
            <span className="h-0.5 w-3/4 bg-current rounded-full" />
            <span className="h-0.5 w-full bg-current rounded-full" />
          </div>
          {totalBadges > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-slate-900 animate-pulse" />
          )}
        </button>

        {/* --- HEADER CONTEXT BREADCRUMB --- */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {isImpersonating && (
            <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-extrabold uppercase tracking-wide shadow-soft animate-pulse">
              ⚡ IMPERSONATION MODE ({tenantNameShort})
            </span>
          )}
          <span className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-[10px] uppercase font-bold tracking-wide shadow-soft">
            Platform
          </span>
          <span className="text-slate-300 dark:text-slate-700">➔</span>
          <span className="flex items-center gap-1 px-3 py-1 bg-indigo-50/50 dark:bg-indigo-950/25 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            🏫 {tenantNameShort}
          </span>
          <span className="text-slate-300 dark:text-slate-700">➔</span>
          {(() => {
            const scope = getRoleScope(userRole);
            return (
              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-bold uppercase tracking-wide shadow-soft ${scope.color} bg-white dark:bg-slate-900/40`}
              >
                {scope.symbol} {roleLabels[userRole] || userRole}
              </span>
            );
          })()}
        </div>

        {/* --- SPACER FOR LAYOUT --- */}
        <div className="flex-1" />

        <div className="flex items-center justify-end flex-1 gap-2 md:gap-4 overflow-hidden">
          {/* --- DATA SYNC INDICATOR --- */}
          <HeaderSyncIndicator />

          {/* --- USER PROFILE SECTION --- */}
          <div
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-soft group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer min-w-0"
            onClick={() => onNavigate(ViewState.PROFILE)}
          >
            <div className="flex flex-col items-end min-w-0">
              <span className="text-[11px] md:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] md:max-w-[200px] capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {userName || 'User Profile'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {(() => {
                  const IconComp = roleIcons[userRole] || ShieldCheckIcon;
                  return <IconComp className="w-2.5 h-2.5 text-emerald-500 shrink-0" />;
                })()}
                <span className="text-[8px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors truncate">
                  {roleLabels[userRole] || userRole}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  className="w-full h-full object-cover"
                  alt="User"
                  onError={(e) => {
                    (e.target as any).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&bold=true`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                  <UserIcon className="w-5 h-5 text-indigo-400" />
                </div>
              )}
            </div>
          </div>

          {/* --- ACTION SECTION --- */}
          <div className="flex items-center gap-2 md:gap-3">
            {isImpersonating && (
              <button
                onClick={stopImpersonation}
                title="Kembali sebagai Developer"
                className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wide shadow-float transition-all duration-200 active:scale-95 cursor-pointer border border-slate-800 dark:border-slate-200 shrink-0"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kembali Developer</span>
              </button>
            )}

            <button
              onClick={onToggleTheme}
              className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/50 dark:border-slate-800 shadow-soft shrink-0"
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-amber-500" />
              ) : (
                <MoonIcon className="w-5 h-5 text-indigo-500" />
              )}
            </button>

            <NotificationBell onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
