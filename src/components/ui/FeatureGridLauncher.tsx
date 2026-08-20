import React, { useState, useMemo } from 'react';
import { ViewState, UserRole } from '@/types';
import { navigationRegistry } from '@/core/navigation/navigationRegistry';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Squares2x2Icon, XMarkIcon } from '@/shared/Icons';

interface FeatureGridLauncherProps {
  onNavigate: (view: ViewState) => void;
  userRole: UserRole;
  unreadNotifCount?: number;
  unreadChatCount?: number;
  pendingLetterCount?: number;
  onClose?: () => void;
}

export const FeatureGridLauncher: React.FC<FeatureGridLauncherProps> = ({
  onNavigate,
  userRole,
  unreadNotifCount = 0,
  unreadChatCount = 0,
  pendingLetterCount = 0,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const sections = useMemo(() => {
    const rawSections = navigationRegistry.getSidebarItems(userRole);
    if (!searchQuery.trim()) return rawSections;

    const query = searchQuery.toLowerCase();
    return rawSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.label.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [userRole, searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Header & Search Bar */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 pr-12 sm:pr-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Squares2x2Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Pusat Fitur Madrasah
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Akses cepat seluruh layanan, modul, dan alat bantu sistem
            </p>
          </div>
        </div>

        {/* Instant Search Filter & Close Button Row */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari fitur atau layanan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 sm:relative sm:top-0 sm:right-0 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60 active:scale-95"
              title="Tutup menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Sections & Responsive Grid */}
      <div className="space-y-8">
        {sections.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {searchQuery.trim() 
                ? `Tidak ada fitur yang cocok dengan pencarian "${searchQuery}"`
                : "Tidak ada modul atau fitur yang tersedia untuk hak akses akun Anda saat ini."}
            </p>
          </div>
        ) : (
          sections.map((section, sIdx) => (
            <motion.div
              key={section.title || sIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: sIdx * 0.05 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {section.title}
                </h3>
                <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                {section.items.map((item, idx) => {
                  const isNotifications = item.view === ViewState.NOTIFICATIONS;
                  const isLetters = item.view === ViewState.LETTERS && item.label.includes('Masuk');
                  const isMessages = item.view === ViewState.MESSAGES;

                  const badgeCount =
                    isNotifications ? unreadNotifCount :
                    isLetters ? pendingLetterCount :
                    isMessages ? unreadChatCount : 0;

                  const IconComp = item.icon;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        item.onClick
                          ? item.onClick()
                          : item.view && onNavigate(item.view)
                      }
                      className="flex flex-col items-center gap-2 group relative p-2 rounded-2xl hover:bg-white dark:hover:bg-slate-900/60 transition-all duration-200 cursor-pointer"
                      title={item.label}
                    >
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs group-hover:shadow-md group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-all duration-200 overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <IconComp
                          className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color || 'text-slate-600 dark:text-slate-300'} transition-transform duration-200 group-hover:scale-110 group-hover:text-indigo-600 dark:group-hover:text-indigo-400`}
                        />

                        <AnimatePresence>
                          {badgeCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs z-10"
                            >
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight tracking-tight text-center line-clamp-2 w-full px-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeatureGridLauncher;
