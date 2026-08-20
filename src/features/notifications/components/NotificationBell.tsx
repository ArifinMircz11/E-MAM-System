import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  ShieldAlert,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Check,
  RefreshCw,
  Cloud,
  CloudOff,
  ChevronRight,
  UserCheck,
  LayoutGrid,
  Zap,
  History,
  CreditCard,
  Grid3X3,
  Star,
} from 'lucide-react';
import type { AppNotification } from '@/types';
import { ViewState, UserRole } from '@/types';
import { useAttention } from '@/hooks/useAttention';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useSyncStore } from '@/stores/syncStore';
import { getNotificationCenterData, markNotificationAsRead } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import { toast } from 'sonner';

interface NotificationBellProps {
  onNavigate: (view: ViewState) => void;
  [key: string]: any;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const roles = useUserStore((state) => state.roles || []);
  const userRole = useUserStore((state) => state.role);
  const primaryRole = (userRole as UserRole) || (roles[0] as UserRole) || UserRole.TAMU;

  // Sync Store info
  const pendingWritesCount = useSyncStore((state) => state.pendingWritesCount);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const lastSync = useSyncStore((state) => state.lastSync);

  // Attention Items Hook
  const {
    attentionItems,
    isLoading: loadingAttention,
    refresh: refreshAttention,
  } = useAttention(primaryRole, user?.uid || null);

