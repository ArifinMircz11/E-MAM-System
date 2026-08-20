import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/layouts/Layout';
import { isMockMode } from '@/services/authService';
import { 
  saveMadrasahInfoSettings,
  updateMaintenanceConfig 
} from '@/services/systemService';
import { useUIStore } from '@/stores/uiStore';
import { useSystemStore } from '@/stores/systemStore';
import { useStudentStore } from '@/stores/studentStore';
import { useSyncStore } from '@/stores/syncStore';
import { safeConfirm } from '@/utils/safeConfirm';
import { ViewState, UserRole } from '@/types';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import {
  CogIcon,
  InfoIcon,
  PencilIcon,
  LogOutIcon,
  ChevronRight,
  ShieldCheckIcon,
  CommandLineIcon,
  AppLogo,
  CameraIcon,
  BuildingLibraryIcon,
  TrashIcon,
  SparklesIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  Loader2,
  RectangleStackIcon,
} from '@/shared/Icons';
import { toast } from 'sonner';
import { ThemePreferenceSection } from './ThemePreferenceSection';

interface SettingsProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  userRole: UserRole;
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  onOpenSidebar,
  onNavigate,
  onLogout,
  userRole,
}) => {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [logoSurat, setLogoSurat] = useState<string | null>(null);
  const [logoLayanan, setLogoLayanan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false); // New state for notification toggle

  // Real-time synchronization store states
  const lastSync = useSyncStore((state) => state.lastSync);
  const isSyncing = useSyncStore((state) => state.isSyncing);

  // States for local database record stats
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    pendingScans: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Function to load and count local IndexedDB stats (Deprecated - removed offline functionality)
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      // Offline-first functionality removed.
      setStats({
        students: 0,
        teachers: 0,
        classes: 0,
        pendingScans: 0,
      });
    } catch (e) {
      console.warn('[LocalDataManagement]: Failed to count local records:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleClearIndexedDBCache = async () => {
    const isConfirmed = safeConfirm('Apakah Anda yakin ingin melakukan reset cache aplikasi?');
    if (!isConfirmed) return;

    const toastId = toast.loading('Membersihkan cache aplikasi...');
    try {
      // Clear legacy storage items
      const keysToClear = [
        'emam_last_sync',
        'emam_students_cache',
        'emam_students_cache_time',
        'emam_teachers_cache',
        'emam_teachers_cache_time',
        'dashboard_breakdown_classes',
        'system_stats_persistent',
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));

      // Reset synchronization store status
      const syncStore = useSyncStore.getState();
      syncStore.setSyncStatus({ lastSync: null });

      // Refresh local display counts
      await fetchStats();

      toast.success('Cache aplikasi berhasil dibersihkan!', { id: toastId });
    } catch (err: any) {
      console.error('[LocalDataManagement]: Error during cache purge:', err);
      toast.error(`Gagal membersihkan cache: ${err?.message || err}`, { id: toastId });
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Belum pernah disinkronisasi';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(timestamp));
    } catch (e) {
      return 'Invalid date';
    }
  };

  // WhatsApp Configuration State
  const [waConfig, setWaConfig] = useState({
    enabled: false,
    gateway: 'fonnte',
    token: '',
    getwayToken: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const suratInputRef = useRef<HTMLInputElement>(null);
  const layananInputRef = useRef<HTMLInputElement>(null);

  // News Card Theme Configuration State
  const [themeConfig, setThemeConfig] = useState({
    bg: isDarkMode ? '#1e293b' : '#ffffff',
    primary: isDarkMode ? '#818cf8' : '#4f46e5',
    secondary: isDarkMode ? '#312e81' : '#e0e7ff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
  });

  const canCustomize = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  const { maintenanceMode, loading: configLoading } = useSystemConfig();

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceMode;
    const toastId = toast.loading('Mengubah status maintenance...');
    try {
      const success = await updateMaintenanceConfig(nextState);
      if (success) {
        toast.success(`Maintenance mode ${nextState ? 'diaktifkan' : 'dinonaktifkan'}`, {
          id: toastId,
        });
      } else {
        toast.error('Gagal mengubah status maintenance', { id: toastId });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan', { id: toastId });
    }
  };

  const compressImage = (base64Str: string, maxWidth = 500, maxHeight = 500): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Using webp with 0.7 quality to significantly reduce size while maintaining visibility
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
    });
  };

  const fetchMadrasahInfo = useSystemStore((state) => state.fetchMadrasahInfo);

  useEffect(() => {
    const fetchBranding = async () => {
      if (isMockMode) {
        const savedLogo = localStorage.getItem('custom_app_logo');
        if (savedLogo) setCustomLogo(savedLogo);
        return;
      }

      try {
        const data = await fetchMadrasahInfo();
        if (data) {
          setCustomLogo(data.logoApp || null);
          setLogoSurat(data.logoSurat || null);
          setLogoLayanan(data.logoLayanan || null);

          setWaConfig({
            enabled: data.whatsappEnabled || false,
            gateway: data.whatsappGateway || 'fonnte',
            token: data.whatsappToken || '',
            getwayToken: data.whatsappGetwayToken || '',
          });

          // Sync to localStorage for components that still use it
          if (data.logoApp) localStorage.setItem('custom_app_logo', data.logoApp);
        }
      } catch (e) {
        console.error('Error fetching branding in settings:', e);
      }
    };

    fetchBranding();

    // Load News Card Theme
    const savedTheme = localStorage.getItem('news_card_theme');
    if (savedTheme) setThemeConfig(JSON.parse(savedTheme));

    // Load initial local statistics
    fetchStats();
  }, [fetchMadrasahInfo]);

  const menuItems = [
    {
      label: 'Edit Data Profil',
      icon: PencilIcon,
      action: () => onNavigate(ViewState.PROFILE),
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      desc: 'Perbarui informasi pribadi Anda',
    },
    ...(canCustomize
      ? [
          {
            label: 'Identitas & Konfigurasi Madrasah',
            icon: BuildingLibraryIcon,
            action: () => onNavigate(ViewState.TENANT_SETTINGS),
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            desc: 'Atur info madrasah, branding, dan jam sesi',
          },
        ]
      : []),
    {
      label: 'Riwayat Login',
      icon: ShieldCheckIcon,
      action: () => onNavigate(ViewState.LOGIN_HISTORY),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      desc: 'Pantau aktivitas masuk akun',
    },
    {
      label: 'Tentang Aplikasi',
      icon: InfoIcon,
      action: () => onNavigate(ViewState.ABOUT),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      desc: 'Versi, pengembang, dan info sekolah',
    },
    {
      label: 'Perbarui Aplikasi',
      icon: ArrowPathIcon,
      action: async () => {
        const toastId = toast.loading('Memeriksa pembaruan...');
        try {
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          }
          if ('caches' in window) {
            const names = await caches.keys();
            for (const name of names) await caches.delete(name);
          }
          toast.success('Aplikasi diperbarui. Memuat ulang...', { id: toastId });
          setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
          toast.error('Gagal memperbarui aplikasi.', { id: toastId });
        }
      },
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      desc: 'Paksa unduh versi terbaru aplikasi',
    },
    {
      label: 'Sinkronisasi Data (Full)',
      icon: ArrowPathIcon,
      action: async () => {
        const toastId = toast.loading('Sinkronisasi data master...');
        try {
          // Clear all local caches
          localStorage.removeItem('emam_students_cache');
          localStorage.removeItem('emam_students_cache_time');
          localStorage.removeItem('emam_teachers_cache');
          localStorage.removeItem('emam_teachers_cache_time');

          // Legacy cleanup
          localStorage.removeItem('emam_students_cache');
          localStorage.removeItem('emam_teachers_cache');

          // Clear IndexedDB if possible
          const studentStore = useStudentStore.getState();
          const systemStore = useSystemStore.getState();

          await Promise.all([
            studentStore.fetchClasses(true),
            systemStore.fetchTeachers(true),
            studentStore.fetchStudents(true),
            systemStore.fetchMadrasahInfo(),
          ]);

          toast.success('Data berhasil disinkronkan ulang.', { id: toastId });
        } catch (e) {
          toast.error('Gagal sinkronisasi data.', { id: toastId });
        }
      },
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      desc: 'Segarkan data siswa, guru & info madrasah dari cloud',
    },
  ];

  const handleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'app' | 'surat' | 'layanan',
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar (Maks 5MB)');
        return;
      }

      setLoading(true);
      const toastId = toast.loading(`Mengunggah logo ${type}...`);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(new Error('Gagal membaca file gambar'));
        });

        // Use compressImage to reduce size
        const compressedBase64 = await compressImage(base64);

        if (!isMockMode) {
          const field = type === 'app' ? 'logoApp' : type === 'surat' ? 'logoSurat' : 'logoLayanan';
          await saveMadrasahInfoSettings({
            [field]: compressedBase64,
          });
        }

        if (type === 'app') {
          localStorage.setItem('custom_app_logo', compressedBase64);
          setCustomLogo(compressedBase64);
          window.dispatchEvent(new Event('storage'));
        } else if (type === 'surat') {
          setLogoSurat(compressedBase64);
        } else {
          setLogoLayanan(compressedBase64);
        }

        toast.success(
          `Logo ${type === 'app' ? 'Aplikasi' : type === 'surat' ? 'Surat' : 'Layanan'} berhasil diperbarui`,
          { id: toastId },
        );
      } catch (err: any) {
        console.error('Upload error:', err?.message || 'Error');
        toast.error('Gagal mengunggah logo: ' + err.message, { id: toastId });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetLogo = async (type: 'app' | 'surat' | 'layanan') => {
    const label = type === 'app' ? 'Aplikasi' : type === 'surat' ? 'Surat' : 'Layanan';
    if (safeConfirm(`Kembalikan logo ${label} ke default?`)) {
      setLoading(true);
      try {
        if (!isMockMode) {
          const field = type === 'app' ? 'logoApp' : type === 'surat' ? 'logoSurat' : 'logoLayanan';
          await saveMadrasahInfoSettings({
            [field]: null,
          });
        }

        if (type === 'app') {
          localStorage.removeItem('custom_app_logo');
          setCustomLogo(null);
          window.dispatchEvent(new Event('storage'));
        } else if (type === 'surat') {
          setLogoSurat(null);
        } else {
          setLogoLayanan(null);
        }

        toast.success(`Logo ${label} dikembalikan ke default`);
      } catch (err) {
        toast.error('Gagal mereset logo');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveWhatsApp = async () => {
    if (!canCustomize) return;

    setLoading(true);
    const toastId = toast.loading('Menyimpan konfigurasi WhatsApp...');

    try {
      if (!isMockMode) {
        await saveMadrasahInfoSettings({
          whatsappEnabled: waConfig.enabled,
          whatsappGateway: waConfig.gateway,
          whatsappToken: waConfig.token,
          whatsappGetwayToken: waConfig.getwayToken,
        });
      }

      toast.success('Konfigurasi WhatsApp berhasil disimpan', { id: toastId });
      fetchMadrasahInfo(); // Refresh state
    } catch (err: any) {
      toast.error('Gagal menyimpan konfigurasi: ' + err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Pengaturan"
      subtitle="Konfigurasi Aplikasi"
      icon={CogIcon}
      onBack={onBack}
      onOpenSidebar={onOpenSidebar}
    >
      <div className="p-4 lg:p-6 space-y-8 max-w-2xl mx-auto w-full pb-32">
        {/* User Theme Preference Module with Live-Preview */}
        <ThemePreferenceSection />

        {/* Permission Notification Section */}
        {[UserRole.DEVELOPER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole) && (
          <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white  tracking-tight">
                  Kontrol Notifikasi (Dev)
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Aktifkan untuk menerima notifikasi sistem penting.
                </p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationsEnabled ? 'translate-x-6.5' : 'translate-x-0.5'}`}
                ></div>
              </button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white  tracking-tight">
                  Maintenance Mode (Dev)
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Toggle status pemeliharaan sistem.
                </p>
              </div>
              <button
                onClick={handleToggleMaintenance}
                className={`w-12 h-6 rounded-full relative transition-colors ${maintenanceMode ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${maintenanceMode ? 'translate-x-6.5' : 'translate-x-0.5'}`}
                ></div>
              </button>
            </div>
          </div>
        )}

        {/* Branding Section */}
        {canCustomize && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 ml-2">
              <SparklesIcon className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Logo & Branding
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Logo Aplikasi */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative">
                      {customLogo ? (
                        <img
                          src={customLogo}
                          alt="Logo Aplikasi"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 text-indigo-600 dark:text-indigo-400">
                          <AppLogo />
                        </div>
                      )}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <CameraIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'app')}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">Logo Aplikasi</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium uppercase tracking-tight">
                      Logo utama yang muncul di sidebar dan dashboard.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-xl transition-colors shadow-sm active:scale-95"
                      >
                        Upload
                      </button>
                      {customLogo && (
                        <button
                          onClick={() => handleResetLogo('app')}
                          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wide rounded-xl transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <TrashIcon className="w-3 h-3" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Surat */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative">
                      {logoSurat ? (
                        <img
                          src={logoSurat}
                          alt="Logo Surat"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 text-emerald-600 dark:text-emerald-400">
                          <EnvelopeIcon className="w-full h-full" />
                        </div>
                      )}
                      <div
                        onClick={() => suratInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <CameraIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={suratInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'surat')}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">Logo Kop Surat</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium uppercase tracking-tight">
                      Logo yang digunakan pada kop surat resmi madrasah.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => suratInputRef.current?.click()}
                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-xl transition-colors shadow-sm active:scale-95"
                      >
                        Upload
                      </button>
                      {logoSurat && (
                        <button
                          onClick={() => handleResetLogo('surat')}
                          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wide rounded-xl transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <TrashIcon className="w-3 h-3" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Layanan Eksternal */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative">
                      {logoLayanan ? (
                        <img
                          src={logoLayanan}
                          alt="Logo Layanan"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 text-amber-600 dark:text-amber-400">
                          <GlobeAltIcon className="w-full h-full" />
                        </div>
                      )}
                      <div
                        onClick={() => layananInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <CameraIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={layananInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'layanan')}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">
                      Logo Layanan Eksternal
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium uppercase tracking-tight">
                      Logo untuk integrasi dengan layanan Kemenag/Pusaka.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => layananInputRef.current?.click()}
                        className="px-4 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-xl transition-colors shadow-sm active:scale-95"
                      >
                        Upload
                      </button>
                      {logoLayanan && (
                        <button
                          onClick={() => handleResetLogo('layanan')}
                          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wide rounded-xl transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <TrashIcon className="w-3 h-3" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Integration Section */}
        {canCustomize && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 ml-2">
              <div className="w-4 h-4 text-emerald-500 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Integrasi WhatsApp Gateway
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
                    Status Layanan
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Aktifkan untuk mengirim notifikasi via WhatsApp.
                  </p>
                </div>
                <button
                  onClick={() => setWaConfig({ ...waConfig, enabled: !waConfig.enabled })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${waConfig.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${waConfig.enabled ? 'translate-x-6.5' : 'translate-x-0.5'}`}
                  ></div>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">
                    Pilih Provider (Gateway)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWaConfig({ ...waConfig, gateway: 'fonnte' })}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all ${waConfig.gateway === 'fonnte' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-4 ring-indigo-500/10' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-500'}`}
                    >
                      Fonnte.com
                    </button>
                    <button
                      onClick={() => setWaConfig({ ...waConfig, gateway: 'getway' })}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all ${waConfig.gateway === 'getway' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-4 ring-indigo-500/10' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-500'}`}
                    >
                      Getway.id
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {waConfig.gateway === 'fonnte' ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">
                        API Token Fonnte
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <ShieldCheckIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          value={waConfig.token}
                          onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                          placeholder="Masukkan API Token Fonnte..."
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">
                        API Token Getway
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <CommandLineIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          value={waConfig.getwayToken}
                          onChange={(e) =>
                            setWaConfig({ ...waConfig, getwayToken: e.target.value })
                          }
                          placeholder="Masukkan API Token Getway..."
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3">
                  <InfoIcon className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                    Pastikan token yang dimasukkan masih aktif. Notifikasi WhatsApp akan dikirim ke
                    nomor wali murid yang terdaftar saat absen dicatat.
                  </p>
                </div>

                <button
                  onClick={handleSaveWhatsApp}
                  disabled={loading}
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold text-xs py-4 rounded-3xl hover:bg-slate-800 dark:hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheckIcon className="w-4 h-4" />
                  )}
                  Simpan Konfigurasi WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local Data Management Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-2">
            <RectangleStackIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pengelolaan Data Lokal
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                <p className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                  Terakhir Diperbarui
                </p>
                <div className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                  {isSyncing ? (
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sinkronisasi...
                    </span>
                  ) : lastSync ? (
                    formatLastSync(lastSync)
                  ) : (
                    'Belum pernah'
                  )}
                </div>
                <p className="text-[8px] font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight">
                  Sinkronisasi latar belakang terakhir
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                <p className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 font-sans">
                  Status Sinkronisasi
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {isSyncing ? (
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isSyncing ? 'Sedang Berjalan' : 'Siap / Sinkron'}
                  </span>
                </div>
                <p className="text-[8px] font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight">
                  Koneksi database lokal aktif
                </p>
              </div>
            </div>

            {/* Storage details list */}
            <div className="space-y-3 dark:border-slate-700/50 border-t pt-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1 font-mono">
                Detail Penyimpanan Cache (IndexedDB)
              </h4>

              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/30 dark:border-slate-800/30 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Siswa</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {stats.students}
                    </p>
                    <p className="text-[8px] font-medium text-slate-450 dark:text-slate-500">
                      Record
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/30 dark:border-slate-800/30 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Guru</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {stats.teachers}
                    </p>
                    <p className="text-[8px] font-medium text-slate-450 dark:text-slate-500">
                      Record
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/30 dark:border-slate-800/30 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Kelas</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {stats.classes}
                    </p>
                    <p className="text-[8px] font-medium text-slate-450 dark:text-slate-500">
                      Record
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/30 dark:border-slate-800/30 text-center">
                    <p className="text-[8px] font-bold text-rose-455 dark:text-rose-500 uppercase">
                      Pending Scan
                    </p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {stats.pendingScans}
                    </p>
                    <p className="text-[8px] font-medium text-slate-455 dark:text-slate-500">
                      Belum Sinkron
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex gap-3">
                <InfoIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-755 dark:text-indigo-300 leading-relaxed font-semibold">
                  Sistem luring otomatis menyinkronkan data presensi anak yang disimpan di perangkat
                  ini ketika jaringan internet terhubung kembali. Menghapus cache hanya akan
                  membersihkan berkas unduhan master data (seperti daftar nama siswa) dan akan
                  ditarik kembali secara luring dari server secara otomatis.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleClearIndexedDBCache}
                  className="flex-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs py-3.5 rounded-2xl hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Bersihkan Cache Lokal (IndexedDB)
                </button>
                <button
                  onClick={fetchStats}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-3.5 px-5 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                  Segarkan Info
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Menu Group */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">
            Akun & Sistem
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            {menuItems.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      {item.label}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                </button>
                {idx < menuItems.length - 1 && (
                  <hr className="border-slate-100 dark:border-slate-700 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onLogout}
            className="w-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 transition-colors"
          >
            <LogOutIcon className="w-5 h-5" /> Keluar Aplikasi
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
