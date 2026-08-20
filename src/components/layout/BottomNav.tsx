import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, UserRole } from '@/types';
import { navigationRegistry } from '@/core/navigation/navigationRegistry';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { FeatureGridLauncher } from '@/components/ui/FeatureGridLauncher';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  userRole: UserRole;
  unreadNotifCount: number;
  unreadChatCount: number;
  pendingLetterCount: number;
  pendingApprovalCount: number;
  remainingSessionsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  userRole,
  unreadNotifCount,
  unreadChatCount,
  pendingLetterCount,
  pendingApprovalCount,
  remainingSessionsCount = 0,
}) => {
  const [isClosed, setIsClosed] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  // Auto-restore bottom nav when view changes
  useEffect(() => {
    setIsClosed(false);
    setIsLauncherOpen(false);
  }, [currentView]);

  const baseTabs = navigationRegistry.getBottomNavItems(userRole);

  let totalBadges = 0;
  const tabs = baseTabs.map((tab) => {
    let badgeCount = 0;
    if (tab.view === ViewState.NOTIFICATIONS) badgeCount = unreadNotifCount;
    if (tab.view === ViewState.LETTERS) badgeCount = pendingLetterCount;
    if (tab.view === ViewState.MESSAGES) badgeCount = unreadChatCount;
    if (tab.view === ViewState.SCANNER || tab.view === ViewState.ATTENDANCE_HISTORY) badgeCount = remainingSessionsCount;
    
    totalBadges += badgeCount;
    return { ...tab, badgeCount };
  });

  return (
    <>
      <AnimatePresence mode="wait">
        {isClosed ? (
          /* Floating Restore Trigger when BottomNav is closed/minimized */
          <motion.div
            key="bottomNavRestoreTrigger"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              onClick={() => setIsClosed(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 backdrop-blur-md rounded-full shadow-2xl border border-slate-700/50 dark:border-slate-200/50 text-xs font-bold tracking-wide transition-all active:scale-95 cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-100"
              title="Tampilkan kembali navigasi (Ketuk / Geser)"
            >
              <ChevronUp className="w-4 h-4 animate-bounce text-indigo-400 dark:text-indigo-600" />
              <span>Navigasi</span>
              {totalBadges > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">
                  {totalBadges > 99 ? '99+' : totalBadges}
                </span>
              )}
            </button>
          </motion.div>
        ) : (
          /* Draggable Bottom Navigation Bar */
          <motion.nav
            key="bottomNavContent"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 120 }}
            dragElastic={{ top: 0, bottom: 0.1 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 40 || info.velocity.y > 180) {
                setIsClosed(true);
              }
            }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1121]/95 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] touch-pan-x"
          >
            {/* Top Swipe-to-Close Drag Handle */}
            <div
              onClick={() => setIsClosed(true)}
              className="w-full flex justify-center pt-2 pb-1.5 cursor-grab active:cursor-grabbing group"
              title="Tarik ke bawah untuk menutup navigasi"
            >
              <div className="w-10 h-1 rounded-full bg-slate-300/80 dark:bg-slate-700/80 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 transition-all flex items-center justify-center">
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex justify-around items-center h-14 max-w-md mx-auto">
              {tabs.map((tab, idx) => {
                const isSemua = tab.view === ViewState.ALL_FEATURES;
                const isActive = isSemua ? isLauncherOpen : (currentView === tab.view && !isLauncherOpen);
                const Icon = tab.icon;

                const handleTabClick = () => {
                  if (isSemua) {
                    setIsLauncherOpen((prev) => !prev);
                  } else {
                    setIsLauncherOpen(false);
                    onNavigate(tab.view);
                  }
                };

                return (
                  <button
                    key={idx}
                    onClick={handleTabClick}
                    className={`flex flex-col items-center justify-center flex-1 py-1 relative min-h-[44px] transition-all duration-200 group cursor-pointer ${
                      isActive
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {/* Active Spring Indicator Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavActiveIndicator"
                        className="absolute -top-1 w-7 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    <div className="relative flex items-center justify-center">
                      <div
                        className={`p-1.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 scale-105'
                            : 'group-hover:scale-105'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 transition-transform duration-200 ${
                            isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'
                          }`}
                        />
                      </div>

                      {/* Badge Alert */}
                      {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                        <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold h-4 min-w-4 px-1 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-[#0B1121]">
                          {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                        </span>
                      )}
                    </div>

                    {/* Icon Label / Description */}
                    <span
                      className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-200 text-center line-clamp-1 ${
                        isActive
                          ? 'font-extrabold text-indigo-600 dark:text-indigo-400'
                          : 'font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Full-screen overlay Launcher */}
      <AnimatePresence>
        {isLauncherOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/65 dark:bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="min-h-screen w-full px-4 pt-10 pb-24 flex items-start justify-center"
            >
              <div className="w-full max-w-6xl">
                <FeatureGridLauncher
                  userRole={userRole}
                  onNavigate={(view) => {
                    setIsLauncherOpen(false);
                    onNavigate(view);
                  }}
                  unreadNotifCount={unreadNotifCount}
                  unreadChatCount={unreadChatCount}
                  pendingLetterCount={pendingLetterCount}
                  onClose={() => setIsLauncherOpen(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
