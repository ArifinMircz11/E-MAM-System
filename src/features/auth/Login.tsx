/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LockIcon,
  ArrowRightIcon,
  Loader2,
  ShieldCheckIcon,
  AppLogo,
  EnvelopeIcon,
  AlertCircleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  EyeIcon,
  EyeOffIcon,
  SparklesIcon,
  GoogleIcon,
} from '@/shared/Icons';
import { UserRole } from '@/types';
import type { TickerItem, NewsItem } from '@/types';
import { ViewState } from '@/types';
import {
  sendPasswordResetEmail,
  processForcedPasswordChange,
  logout,
} from '@/services/authService';
import { useLogin } from './hooks/useLogin';
import { logAudit } from '@/services/auditLogService';
import { getNews } from '@/services/newsService';
import { getTickerItems } from '@/services/tickerService';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import { toast } from 'sonner';
import Register from './Register';
import { MockUserSelector } from './components/MockUserSelector';

interface LoginProps {
  onLogin: (role: UserRole) => void;
  onNavigate: (view: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [mode, setMode] = useState<
    'login' | 'forgot-password' | 'activate' | 'force-change-password' | 'register'
  >('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempRole, setTempRole] = useState<UserRole | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, loading: hookLoading, error: hookError } = useLogin();
  const [localLoading, setLocalLoading] = useState(false);
  const loading = hookLoading || localLoading;
  const [error, setError] = useState<{
    message: string;
    type: 'error' | 'warning' | 'info';
  } | null>(null);

  // Sync hookError with local error state
  useEffect(() => {
    if (hookError && (!error || error.message !== hookError.message)) {
      setError(hookError);
    }
  }, [hookError, error]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [currentNewsSlide, setCurrentNewsSlide] = useState(0);
  const [developerBypass, setDeveloperBypass] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);

  const lockedFeatures = useUIStore((state) => state.lockedFeatures);
  const isLoginLocked = false; // Bypassed as per user instructions
  const tenantId = useUserStore((state) => state.tenantId);

  const handleSecretClick = () => {
    setSecretClicks((c) => {
      if (c + 1 >= 5) {
        setDeveloperBypass(true);
        toast.success('Developer Bypass diaktifkan.');
        return 0;
      }
      return c + 1;
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch Ticker
  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const allItems = await getTickerItems();
        setTickerItems(allItems);
      } catch (error) {
        console.error('Error fetching ticker:', error);
      }
    };
    fetchTicker();
  }, []);

  // Fetch News
  useEffect(() => {
    if (!tenantId) return;
    const fetchNews = async () => {
      try {
        const data = await getNews(true);
        setNewsItems(data.slice(0, 5)); // Featured 5 news
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };
    fetchNews();
  }, [tenantId]);

  // Auto-slide News
  useEffect(() => {
    if (newsItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentNewsSlide((prev) => (prev + 1) % newsItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [newsItems.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const mobileBgImage = 'https://lh3.googleusercontent.com/d/1o8KomVWrJbSQi4m3JdJO1WbbeZHWyrrW';

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Format email tidak valid. Silakan periksa kembali.';
      case 'auth/user-disabled':
        return 'Akun ini telah dinonaktifkan. Hubungi administrator.';
      case 'auth/user-not-found':
        return 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.';
      case 'auth/wrong-password':
        return 'Password salah. Silakan coba lagi.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan login. Silakan tunggu sebentar.';
      case 'auth/network-request-failed':
        return 'Koneksi internet bermasalah. Periksa jaringan Anda.';
      default:
        return 'Kredensial tidak valid atau akun belum diaktifkan.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res: any = await login(identifier, password);

    if (res.success && res.role) {
      if (res.requiresPasswordChange) {
        toast.info(
          'Anda menggunakan password sementara. Silakan buat password baru demi keamanan.',
        );
        setTempRole(res.role);
        setMode('force-change-password');
        return;
      }

      if (res.isFirstLogin) {
        toast.success(`Aktivasi Berhasil! Selamat datang di e-Mam System.`);
      } else {
        toast.success(`Login Berhasil`);
      }

      await logAudit({
        action: 'login',
        target: 'user_session',
        details: `Successful login as ${res.role}`,
        userRole: res.role,
        userName: identifier,
      });

      onLogin(res.role);
    } else {
      setError({ message: res.error || 'Gagal masuk.', type: 'error' });
    }
  };

  const handleGoogleLogin = async () => {
    const res: any = await googleLogin();
    if (res.success) {
      toast.success('Login Google Berhasil');
      onLogin(res.role || UserRole.SISWA);
    } else {
      setError({ message: res.error || 'Gagal login dengan Google.', type: 'error' });
    }
  };

  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError({ message: 'Konfirmasi password tidak cocok.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setError({ message: 'Password minimal 6 karakter.', type: 'error' });
      return;
    }

    setLocalLoading(true);
    setError(null);

    try {
      const res = await processForcedPasswordChange(newPassword);
      if (res.success && tempRole) {
        toast.success('Password baru berhasil disimpan!');

        const currentRole = tempRole;

        await logAudit({
          action: 'force_password_change',
          target: 'user_session',
          details: `Password changed effectively as ${currentRole}`,
          userRole: currentRole,
          userName: identifier,
        });

        setMode('login'); // reset later states
        onLogin(currentRole);
      } else {
        setError({ message: res.message || 'Gagal menyimpan password baru.', type: 'error' });
      }
    } catch (err: any) {
      setError({ message: err.message || 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError(null);

    try {
      const res = await sendPasswordResetEmail(resetEmail.trim());
      if (res.success) {
        toast.success(res.message);
        setMode('login');
      } else {
        setError({ message: res.message || 'Gagal mengirim email reset.', type: 'error' });
      }
    } catch (err: any) {
      setError({ message: 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 dark:bg-[#020617] transition-all duration-500 relative overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 right-6 z-50 p-2.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
          title="Layar Penuh"
        >
          {isFullscreen ? (
            <ArrowsPointingInIcon className="w-4 h-4" />
          ) : (
            <ArrowsPointingOutIcon className="w-4 h-4" />
          )}
        </button>

        {/* Live Chat Button */}
        {/* Removed redundant chat button as it's now handled by the global FloatingChatButton */}

        {/* --- DESKTOP BRANDING SIDE --- */}
        <div className="hidden lg:flex lg:flex-[1.2] xl:flex-[1.5] bg-white dark:bg-slate-950 relative items-center justify-center p-16 overflow-hidden">
          {/* Subtle Background */}
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/20"></div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full max-w-lg space-y-12 z-10"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-indigo-600 rounded-2xl">
                  <AppLogo className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  e-Mam System V8.0
                </span>
              </div>

              <h1 className="text-5xl font-bold text-slate-950 dark:text-white leading-[1.1] ">
                kelola akademik <br /> dengan <span className="text-indigo-600">presisi</span>.
              </h1>

              <p className="text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed text-sm font-medium">
                sistem informasi manajemen madrasah untuk meningkatkan efisiensi administrasi dan
                kualitas pendidikan.
              </p>
            </div>

            {/* News & Stats Preview */}
            <div className="space-y-6">
              {/* News Slider */}
              {newsItems.length > 0 && (
                <div className="relative h-[200px] w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={newsItems[currentNewsSlide].id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 p-6 flex flex-col justify-end"
                    >
                      <div className="bg-indigo-600 self-start px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wide mb-2">
                        {newsItems[currentNewsSlide].category}
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {newsItems[currentNewsSlide].title}
                      </h3>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* Stats Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      aktivitas sistem
                    </p>
                    <h3 className="text-3xl font-bold text-slate-950 dark:text-white">99.9%</h3>
                  </div>
                  <p className="text-xs font-bold text-emerald-500">+4.5k akses</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- LOGIN FORM SIDE (Clean & Focused) --- */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 relative z-10 bg-slate-50/30 dark:bg-transparent backdrop-blur-3xl overflow-y-auto">
          {/* Mobile Enhancements (only on small screens) */}
          <div className="absolute inset-0 lg:hidden z-0 overflow-hidden bg-white dark:bg-[#020617]">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 dark:from-indigo-900/20 to-transparent"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500 opacity-10 blur-[100px]"></div>
            <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-emerald-50/50 dark:from-emerald-900/10 to-transparent"></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'circOut' }}
            className="w-full max-w-sm z-10 space-y-6 sm:space-y-10 py-6"
          >
            <div className="text-center lg:text-left space-y-4">
              <div className="lg:hidden w-16 h-16 mx-auto flex items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl mb-6">
                <AppLogo className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white  leading-none uppercase">
                  Akses Masuk
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center justify-center lg:justify-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Selamat datang kembali di Dashboard Madrasah
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isLoginLocked ? (
                <motion.div
                  key="login-locked-content"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
                  <div
                    className="mx-auto w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center p-4 cursor-pointer"
                    onClick={handleSecretClick}
                  >
                    <LockIcon />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide leading-tight mb-2">
                      pemeliharaan sistem
                    </h3>
                    <p className="text-sm font-medium text-slate-400">
                      Autentikasi sedang dijeda sementara oleh Developer dan sistem sedang tidak
                      menerima sesi baru.
                    </p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div className="w-1/3 bg-indigo-500 h-full rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-6">
                    silakan kembali beberapa saat lagi.
                  </p>
                </motion.div>
              ) : mode === 'login' || mode === 'activate' ? (
                <motion.div
                  key="login-form-content"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-5">
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-indigo-500">
                          ID IDENTITAS
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-300">
                            <EnvelopeIcon />
                          </div>
                          <input
                            required
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs sm:text-sm font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm lowercase"
                            placeholder="ID Unik, NIP, NIK, atau Email"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide transition-colors group-focus-within:text-indigo-500">
                            KATA SANDI
                          </label>
                          <button
                            type="button"
                            onClick={() => setMode('forgot-password')}
                            className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 uppercase transition-colors"
                          >
                            LUPA SANDI?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-300">
                            <LockIcon />
                          </div>
                          <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-xs sm:text-sm font-bold tracking-wide focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOffIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border flex flex-col gap-3 shadow-lg ${
                          error.message.includes('unauthorized-domain') ||
                          error.message.includes('auth/unauthorized-domain')
                            ? 'bg-amber-50/95 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-300'
                            : error.type === 'error'
                              ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400'
                              : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400'
                        }`}
                      >
                        {error.message.includes('unauthorized-domain') ||
                        error.message.includes('auth/unauthorized-domain') ? (
                          <>
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                <ShieldCheckIcon className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                                  Konfigurasi Domain Diperlukan
                                </p>
                                <p className="text-[11px] font-bold leading-tight">
                                  Domain pratinjau ini belum diotorisasi untuk Google Sign-In di
                                  Firebase Console milik Anda.
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 text-[11px] space-y-2 border-t border-amber-200/50 dark:border-amber-900/40 pt-2 font-medium">
                              <p className="font-bold text-amber-950 dark:text-amber-200">
                                Langkah Otorisasi:
                              </p>
                              <ol className="list-decimal pl-4 space-y-1 text-[10.5px]">
                                <li>
                                  Buka{' '}
                                  <a
                                    href="https://console.firebase.google.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-bold text-indigo-600 dark:text-indigo-400"
                                  >
                                    Firebase Console
                                  </a>
                                </li>
                                <li>
                                  Pilih proyek Anda (contoh: <strong>project-id</strong>)
                                </li>
                                <li>
                                  Masuk ke <strong>Build &gt; Authentication</strong>, pilih tab{' '}
                                  <strong>"Settings"</strong> lalu menu{' '}
                                  <strong>"Authorized domains"</strong>
                                </li>
                                <li>
                                  Klik tombol <strong>"Add domain"</strong> lalu masukkan domain
                                  berikut:
                                </li>
                              </ol>
                              <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-950/50 rounded-lg p-2 mt-1">
                                <code className="text-[10px] font-mono break-all select-all flex-1 text-slate-800 dark:text-slate-200">
                                  {window.location.hostname}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(window.location.hostname);
                                    toast.success('Domain berhasil disalin!');
                                  }}
                                  className="text-[9px] font-bold bg-amber-200 hover:bg-amber-300 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-200 px-2 py-1 rounded cursor-pointer"
                                >
                                  Salin
                                </button>
                              </div>
                              <p className="text-[9.5px] opacity-80 mt-1 italic leading-tight">
                                Catatan: Setelah ditambahkan di kontrol panel Firebase, silakan muat
                                ulang halaman ini dan coba Google Sign-In kembali.
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                              {error.type === 'error' ? (
                                <AlertCircleIcon className="w-4 h-4 text-rose-500" />
                              ) : (
                                <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                                {error.type === 'error' ? 'Gagal Masuk' : 'Pemberitahuan'}
                              </p>
                              <p className="text-[11px] font-bold leading-tight">{error.message}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    <div className="space-y-6 pt-2">
                      <div className="flex items-start gap-3 px-1">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            id="agree-terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                          />
                        </div>
                        <label
                          htmlFor="agree-terms"
                          className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight cursor-pointer font-medium uppercase"
                        >
                          Saya menyetujui{' '}
                          <a
                            href="https://privasi.e-mam.my.id/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            persyaratan layanan e-Mam System v8.0
                          </a>{' '}
                          dan kebijakan penggunaan data sdk aplikasi.
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !agreedToTerms}
                        className="w-full group bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-xs flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <span>Masuk ke Dashboard</span>
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-80" />
                          </>
                        )}
                      </button>



                      <div className="flex items-center gap-4 py-2">
                        <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                          TOMBOL CEPAT
                        </span>
                        <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => onNavigate(ViewState.PUBLIC_SERVICES)}
                          className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <EnvelopeIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center leading-tight">
                            Layanan
                            <br />
                            Publik
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMode('register')}
                          className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <SparklesIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center leading-tight">
                            Buat
                            <br />
                            Akun
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <GoogleIcon className="w-6 h-6" />
                          </div>
                          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center leading-tight">
                            Sign In
                            <br />
                            Google
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              ) : mode === 'register' ? (
                <Register
                  onBackToLogin={() => setMode('login')}
                  onRegisterSuccess={(role) => {
                    setMode('login');
                    onLogin(role);
                  }}
                />
              ) : mode === 'forgot-password' ? (
                <motion.div
                  key="forgot-password-form-content"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  <div className="text-center lg:text-left space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white ">
                      Reset Identitas
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                      Keamanan data adalah prioritas kami. Masukkan email terdaftar Anda untuk
                      memulihkan akses secara aman.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-8">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 group-focus-within:text-indigo-500 transition-colors">
                        Email Madrasah
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                          <EnvelopeIcon />
                        </div>
                        <input
                          required
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4.5 pl-12 pr-4 text-xs font-bold tracking-wider focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white"
                          placeholder="nama@emam-system.web.id"
                        />
                      </div>
                    </div>

                    {error && error.type === 'error' && (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 flex items-start gap-4">
                        <AlertCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold leading-tight">{error.message}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 lowercase tracking-wide text-xs"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'verifikasi identitas'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors lowercase tracking-wide"
                      >
                        kembali masuk
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="force-change-password-form-content"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  <div className="text-center lg:text-left space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white ">
                      Ubah Kunci Sandi
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                      Akun Anda telah direset. Demi keamanan, silakan buat kunci sandi baru minimal
                      6 karakter.
                    </p>
                  </div>

                  <form onSubmit={handleForceChangePassword} className="space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 group-focus-within:text-indigo-500 transition-colors">
                          Sandi Baru
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                            <LockIcon />
                          </div>
                          <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4.5 pl-12 pr-12 text-xs font-bold tracking-wider focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white"
                            placeholder="••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOffIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 group-focus-within:text-indigo-500 transition-colors">
                          Konfirmasi Sandi Baru
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                            <LockIcon />
                          </div>
                          <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4.5 pl-12 pr-12 text-xs font-bold tracking-wider focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none dark:text-white"
                            placeholder="••••••"
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div
                        className={`p-4 rounded-2xl flex items-start gap-3 shadow-xl ${error.type === 'error' ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400' : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400'}`}
                      >
                        <AlertCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold leading-tight">{error.message}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 lowercase tracking-wide text-xs"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'simpan dan masuk'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-900/50 flex flex-col items-center gap-4">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-4 leading-relaxed max-w-[300px] font-medium opacity-80">
                e-Mam System V8.0 • Aplikasi Manajemen Akademik Madrasah Terintegrasi
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 opacity-60">
                © 2026 Akhmad Arifin. All rights reserved.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      
      <MockUserSelector onLogin={onLogin} loginFn={login} />
    </div>
  );
};

export default Login;
