import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/layouts/Layout';
import {
  BellIcon,
  MegaphoneIcon,
  Loader2,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  PlusIcon,
  SendIcon,
  BanknotesIcon,
  MessageSquareIcon,
  ClockIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from '@/shared/Icons';
import { isMockMode, handleFirestoreError, OperationType } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { AppNotification} from '@/types';
import { UserRole, NotificationType, ViewState } from '@/types';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import { toast } from 'sonner';
import {
  markNotificationAsRead,
  getNotificationCenterData,
  sendNotification,
} from '@/services/notificationService';
import { getClasses } from '@/services/classService';

interface NotificationCenterProps {
  onBack: () => void;
  userRole: UserRole;
  onNavigate?: (view: ViewState) => void;
}

import { useAttention } from '@/hooks/useAttention';

const mapUserRole = (role: UserRole) => {
  if ([UserRole.ADMIN, UserRole.DEVELOPER].includes(role)) return 'admin';
  if (
    [
      UserRole.KEPALA_MADRASAH,
      UserRole.KEPALA_TU,
      UserRole.WAKAMAD,
      UserRole.STAF,
      UserRole.HUMAS,
      UserRole.KURIKULUM,
      UserRole.KESISWAAN,
      UserRole.GTK,
    ].includes(role)
  )
    return 'admin';
  if ([UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK].includes(role)) return 'guru';
  if ([UserRole.SISWA, UserRole.KETUA_KELAS, UserRole.ORANG_TUA].includes(role)) return 'siswa';
  return 'semua';
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onBack,
  userRole,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const notifLoadMoreRef = useRef<HTMLButtonElement | null>(null);

  const { attentionItems, isLoading: loadingAttention } = useAttention(
    userRole,
    useAuthStore.getState().user?.id || null,
  );

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>(NotificationType.INFO);
  const [targetRole, setTargetRole] = useState<'semua' | 'siswa' | 'guru' | 'admin'>('semua');
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [classes, setClasses] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const canSendAnnouncements = [
    UserRole.ADMIN,
    UserRole.DEVELOPER,
    UserRole.STAF,
    UserRole.GURU_BK,
    UserRole.KEPALA_MADRASAH,
    UserRole.KEPALA_TU,
    UserRole.WAKAMAD,
    UserRole.GTK,
    UserRole.HUMAS,
    UserRole.KURIKULUM,
    UserRole.PIKET,
    UserRole.KESISWAAN,
    UserRole.KOMITE,
    UserRole.GURU,
  ].includes(userRole);
  const userMappedRole = mapUserRole(userRole);

  useEffect(() => {
    if (isMockMode) {
      setNotifications([
        {
          id: '1',
          title: 'PPDB 2025 Dibuka',
          message: 'Penerimaan peserta didik baru telah resmi dibuka hari ini.',
          createdAt: Date.now(),
          type: 'info',
          targetRole: 'semua',
          isRead: false,
          tenantId: '30315537',
        },
        {
          id: '2',
          title: 'SPP Bulan April',
          message: 'Tagihan SPP Anda untuk bulan April telah terbit.',
          createdAt: Date.now() - 86400000,
          type: 'transaksi',
          targetRole: 'siswa',
          userId: 'user123',
          isRead: false,
          tenantId: '30315537',
        },
      ] as any);
      setLoading(false);
      return;
    }

    if (!useAuthStore.getState().user) return;

    const fetchClasses = async () => {
      try {
        const list = await getClasses();
        setClasses(['Semua', ...list.map((d: any) => d.name).sort()]);
      } catch (e) {
        console.error('Gagal memuat kelas:', e);
      }
    };
    fetchClasses();

    let isMounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotificationCenterData();
        if (!isMounted) return;
        setNotifications(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Gagal memuat notifikasi', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [userRole, userMappedRole]);

  useEffect(() => {
    if (loading || visibleCount >= notifications.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 15);
        }
      },
      {
        rootMargin: '100px',
      },
    );

    const currentBtn = notifLoadMoreRef.current;
    if (currentBtn) {
      observer.observe(currentBtn);
    }

    return () => {
      if (currentBtn) {
        observer.unobserve(currentBtn);
      }
    };
  }, [loading, notifications, visibleCount]);

  const markAllAsRead = async () => {
    if (isMockMode) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      return;
    }
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    const toastId = toast.loading('Menandai semua selesai...');
    try {
      await Promise.all(unread.map((n) => markNotificationAsRead(n.id!)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Semua ditandai dibaca', { id: toastId });
    } catch (e) {
      toast.error('Gagal memperbarui status', { id: toastId });
    }
  };

  const markAsRead = async (notif: AppNotification) => {
    if (isMockMode) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      return;
    }

    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));

    if (notif.type === 'surat') {
      toast.info('Detail Proses Surat', {
        description: notif.message,
        duration: 5000,
      });
      return;
    }

    try {
      if (notif.id && !notif.isRead) {
        await markNotificationAsRead(notif.id);
      }
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `notifications/${notif.id}`);
      // Rollback optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: false } : n)),
      );
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    await markAsRead(notif);
    if (notif.type === 'chat' && onNavigate) {
      onNavigate(ViewState.ADVISOR);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const emptyFields = [];
    if (!title) emptyFields.push('Judul');
    if (!message) emptyFields.push('Pesan');

    if (emptyFields.length > 0) {
      toast.error(`${emptyFields.join(' dan ')} wajib diisi.`);
      return;
    }

    setSending(true);
    try {
      if (isMockMode) {
        toast.success('Pengumuman dikirim (Simulasi)');
        setShowCreate(false);
        return;
      }

      await sendNotification({
        title,
        message,
        type,
        targetRole,
        targetClass: selectedClass !== 'Semua' ? selectedClass : undefined,
      });

      toast.success('Pemberitahuan berhasil disiarkan!');
      setShowCreate(false);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
      toast.error('Gagal mengirim: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'info':
        return {
          icon: MegaphoneIcon,
          bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
          label: 'INFO',
        };
      case 'transaksi':
        return {
          icon: BanknotesIcon,
          bg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
          label: 'TRANSAKSI',
        };
      case 'chat':
        return {
          icon: MessageSquareIcon,
          bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20',
          label: 'OBROLAN',
        };
      case 'surat':
        return {
          icon: EnvelopeIcon,
          bg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20',
          label: 'SURAT',
        };
      default:
        return {
          icon: InfoIcon,
          bg: 'bg-slate-50 text-slate-600 dark:bg-slate-900/20',
          label: 'UMUM',
        };
    }
  };

  const filteredNotifications =
    filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  const slicedNotifications = filteredNotifications.slice(0, visibleCount);

  const isUnreadPresent = notifications.some((n) => !n.isRead);

  const headerCategories = (
    <div className="flex gap-2 overflow-x-auto py-1 max-w-full justify-start items-center no-scrollbar shrink-0">
      <button
        onClick={() => setFilter('all')}
        className={`px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wide uppercase whitespace-nowrap transition-all ${
          filter === 'all'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5'
        }`}
      >
        Semua
      </button>
      {(NotificationType ? Object.values(NotificationType) : []).map((cat) => (
        <button
          key={cat}
          onClick={() => setFilter(cat as NotificationType)}
          className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wide whitespace-nowrap transition-all ${
            filter === cat
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  return (
    <Layout title="Notifikasi" customHeader={headerCategories} onBack={onBack}>
      <div className="p-4 lg:p-8 pb-32 max-w-3xl mx-auto w-full space-y-6">
        {/* ==================== PUSAT PERHATIAN & TINDAK LANJUT ==================== */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 dark:from-slate-900/30 dark:via-[#151E32] dark:to-slate-900/40 border border-indigo-100/50 dark:border-slate-800/80 rounded-[2.5rem] p-6 lg:p-8 shadow-xl shadow-indigo-900/5 dark:shadow-none space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                <BellIcon className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                  Pusat Perhatian & Tindak Lanjut
                </h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  Kejadian penting & tugas tertunda yang butuh aksi Anda
                </p>
              </div>
            </div>

            {attentionItems && attentionItems.length > 0 && (
              <span className="self-start sm:self-auto px-4 py-1 rounded-full bg-rose-500 text-white text-[8px] font-bold uppercase tracking-wide animate-pulse">
                {attentionItems.length} Perlu Tindakan
              </span>
            )}
          </div>

          {loadingAttention ? (
            <div className="py-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-2">
                Menganalisis Berkas & Tugas...
              </p>
            </div>
          ) : attentionItems && attentionItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attentionItems.map((item) => {
                const isHigh = item.severity === 'high';
                const isMedium = item.severity === 'medium';

                let iconColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400';
                if (isMedium)
                  iconColor = 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
                else if (item.severity === 'info')
                  iconColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400';

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between p-5 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                      isHigh
                        ? 'bg-rose-500/[0.02] border-rose-500/10 dark:border-rose-500/5'
                        : isMedium
                          ? 'bg-amber-500/[0.02] border-amber-500/10 dark:border-amber-500/5'
                          : 'bg-indigo-500/[0.01] border-indigo-500/10 dark:border-indigo-500/5'
                    }`}
                  >
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[7px] font-bold uppercase tracking-wide ${
                            isHigh
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                              : isMedium
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {isHigh ? 'Mendesak' : isMedium ? 'Sedang' : 'Info'}
                        </span>

                        <div className={`p-2 rounded-xl ${iconColor}`}>
                          {item.type === 'approval' || item.type === 'data_change' ? (
                            <ShieldCheckIcon className="w-4 h-4" />
                          ) : item.type === 'letter_pending' ? (
                            <EnvelopeIcon className="w-4 h-4" />
                          ) : item.type === 'letter_done' ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <InfoIcon className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 mt-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight pr-2 leading-none">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                      {item.count > 1 ? (
                        <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {item.count} Berkas
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                          Aksi Langsung
                        </span>
                      )}

                      <button
                        onClick={() => onNavigate && onNavigate(item.targetView)}
                        className={`px-4 py-2 rounded-xl text-[8px] font-bold uppercase tracking-wide transition-all active:scale-95 ${
                          isHigh
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10'
                            : isMedium
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/10'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10'
                        }`}
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-emerald-500/[0.03] border border-emerald-500/10 p-5 rounded-3xl text-emerald-800 dark:text-emerald-400">
              <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shrink-0 shadow-lg shadow-emerald-500/10">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-tight leading-none mb-1">
                  Semua Aman & Terkendali!
                </p>
                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide leading-none">
                  Tidak ada tindakan draf permohonan atau registrasi pending saat ini.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mark as read helper */}
        {notifications.some((n) => !n.isRead) && (
          <div className="flex justify-end pr-2">
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold uppercase tracking-wide hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircleIcon className="w-3 h-3" /> Tandai Semua Dibaca
            </button>
          </div>
        )}

        {(canSendAnnouncements || [UserRole.ADMIN, UserRole.DEVELOPER].includes(userRole)) && (
          <div className={`flex ${canSendAnnouncements ? 'justify-between' : 'justify-end'} mb-2`}>
            {[UserRole.ADMIN, UserRole.DEVELOPER].includes(userRole) && (
              <button
                onClick={() => onNavigate && onNavigate(ViewState.ACCOUNT_APPROVAL)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-wide transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
              >
                <ShieldCheckIcon className="w-4 h-4" /> Persetujuan Akun
              </button>
            )}
            {canSendAnnouncements && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-wide transition-all ${showCreate ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}
              >
                {showCreate ? (
                  <XCircleIcon className="w-4 h-4" />
                ) : (
                  <PlusIcon className="w-4 h-4" />
                )}
                {showCreate ? 'Batal' : 'Buat Pengumuman'}
              </button>
            )}
          </div>
        )}

        {showCreate && canSendAnnouncements && (
          <div className="bg-white dark:bg-[#151E32] p-6 rounded-[2.5rem] border-2 border-emerald-500/20 shadow-xl animate-in slide-in-from-top-4 duration-500">
            <form onSubmit={handleSend} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <MegaphoneIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                    Siarkan Pesan Baru
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    Akan dikirim sebagai Info (Broadcast)
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                  Judul Pengumuman
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  placeholder="Contoh: Libur Semester Ganjil"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                  Kirim Ke (Target Role)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['semua', 'siswa', 'guru', 'admin'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargetRole(t as any)}
                      className={`py-2 rounded-xl text-[7px] font-bold uppercase tracking-wide border transition-all flex items-center justify-center ${targetRole === t ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {targetRole === 'siswa' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                    Filter Kelas (Opsional)
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none"
                  >
                    {classes.map((c, i) => (
                      <option key={`${c}-${i}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                  Isi Pesan
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                  placeholder="Tuliskan detail pengumuman di sini..."
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 hover:bg-emerald-700"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <SendIcon className="w-4 h-4" />
                    <span>SIARKAN SEKARANG</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500 opacity-20" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-4">
              Sinkronisasi Pesan...
            </p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3 animate-in fade-in duration-500">
            {slicedNotifications.map((notif, idx) => {
              const style = getTypeStyle(notif.type);
              return (
                <div
                  key={`${notif.id || idx}`}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-5 rounded-[2rem] border relative overflow-hidden group transition-all cursor-pointer ${
                    notif.isRead
                      ? 'bg-white dark:bg-[#151E32] border-slate-100 dark:border-slate-800 opacity-75 grayscale-[20%]'
                      : 'bg-white dark:bg-[#1E293B] border-indigo-200 dark:border-indigo-500/30 shadow-md ring-1 ring-indigo-500/10'
                  }`}
                >
                  {!notif.isRead && (
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50"></div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.bg}`}
                    >
                      <style.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <style.icon className={`w-3 h-3 ${style.bg.split(' ')[1]}`} />
                            <span
                              className={`text-[7px] font-bold uppercase tracking-[0.2em] ${style.bg.split(' ')[1]}`}
                            >
                              {style.label}
                            </span>
                          </div>
                          <h4 className="text-[13px] font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-none pr-2">
                            {notif.title}
                          </h4>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide shrink-0">
                          {format(new Date(notif.createdAt), 'dd MMM', { locale: localeID })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-3">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {notif.targetRole ? `Tujuan: ${notif.targetRole}` : 'Personal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <ClockIcon className="w-3 h-3" />
                          <span className="text-[8px] font-bold">
                            {format(new Date(notif.createdAt), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length > visibleCount && (
              <div className="pt-4 flex justify-center">
                <button
                  ref={notifLoadMoreRef}
                  onClick={() => setVisibleCount((prev) => prev + 15)}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-2xl transition-all"
                >
                  Muat Lebih Banyak
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-32 text-center opacity-30 flex flex-col items-center gap-4 animate-in fade-in">
            <BellIcon className="w-16 h-16 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">
              Belum ada pemberitahuan
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationCenter;
