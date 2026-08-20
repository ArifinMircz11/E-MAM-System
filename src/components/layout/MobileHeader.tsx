import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '@/types';
import { UserIcon, ChevronLeftIcon } from '@/shared/Icons';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { HeaderSyncIndicator } from '@/features/dashboard/components/HeaderSyncIndicator';

interface MobileHeaderProps {
  currentView: ViewState;
  onOpenSidebar: () => void;
  onNavigate: (view: ViewState) => void;
  onBack: () => void;
  userName?: string;
  userPhoto?: string;
  unreadNotifCount?: number;
  unreadChatCount?: number;
  pendingLetterCount?: number;
  pendingApprovalCount?: number;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentView,
  onOpenSidebar,
  onNavigate,
  onBack,
  userName = '',
  userPhoto = '',
  unreadNotifCount = 0,
  unreadChatCount = 0,
  pendingLetterCount = 0,
  pendingApprovalCount = 0,
}) => {
  const isDashboard = currentView === ViewState.DASHBOARD;
  const isProfile = currentView === ViewState.PROFILE;
  const totalBadges =
    unreadNotifCount + unreadChatCount + pendingLetterCount + pendingApprovalCount;

  // View Title Mapping
  const getViewTitle = (view: ViewState) => {
    switch (view) {
      case ViewState.DASHBOARD:
        return 'Beranda';
      case ViewState.PROFILE:
        return 'Profil Saya';
      case ViewState.SETTINGS:
        return 'Pengaturan';
      case ViewState.ALL_FEATURES:
        return 'Semua Menu';
      case ViewState.NOTIFICATIONS:
        return 'Pemberitahuan';
      case ViewState.MESSAGES:
        return 'Pesan';
      case ViewState.SCHEDULE:
        return 'Jadwal';
      case ViewState.NEWS:
        return 'Berita Terkini';
      case ViewState.CLASSES:
        return 'Data Rombel';
      default:
        return 'e-Mam System';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[45] md:hidden h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-4 gap-2">
        <div className="flex items-center gap-2">
          {isDashboard ? (
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(ViewState.PROFILE)}
              className="w-9 h-9 rounded-xl bg-indigo-600 flex-shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm"
            >
              {userPhoto ? (
                <img src={userPhoto} className="w-full h-full object-cover" alt="Me" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white opacity-80" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 active:scale-95 transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </motion.button>
          )}

          <div className="flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentView}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[14px] font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none truncate"
              >
                {getViewTitle(currentView)}
              </motion.h2>
            </AnimatePresence>
            <p className="text-[7px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide leading-none mt-1">
              {userName || 'USER PROFILE'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isProfile && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate(ViewState.PROFILE)}
              className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0"
            >
              {userPhoto ? (
                <img src={userPhoto} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-500">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </motion.button>
          )}

          <div className="flex items-center gap-2">
            <HeaderSyncIndicator />
            {!isDashboard && <NotificationBell onNavigate={onNavigate} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
