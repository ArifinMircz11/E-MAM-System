import React, { useState } from 'react';
import type { UserRole } from '@/types';
import { ViewState } from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUIStore } from '@/stores/uiStore';
import { Home, Bell, User, LogOut, Search, LayoutGrid } from 'lucide-react';
import { OfflineSyncIndicator } from '@/features/developer/components/OfflineSyncIndicator';
import { LocalSearchPalette } from '@/components/ui/LocalSearchPalette';

interface GlobalSystemBarProps {
  onNavigate: (view: ViewState) => void;
  onLogout: () => Promise<void>;
  userRole: UserRole;
  userPhoto?: string | null;
  userName?: string | null;
}

export const GlobalSystemBar: React.FC<GlobalSystemBarProps> = ({
  onNavigate,
  onLogout,
  userRole,
  userPhoto,
  userName,
}) => {
  const unreadNotif = useNotificationStore((state) => state.unreadCount);
  const unreadChat = useNotificationStore((state) => state.unreadChatCount);
  const pendingLetters = useNotificationStore((state) => state.pendingLetterCount);
  const totalNotif = unreadNotif + unreadChat + pendingLetters;
  const currentView = useUIStore((state) => state.currentView);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <div className="w-full shrink-0 z-40 bg-[#0B1121] text-slate-100 border-b border-indigo-950 px-4 py-2.5 flex items-center justify-between select-none font-sans shadow-md relative">
        <div className="absolute inset-0 bg-[#070b13] opacity-40 z-[-1]" />

        {/* Brand logo */}
        <div
          onClick={() => onNavigate(ViewState.DASHBOARD)}
          className="flex items-center gap-2 cursor-pointer group shrink-0 active:scale-95 transition-all"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <h1 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase font-sans">
            e-Mam <span className="text-indigo-400">System</span>
          </h1>
          <div className="hidden sm:block px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/20 text-[7px] font-bold uppercase text-indigo-300 tracking-wider">
            v8.0 Global
          </div>
        </div>

        {/* Navigation middle buttons & Sync Indicator */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            title="Pencarian Cepat Lokal (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Cari Cepat</span>
            <kbd className="hidden md:inline px-1 py-0.5 bg-slate-900 text-[8px] text-slate-400 rounded border border-slate-800 font-mono">⌘K</kbd>
          </button>

          <OfflineSyncIndicator />

          <button
            onClick={() => onNavigate(ViewState.DASHBOARD)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 leading-none cursor-pointer ${
              currentView === ViewState.DASHBOARD
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Home</span>
          </button>

          <button
            onClick={() => onNavigate(ViewState.ALL_FEATURES)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 leading-none cursor-pointer ${
              currentView === ViewState.ALL_FEATURES
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
            title="Semua Fitur"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Semua</span>
          </button>

          <button
            onClick={() => onNavigate(ViewState.NOTIFICATIONS)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 leading-none relative cursor-pointer ${
              currentView === ViewState.NOTIFICATIONS
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Notif</span>
            {totalNotif > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[7px] font-bold min-w-[12px] text-center animate-pulse">
                {totalNotif}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate(ViewState.PROFILE)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 leading-none cursor-pointer ${
              currentView === ViewState.PROFILE
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Profil</span>
          </button>
        </div>

        {/* Logout button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 leading-none cursor-pointer"
            title="Keluar dari sistem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Keluar</span>
          </button>
        </div>
      </div>

      <LocalSearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