  // Informational notifications state
  const [infoNotifs, setInfoNotifs] = useState<AppNotification[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Load and sync informational notifications
  const loadInfoNotifications = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingInfo(true);
    try {
      const data = await getNotificationCenterData();
      // Filter out notifications that are chat-related or already mapped as high-priority action items
      const filtered = data.filter((n) => n.type === 'info' || n.type === 'transaksi');
      setInfoNotifs(filtered.slice(0, 5)); // Keep latest 5 for dropdown density
    } catch (err) {
      console.warn('Gagal memuat notifikasi informasi:', err);
    } finally {
      setLoadingInfo(false);
    }
  }, [user?.uid, primaryRole]);

  // Click outside listener to auto-close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      refreshAttention();
      loadInfoNotifications();
    }
  }, [isOpen, refreshAttention, loadInfoNotifications]);

  // Total Actionable Count (The Badge Count)
  // Counts only items requiring user action + offline sync items if any
  const actionableCount =
    attentionItems.reduce((acc, item) => acc + (item.count || 0), 0) + pendingWritesCount;

  const handleActionClick = (targetView: ViewState) => {
    setIsOpen(false);
    onNavigate(targetView);
  };

  const handleMarkAllRead = async () => {
    if (infoNotifs.length === 0) return;
    try {
      const unreadIds = infoNotifs
        .filter((n) => !n.isRead)
        .map((n) => n.id)
        .filter(Boolean) as string[];
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map((id) => markNotificationAsRead(id)));
        toast.success('Semua notifikasi informasi ditandai selesai');
        loadInfoNotifications();
      }
    } catch (err) {
      toast.error('Gagal menandai notifikasi');
    }
  };

  const getAttentionIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <UserCheck className="w-4 h-4 text-rose-500" />;
      case 'data_change':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'letter_pending':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="relative" ref={dropdownRef} id="emam-notification-bell">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 bg-white dark:bg-slate-800/40 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/50 dark:border-slate-800 shadow-soft shrink-0 relative transition-all active:scale-95 ${isOpen ? 'bg-slate-100 dark:bg-slate-700/60' : ''}`}
        title="Pusat Tindakan & Notifikasi"
      >
        <Bell className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />

        {/* Only show badge if there are actionable items requiring attention */}
        {actionableCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0B1121] px-1 animate-pulse">
            {actionableCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-4 w-80 sm:w-96 rounded-3xl bg-white dark:bg-[#0B1121] border border-slate-200/50 dark:border-slate-800 shadow-float z-50 overflow-hidden backdrop-blur-md"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-[#F7F9FC] dark:bg-slate-900/30">
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-indigo-500" />
                  Pusat Layanan
                </span>

                {/* Offline First Status Indicator */}
                <div className="flex items-center gap-1 mt-0.5">
                  {isOnline ? (
                    <span className="inline-flex items-center text-[9px] font-bold text-emerald-500 uppercase tracking-wide gap-0.5">
                      <Cloud className="w-3 h-3 shrink-0" />
                      Terhubung
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-bold text-amber-500 uppercase tracking-wide gap-0.5">
                      <CloudOff className="w-3 h-3 shrink-0" />
                      Mode Offline
                    </span>
                  )}
                  {lastSync && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                      • Terakhir Sinkron:{' '}
                      {formatDistanceToNow(new Date(lastSync), {
                        addSuffix: true,
                        locale: idLocale || localeID,
                      })}
                    </span>
                  )}
                </div>
              </div>

              {infoNotifs.some((n) => !n.isRead) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  title="Tandai semua informasi selesai"
                >
                  <Check className="w-3 h-3" />
                  Semua Selesai
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-900 scrollbar-thin">
              {/* SECTION 0: QUICK ACCESS FEATURES (NEW) */}
              <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/5">
                <div className="flex items-center justify-between px-2 mb-2.5">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Akses Cepat Fitur
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Semua', view: ViewState.ALL_FEATURES, icon: Grid3X3, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
                    { label: 'Histori', view: ViewState.ATTENDANCE_HISTORY, icon: History, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                    { label: 'Poin', view: ViewState.POINTS, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
                    { label: 'Surat', view: ViewState.LETTERS, icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' },
                  ].map((feat) => (
                    <button
                      key={feat.label}
                      onClick={() => handleActionClick(feat.view)}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-soft"
                    >
                      <div className={`w-10 h-10 rounded-2xl ${feat.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                        <feat.icon className={`w-5 h-5 ${feat.color}`} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center">
                        {feat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 1: PERLU TINDAKAN (ACTION REQUIRED) */}
              <div className="p-4">
                <div className="flex items-center justify-between px-2 mb-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    Tindakan ({actionableCount})
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Sync Failure / Offline Pending Write item */}
                  {pendingWritesCount > 0 && (
                    <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-950/10 flex flex-col gap-1 transition-all shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <RefreshCw
                            className={`w-4 h-4 text-amber-500 ${isSyncing ? 'animate-spin' : ''}`}
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Antrean Sinkronisasi
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-900/20">
                          {pendingWritesCount}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans mt-1">
                        Sistem mendeteksi {pendingWritesCount} data lokal belum sinkron.
                      </p>
                      <button
                        onClick={() => handleActionClick(ViewState.LOGIN_HISTORY)}
                        className="mt-2 w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold transition-all text-center flex items-center justify-center gap-2 shadow-soft hover:scale-[0.98]"
                      >
                        Tinjau Antrean
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Dynamic Attention Items */}
                  {attentionItems.length > 0
                    ? attentionItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col gap-1 hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {getAttentionIcon(item.type)}
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                                {item.title}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0 ${getSeverityBadgeClass(item.severity)}`}
                            >
                              {item.count} Tugas
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-sans">
                            {item.description}
                          </p>
                          <button
                            onClick={() => handleActionClick(item.targetView)}
                            className="mt-1.5 w-full py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 border border-indigo-100/40 dark:border-indigo-900/30"
                          >
                            {item.actionLabel}
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      ))
                    : pendingWritesCount === 0 && (
                        <div className="py-6 text-center text-slate-400 dark:text-slate-600">
                          <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-1.5 stroke-1" />
                          <span className="text-xs font-bold font-sans">
                            Semua tugas selesai! Luar biasa! 👍
                          </span>
                        </div>
                      )}
                </div>
              </div>

              {/* SECTION 2: TRANSAKSI & INFORMASI (ENHANCED) */}
              <div className="p-4">
                <div className="flex items-center justify-between px-2 mb-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-500 shrink-0" />
                    Histori & Informasi
                  </span>
                </div>

                <div className="space-y-2">
                  {/* System Level Auto Information (Last sync successfully message) */}
                  {!isSyncing && lastSync && (
                    <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 transition-all flex items-start gap-3 shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/20">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                          Sinkronisasi Berhasil
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          Semua basis data lokal telah diselaraskan dengan server cloud.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Database/Server Information */}
                  {infoNotifs.length > 0 ? (
                    infoNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl border border-transparent transition-all flex items-start gap-3 ${notif.isRead ? 'opacity-60 hover:opacity-100 bg-slate-50 dark:bg-slate-900/20' : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 shadow-soft'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'transaksi' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30'}`}>
                          {notif.type === 'transaksi' ? (
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Info className="w-5 h-5 text-indigo-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                            {notif.message}
                          </p>
                          {notif.createdAt && (
                            <span className="text-[9px] text-slate-400 dark:text-slate-600 block mt-1 font-mono">
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                                locale: idLocale || localeID,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 dark:text-slate-600">
                      <p className="text-xs font-bold font-sans">Belum ada pengumuman baru.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => handleActionClick(ViewState.NOTIFICATIONS)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10"
              >
                Buka Riwayat Notifikasi
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple ID locale object to avoid date-fns dynamic import problems
const idLocale = {
  code: 'id',
  formatDistance: (token: string, count: number, options?: any) => {
    const adverb = options?.addSuffix ? (options.comparison > 0 ? 'dalam ' : '') : '';
    const suffix = options?.addSuffix && options.comparison < 0 ? ' yang lalu' : '';

    const translations: Record<string, string> = {
      lessThanXSeconds: 'kurang dari sedetik',
      xSeconds: `${count} detik`,
      halfAMinute: 'setengah menit',
      lessThanXMinutes: 'kurang dari semenit',
      xMinutes: `${count} menit`,
      aboutXHours: 'sekitar harian',
      xHours: `${count} jam`,
      xDays: `${count} hari`,
      aboutXWeeks: 'sekitar seminggu',
      xWeeks: `${count} minggu`,
      aboutXMonths: 'sekitar sebulan',
      xMonths: `${count} bulan`,
      aboutXYears: 'sekitar setahun',
      xYears: `${count} tahun`,
    };

    const translation = translations[token] || token;
    return adverb + translation + suffix;
  },
};
