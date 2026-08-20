import React from 'react';
import {
  BuildingLibraryIcon,
  BellIcon,
  UserIcon,
  Bars3Icon,
  RefreshCwIcon,
} from '@/shared/Icons';

interface KanwilNavbarProps {
  activeTitle?: string;
  userName?: string;
  userPhoto?: string;
  onOpenSidebar?: () => void;
  unreadNotifCount?: number;
}

export const KanwilNavbar: React.FC<KanwilNavbarProps> = ({
  activeTitle = 'Dashboard',
  userName = 'Administrator Kanwil',
  userPhoto,
  onOpenSidebar,
  unreadNotifCount = 0,
}) => {
  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-900/60 sticky top-0 z-30 shadow-md">
      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="p-2 text-emerald-300 hover:text-white lg:hidden rounded-xl hover:bg-emerald-900/50 transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shadow-inner">
              <BuildingLibraryIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-wider uppercase text-emerald-100 leading-none">
                Dashboard Kanwil
              </h1>
              <p className="text-[10px] text-emerald-400 font-medium leading-tight mt-0.5">
                Kanwil Kemenag Prov. Kalimantan Selatan
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Sync, Notif, Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              className="p-2 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-900/50 transition-colors relative"
              title="Notifikasi"
            >
              <BellIcon className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-emerald-950 animate-pulse" />
              )}
            </button>
          </div>

          <div className="h-6 w-px bg-emerald-800/60 hidden sm:block" />

          <div className="flex items-center gap-2.5 pl-1">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-700/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-200 text-xs font-bold ring-2 ring-emerald-700/50">
                {userName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-bold text-white truncate leading-none">{userName}</p>
              <span className="inline-block mt-0.5 text-[9px] font-extrabold text-emerald-300 bg-emerald-900/60 px-1.5 py-0.2 rounded border border-emerald-700/40">
                Role: Kanwil
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Bar: Breadcrumb & Context */}
      <div className="px-4 py-1.5 bg-emerald-900/40 border-t border-emerald-900/40 flex items-center justify-between text-[11px] font-medium text-emerald-300/80">
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-semibold">Dashboard Kanwil</span>
          <span>&gt;</span>
          <span className="text-white font-bold">{activeTitle}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Sistem Terhubung • Kalimantan Selatan</span>
        </div>
      </div>
    </header>
  );
};
