import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareText,
  Bot,
  Sparkles,
  X,
  ShieldAlert,
  ClipboardCheck,
  QrCode,
  MapPin,
  Loader2,
  CheckCircle2,
  BrainCircuit,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { ChatContext } from '@/lib/context/ChatContext';
import { ViewState, UserRole } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { localDb } from '@/database/dexie'; // eslint-disable-line no-restricted-imports
import {
  checkInTeacherManual,
  checkTeacherHasCheckedInToday,
} from '@/services/teacherAttendanceService';
import { toast } from 'sonner';

interface FloatingActionMenuProps {
  onNavigate?: (view: ViewState) => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isChatOpen,
    setIsChatOpen,
    isChatbotOpen,
    setIsChatbotOpen,
    isAgentOpen,
    setIsAgentOpen,
  } = useContext(ChatContext) || {};
  const user = useAuthStore((s) => s.user);
  const roles = useUserStore((s) => s.roles);
  const { pendingCount, syncState, forceSync } = useOfflineSync();
  const [queueCount, setQueueCount] = useState<number>(pendingCount);

  useEffect(() => {
    setQueueCount(pendingCount);
  }, [pendingCount]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await localDb.sync_queue
          .where('status')
          .anyOf(['pending', 'failed'])
          .count();
        setQueueCount(count);
      } catch (err) {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Toggle menu
  const toggleMenu = () => setIsOpen(!isOpen);

  // Determine GTK privilege
  const isGTK = useMemo(() => {
    if (roles && roles.length > 0) {
      return roles.some((r) => !([UserRole.SISWA, UserRole.KETUA_KELAS, UserRole.ORANG_TUA] as string[]).includes(r));
    }
    return user?.role && ![UserRole.SISWA, UserRole.KETUA_KELAS, UserRole.ORANG_TUA].includes(user.role as UserRole);
  }, [roles, user?.role]);

  const isSiswa = useMemo(() => {
    if (roles && roles.length > 0) {
      return roles.includes(UserRole.SISWA) || roles.includes(UserRole.KETUA_KELAS);
    }
    return user?.role === UserRole.SISWA || user?.role === UserRole.KETUA_KELAS;
  }, [roles, user?.role]);

  // Sync actual today's check-in status from local database
  useEffect(() => {
    if (!user?.uid || !isGTK) return;
    let isMounted = true;
    
    const checkStatus = async () => {
      try {
        const hasCheckedIn = await checkTeacherHasCheckedInToday(user.uid);
        if (isMounted) setHasCheckedInToday(hasCheckedIn);
      } catch (err) {
        console.warn('[FloatingActionMenu] Failed to check attendance status:', err);
      }
    };
    
    checkStatus();
    return () => { isMounted = false; };
  }, [user?.uid, isGTK]);

  const handleAction = useCallback((type: 'chat' | 'chatbot' | 'agent' | 'attendance' | 'scanner') => {
    if (type === 'chat' && setIsChatOpen) {
      setIsChatOpen(!isChatOpen);
      if (setIsChatbotOpen) setIsChatbotOpen(false);
      if (setIsAgentOpen) setIsAgentOpen(false);
    } else if (type === 'chatbot' && setIsChatbotOpen) {
      setIsChatbotOpen(!isChatbotOpen);
      if (setIsChatOpen) setIsChatOpen(false);
      if (setIsAgentOpen) setIsAgentOpen(false);
    } else if (type === 'agent' && setIsAgentOpen) {
      setIsAgentOpen(!isAgentOpen);
      if (setIsChatOpen) setIsChatOpen(false);
      if (setIsChatbotOpen) setIsChatbotOpen(false);
    } else if (type === 'attendance') {
      if (onNavigate) onNavigate(ViewState.JOURNAL);
    } else if (type === 'scanner') {
      if (onNavigate) onNavigate(ViewState.SCANNER);
    }
    setIsOpen(false);
  }, [isChatOpen, isChatbotOpen, isAgentOpen, setIsChatOpen, setIsChatbotOpen, setIsAgentOpen, onNavigate]);

  const handleAutoAttendance = useCallback(async () => {
    if (!user) return;
    if (hasCheckedInToday) {
      toast.info('Anda sudah merekam kehadiran hari ini.');
      setIsOpen(false);
      return;
    }

    setIsCheckingIn(true);
    setIsOpen(false);
    const toastId = toast.loading('Mendeteksi lokasi & memproses kehadiran...');

    try {
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocation tidak didukung oleh browser Anda');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const deviceInfo = navigator.userAgent;

      const result = await checkInTeacherManual(
        user.uid,
        user.displayName || user.email,
        latitude,
        longitude,
        deviceInfo,
      );

      if (result.status === 'VALID') {
        toast.success(`Berhasil! Kehadiran tercatat. Jarak ke sekolah: ${result.distance}m`, {
          id: toastId,
        });
        setHasCheckedInToday(true);
      } else {
        toast.error(`Peringatan: Lokasi Anda terlalu jauh (${result.distance}m)`, { id: toastId });
      }
    } catch (error: any) {
      console.error('Attendance Error:', error);
      let msg = 'Gagal merekam kehadiran';
      if (error.code === 1) msg = 'Izin lokasi ditolak. Mohon aktifkan GPS.';
      else if (error.code === 3) msg = 'Waktu permintaan lokasi habis.';

      toast.error(msg, { id: toastId });
    } finally {
      setIsCheckingIn(false);
    }
  }, [user, hasCheckedInToday]);

  return (
    <>
        {/* Independent Sync Status Floating Button (When queueCount > 0) */}
        {queueCount > 0 && (
          <div className="fixed bottom-72 right-6 z-[9998] flex items-center gap-2 pointer-events-auto group">
            <span className="absolute right-14 px-2.5 py-1 bg-slate-900/95 text-white text-[10px] font-bold uppercase tracking-wide rounded-xl shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {queueCount} perubahan siap sync ({syncState})
            </span>
            <button
              onClick={() => forceSync()}
              className="w-12 h-12 bg-slate-900 dark:bg-slate-900 border-2 border-amber-500 text-amber-400 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 relative overflow-hidden"
              title={`${queueCount} perubahan siap sync`}
            >
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {queueCount > 99 ? '99+' : queueCount}
              </span>
            </button>
          </div>
        )}

        {/* Independent GPS Attendance Floating Button (GTK Only) */}
        {isGTK && (
          <div className="fixed bottom-56 right-6 z-[9998] flex items-center gap-2 pointer-events-auto group">
            <button
              onClick={handleAutoAttendance}
              disabled={isCheckingIn}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 border-2 ${
                hasCheckedInToday
                  ? 'bg-emerald-600 border-white text-white'
                  : 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600'
              }`}
            >
              {isCheckingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : hasCheckedInToday ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        {/* Independent QR Scanner Floating Button (Open to GTK only) */}
        {isGTK && (
          <div className="fixed bottom-40 right-6 z-[9998] flex items-center gap-2 pointer-events-auto group">
            <button
              onClick={() => handleAction('scanner')}
              className="w-12 h-12 bg-white dark:bg-slate-900 text-indigo-600 border-2 border-indigo-500 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-indigo-300 shadow-[0_0_10px_#818cf8] opacity-0 group-hover:opacity-100 animate-[scan_2s_linear_infinite] z-10"></div>
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Floating Action Menu & Toggle */}
        <div className="fixed bottom-24 right-6 z-[9998] pointer-events-auto">
          {/* Collapsible Action Items in 45-90 degree Circular Arc */}
          <AnimatePresence>
            {isOpen &&
              [
                ...(isGTK
                  ? [
                      {
                        id: 'attendance',
                        label: 'Jurnal & Mengajar',
                        icon: ClipboardCheck,
                        color: 'text-amber-600 border-amber-500 bg-white dark:bg-slate-900',
                        onClick: () => handleAction('attendance'),
                      },
                    ]
                  : []),
                {
                  id: 'chatbot',
                  label: 'e-Mam AI Assistant',
                  icon: Bot,
                  color: isChatbotOpen
                    ? 'bg-indigo-600 border-white text-white'
                    : 'text-indigo-600 border-indigo-500 bg-white dark:bg-slate-900',
                  onClick: () => handleAction('chatbot'),
                },
                {
                  id: 'agent',
                  label: 'Smart AI Agent (GPT-4)',
                  icon: BrainCircuit,
                  color: isAgentOpen
                    ? 'bg-violet-600 border-white text-white'
                    : 'text-violet-600 border-violet-500 bg-white dark:bg-slate-900',
                  onClick: () => handleAction('agent'),
                },
                {
                  id: 'chat',
                  label: 'Pesan & Diskusi',
                  icon: MessageSquareText,
                  color: isChatOpen
                    ? 'bg-pink-600 border-white text-white'
                    : 'text-pink-600 border-pink-500 bg-white dark:bg-slate-900',
                  onClick: () => handleAction('chat'),
                },
                {
                  id: 'emergency',
                  label: 'Lapor Darurat',
                  icon: ShieldAlert,
                  color: 'text-rose-600 border-rose-500 bg-white dark:bg-slate-900',
                  onClick: () => {
                    toast.info('Fitur Lapor Darurat sedang disiapkan.');
                    setIsOpen(false);
                  },
                },
              ].map((act, i, arr) => {
                const total = arr.length;
                // Arc spanning from 0 radians (left) to Math.PI / 2 radians (up)
                const angle = total > 1 ? (i / (total - 1)) * (Math.PI / 2) : Math.PI / 4;
                const radius = 100;
                const x = -Math.cos(angle) * radius;
                const y = -Math.sin(angle) * radius;
                const IconComponent = act.icon;

                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{ opacity: 1, scale: 1, x, y }}
                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 24,
                      delay: i * 0.03,
                    }}
                    className="absolute bottom-1 right-1 flex items-center gap-2 group pointer-events-auto"
                    style={{ transformOrigin: 'center center' }}
                  >
                    <span className="absolute right-14 px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wide rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {act.label}
                    </span>
                    <button
                      onClick={act.onClick}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border-2 ${act.color}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* Float Main Button */}
          <button
            onClick={toggleMenu}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 border-2 active:scale-95 group overflow-hidden relative z-20 ${
              isOpen
                ? 'bg-slate-900 border-slate-700 text-white rotate-90'
                : 'bg-indigo-600 border-indigo-500 text-white'
            }`}
          >
            {/* Decorative pulse background */}
            {!isOpen && (
              <span className="absolute inset-0 bg-white/20 animate-ping rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            )}

            {isOpen ? <X className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
          </button>
        </div>
    </>
  );
};

export default FloatingActionMenu;
