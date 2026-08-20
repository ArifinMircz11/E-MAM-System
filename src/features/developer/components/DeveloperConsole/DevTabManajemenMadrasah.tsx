import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useTenantStore as useTenantConfigStore } from '@/stores/tenantStore';
import { useTenantStore as useTenantDataStore } from '@/hooks/useTenant';
import { ViewState, UserRole } from '@/types';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { classRepository } from '@/repositories/classRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { madrasahService } from '@/services/madrasahService';
import type { SecurityContext } from '@/core/security/types';
import * as Icons from '@/shared/Icons';
import { motion, AnimatePresence } from 'framer-motion';

import { MadrasahCreateModal } from '../Madrasah/MadrasahCreateModal';
import { CreateAdminMadrasahModal } from '../Madrasah/CreateAdminMadrasahModal';
import { useSecurity } from '@/hooks/useSecurity';
import { getSecurityContext } from '@/core/security/contextHelper';

// List of Simulation Tenants
const TENANTS = [
  {
    id: 'tenant_30315537',
    nsm: '131163070001',
    npsn: '30315537',
    namaTenant: 'MAN 1 HST',
    namaMadrasah: 'MAN 1 Hulu Sungai Tengah',
    jenjang: 'MA',
    status: 'Negeri',
    kabupaten: 'Hulu Sungai Tengah',
    color: 'from-emerald-500 to-teal-600',
    logo: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    students: 650,
    classes: 20,
    teachers: 55,
  },
  {
    id: 'tenant_30315536',
    nsm: '131163070002',
    npsn: '30315536',
    namaTenant: 'MAN 2 HST',
    namaMadrasah: 'MAN 2 Hulu Sungai Tengah',
    jenjang: 'MA',
    status: 'Negeri',
    kabupaten: 'Hulu Sungai Tengah',
    color: 'from-blue-500 to-indigo-600',
    logo: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    students: 520,
    classes: 16,
    teachers: 42,
  },
  {
    id: 'tenant_30315535',
    nsm: '121163070003',
    npsn: '30315535',
    namaTenant: 'MTsN 1 HST',
    namaMadrasah: 'MTsN 1 Hulu Sungai Tengah',
    jenjang: 'MTs',
    status: 'Negeri',
    kabupaten: 'Hulu Sungai Tengah',
    color: 'from-amber-500 to-orange-600',
    logo: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    students: 780,
    classes: 24,
    teachers: 60,
  },
  {
    id: 'tenant_30315534',
    nsm: '111163070004',
    npsn: '30315534',
    namaTenant: 'MIN 1 HST',
    namaMadrasah: 'MIN 1 Hulu Sungai Tengah',
    jenjang: 'MI',
    status: 'Negeri',
    kabupaten: 'Hulu Sungai Tengah',
    color: 'from-purple-500 to-pink-600',
    logo: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    students: 410,
    classes: 12,
    teachers: 28,
  },
  {
    id: 'tenant_30315533',
    nsm: '011163070005',
    npsn: '30315533',
    namaTenant: 'RA Al-Ikhlas',
    namaMadrasah: 'RA Al-Ikhlas Barabai',
    jenjang: 'RA',
    status: 'Swasta',
    kabupaten: 'Hulu Sungai Tengah',
    color: 'from-rose-500 to-red-600',
    logo: 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K',
    students: 95,
    classes: 5,
    teachers: 10,
  },
];

// System Views for Permission Preview
const SYSTEM_VIEWS = [
  { id: 'dashboard', label: 'Beranda (Dashboard)', category: 'Beranda' },
  { id: 'announcements', label: 'Komunikasi (Pengumuman)', category: 'Komunikasi' },
  { id: 'profile', label: 'Profil Saya', category: 'Profil & Akun' },
  { id: 'login_logs', label: 'Sesi Login', category: 'Profil & Akun' },
  { id: 'info', label: 'Informasi Madrasah', category: 'Informasi' },
  { id: 'rombels', label: 'Rombongan Belajar', category: 'Akademik' },
  { id: 'promotion', label: 'Kenaikan Kelas', category: 'Akademik' },
  { id: 'reports', label: 'Cetak Laporan', category: 'Akademik' },
  { id: 'students_list', label: 'Data Siswa', category: 'Kesiswaan & SDM' },
  { id: 'teachers_list', label: 'Guru & GTK', category: 'Kesiswaan & SDM' },
  { id: 'mutations', label: 'Data Mutasi', category: 'Kesiswaan & SDM' },
  { id: 'attendance', label: 'Presensi', category: 'Presensi & Poin' },
  { id: 'points', label: 'Poin & Pelanggaran', category: 'Presensi & Poin' },
  { id: 'letters', label: 'Persuratan', category: 'Layanan & Administrasi' },
  { id: 'settings', label: 'Pengaturan', category: 'Layanan & Administrasi' },
];

const ROLES = [
  { id: 'developer', label: 'Developer', color: 'bg-red-500' },
  { id: 'admin', label: 'Admin Madrasah', color: 'bg-indigo-500' },
  { id: 'guru', label: 'Guru / GTK', color: 'bg-emerald-500' },
  { id: 'siswa', label: 'Siswa', color: 'bg-blue-500' },
  { id: 'orangtua', label: 'Orang Tua', color: 'bg-amber-500' },
];

export const DevTabManajemenMadrasah: React.FC = () => {
  const { tenantId: activeTenantId, setUserData } = useUserStore();
  const [selectedSubTab, setSelectedSubTab] = useState<
    'pilih_tenant' | 'dashboard' | 'sidebar' | 'permissions' | 'responsive'
  >('pilih_tenant');
  const [selectedRole, setSelectedRole] = useState<string>('admin');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Real data state
  const [tenantStats, setTenantStats] = useState({
    studentsCount: 0,
    classesCount: 0,
    teachersCount: 0,
    attendanceToday: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Responsive simulation state
  const [viewportSize, setViewportSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const { can } = useSecurity();
  const securityCtx = getSecurityContext();
  const [realMadrasahs, setRealMadrasahs] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedMadrasahForAdmin, setSelectedMadrasahForAdmin] = useState<{
    tenantId: string;
    namaMadrasah: string;
    npsn?: string;
  } | null>(null);

  const allMadrasahsList = useMemo(() => {
    const list = TENANTS.map((t) => ({
      tenantId: t.id,
      namaMadrasah: t.namaMadrasah,
      npsn: t.npsn,
    }));
    realMadrasahs.forEach((m) => {
      if (!list.some((item) => item.tenantId === m.tenantId)) {
        list.push({
          tenantId: m.tenantId,
          namaMadrasah: m.namaMadrasah,
          npsn: m.npsn,
        });
      }
    });
    return list;
  }, [realMadrasahs]);

  // Filtered tenants & real madrasahs
  const filteredTenants = useMemo(() => {
    return TENANTS.filter((t) => {
      const matchQuery =
        t.namaMadrasah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.namaTenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nsm.includes(searchQuery) ||
        t.npsn.includes(searchQuery) ||
        t.kabupaten.toLowerCase().includes(searchQuery.toLowerCase());
      const matchJenjang = filterJenjang === 'ALL' || t.jenjang === filterJenjang;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchQuery && matchJenjang && matchStatus;
    });
  }, [searchQuery, filterJenjang, filterStatus]);

  const filteredRealMadrasahs = useMemo(() => {
    return realMadrasahs.filter((m) => {
      const matchQuery =
        (m.namaMadrasah || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.npsn || '').includes(searchQuery) ||
        (m.kabupaten || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchJenjang = filterJenjang === 'ALL' || m.jenjang === filterJenjang;
      const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
      return matchQuery && matchJenjang && matchStatus;
    });
  }, [realMadrasahs, searchQuery, filterJenjang, filterStatus]);

  // Fetch real madrasahs from Dexie
  const fetchRealMadrasahs = useCallback(async () => {
    if (!securityCtx) return;
    try {
      const data = await madrasahService.getMadrasahs(securityCtx);
      setRealMadrasahs(data);
    } catch (error) {
      console.error('Gagal mengambil daftar madrasah riil:', error);
    }
  }, [securityCtx]);

  useEffect(() => {
    fetchRealMadrasahs();
  }, [fetchRealMadrasahs]);

  // Sync menu navigation with sidebar tree clicks
  useEffect(() => {
    const handleMenuClick = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id === 'manajemen_madrasah') {
        if (detail.label === 'Beranda' || detail.label === 'Beranda (Dashboard)') {
          setSelectedSubTab('dashboard');
        } else if (detail.label === 'Komunikasi') {
          setSelectedSubTab('sidebar');
        } else if (detail.label === 'Profil & Akun' || detail.label === 'Permission Preview') {
          setSelectedSubTab('permissions');
        } else if (
          detail.label === 'Responsive Preview' ||
          detail.label === 'Documentation' ||
          detail.label === 'Tentang Aplikasi'
        ) {
          setSelectedSubTab('responsive');
        } else {
          setSelectedSubTab('sidebar');
        }
      } else if (detail && detail.id === 'tenant_mgmt') {
        setSelectedSubTab('pilih_tenant');
      }
    };
    window.addEventListener('dev-console-menu-click', handleMenuClick);
    return () => window.removeEventListener('dev-console-menu-click', handleMenuClick);
  }, []);

  // Current active tenant metadata
  const activeTenant = useMemo(() => {
    return TENANTS.find((t) => t.id === activeTenantId) || TENANTS[0];
  }, [activeTenantId]);

  // Fetch real statistics from Dexie repositories (Offline First)
  const fetchTenantStats = async () => {
    setIsLoadingStats(true);
    try {
      const securityContext: SecurityContext = {
        tenantId: activeTenantId || '30315537',
        uid: 'simulated-dev',
        role: 'developer',
        roles: ['developer'],
        permissions: new Set() as any,
        scope: {} as any,
        sessionId: 'simulated',
        isDeveloper: true,
      } as any;

      const [students, classes, teachers, attendances] = await Promise.all([
        studentRepository.getAll(securityContext),
        classRepository.fetchByTenant(securityContext),
        teacherRepository.fetchByTenant(securityContext),
        attendanceRepository.getAll(securityContext),
      ]);

      // Filter local lists for current simulated tenant
      const localStudents = students.filter((s) => s.tenantId === activeTenantId);
      const localClasses = classes.filter((c) => c.tenantId === activeTenantId);
      const localTeachers = teachers.filter((t) => t.tenantId === activeTenantId);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendance = attendances.filter(
        (a) =>
          a.tenantId === activeTenantId &&
          String((a as any).date || (a as any).tanggal || '').startsWith(todayStr),
      ).length;

      setTenantStats({
        studentsCount: localStudents.length || Math.floor(Math.random() * 120) + 180, // fallbacks if empty database
        classesCount: localClasses.length || Math.floor(Math.random() * 8) + 12,
        teachersCount: localTeachers.length || Math.floor(Math.random() * 20) + 30,
        attendanceToday: todayAttendance || Math.floor(Math.random() * 50) + 120,
      });
    } catch (error) {
      console.error('Gagal mengambil data operasional Dexie:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchTenantStats();
  }, [activeTenantId]);

  const handleSwitchTenant = (tenantId: string, nama: string) => {
    setUserData({ tenantId });
    toast.success(`Berhasil beralih ke Tenant Simulasi: ${nama}`);
  };

  const handleEnterDashboard = (targetTenantId: string, nama: string) => {
    const tenant = TENANTS.find((t) => t.id === targetTenantId) || TENANTS[0];

    // 1. Set context in useUserStore
    useUserStore.getState().setUserData({
      tenantId: targetTenantId,
    });

    // 2. Set context in authStore user data
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setUser({
        ...currentUser,
        tenantId: targetTenantId,
      });
    }

    // 3. Update useTenantConfigStore
    useTenantConfigStore.getState().setTenantConfig({
      npsn: targetTenantId,
      namaSekolah: tenant.namaMadrasah,
      batasWaktuMasuk: '07:15',
      batasWaktuPulang: '14:30',
      geofenceRadius: 100,
    });

    // 4. Update useTenantDataStore
    useTenantDataStore.getState().setTenantData({
      identitas: {
        namaMadrasah: tenant.namaMadrasah,
        nsm: tenant.nsm,
        npsn: tenant.id,
        telepon: '08123456789',
        email: 'kontak@example.com',
        alamatLengkap: 'Kabupaten Hulu Sungai Tengah, Kalimantan Selatan',
      },
      konfigurasiSesi: {
        jadwal: {
          masuk: '07:15',
          pulang: '14:30',
        },
        toleransiKeterlambatan: 15,
      },
      branding: {
        warnaTema: '#4f46e5',
        logoAppUrl: tenant.logo,
      },
      konfigurasiSistem: {
        semesterAktif: 'Ganjil',
        tahunAjaranAktif: '2026/2027',
        isMaintenance: false,
      },
    });

    // 5. Navigate to Dashboard view
    useUIStore.getState().setCurrentView(ViewState.DASHBOARD);

    toast.success(`Berhasil masuk ke Dashboard: ${tenant.namaMadrasah}`);
  };

  const handleEnterWorkspace = (targetTenantId: string, roleId: string) => {
    const tenant = TENANTS.find((t) => t.id === targetTenantId) || TENANTS[0];

    // 1. Determine simulated accountType based on roleId
    let accountType: 'student' | 'teacher' | 'parent' | 'staff' | 'other' = 'other';
    if (roleId === 'siswa') accountType = 'student';
    else if (roleId === 'orangtua') accountType = 'parent';
    else if (['guru', 'guru_bk', 'wali_kelas', 'kepala_madrasah', 'wakamad'].includes(roleId))
      accountType = 'teacher';
    else if (['kepala_tu', 'staf'].includes(roleId)) accountType = 'staff';

    // 2. Map roleId properly to UserRole
    let mappedRole: UserRole = UserRole.DEVELOPER;
    if (roleId === 'admin') mappedRole = UserRole.ADMIN;
    else if (roleId === 'kepala_madrasah') mappedRole = UserRole.KEPALA_MADRASAH;
    else if (roleId === 'kepala_tu') mappedRole = UserRole.KEPALA_TU;
    else if (roleId === 'staf') mappedRole = UserRole.STAF;
    else if (roleId === 'guru') mappedRole = UserRole.GURU;
    else if (roleId === 'guru_bk') mappedRole = UserRole.GURU_BK;
    else if (roleId === 'wali_kelas') mappedRole = UserRole.WALI_KELAS;
    else if (roleId === 'siswa') mappedRole = UserRole.SISWA;
    else if (roleId === 'orangtua') mappedRole = UserRole.ORANG_TUA;
    else if (roleId === 'wakamad') mappedRole = UserRole.WAKAMAD;

    // 3. Set simulated user store data in useUserStore (Zustand state)
    useUserStore.getState().setUserData({
      tenantId: targetTenantId,
      roles: [mappedRole],
      accountType: accountType as any,
      referenceId: 'simulated-ref-id',
      uid: 'simulated-user-id',
      email: 'admin@example.com', // keep email to keep developer console access
      status: 'active' as any,
    });

    // 4. Set authStore user data so profiles, headers & avatars render correctly
    useAuthStore.getState().setUser({
      uid: 'simulated-user-id',
      email: 'admin@example.com',
      displayName: `Simulasi ${roleId.replace('_', ' ').toUpperCase()}`,
      photoURL: tenant.logo,
      role: mappedRole,
      roles: [mappedRole],
      tenantId: targetTenantId,
    });
    useAuthStore.getState().setAccountStatus('approved');

    // 5. Update useTenantConfigStore (from @/stores/tenantStore)
    useTenantConfigStore.getState().setTenantConfig({
      npsn: targetTenantId,
      namaSekolah: tenant.namaMadrasah,
      batasWaktuMasuk: '07:15',
      batasWaktuPulang: '14:30',
      geofenceRadius: 100,
    });

    // 6. Update useTenantDataStore (from @/hooks/useTenant)
    useTenantDataStore.getState().setTenantData({
      identitas: {
        namaMadrasah: tenant.namaMadrasah,
        nsm: tenant.nsm,
        npsn: tenant.id,
        telepon: '08123456789',
        email: 'kontak@example.com',
        alamatLengkap: 'Kabupaten Hulu Sungai Tengah, Kalimantan Selatan',
      },
      konfigurasiSesi: {
        jadwal: {
          masuk: '07:15',
          pulang: '14:30',
        },
        toleransiKeterlambatan: 15,
      },
      branding: {
        warnaTema: '#4f46e5',
        logoAppUrl: tenant.logo,
      },
      konfigurasiSistem: {
        semesterAktif: 'Ganjil',
        tahunAjaranAktif: '2026/2027',
        isMaintenance: false,
      },
    });

    // 7. Navigate to DASHBOARD view immediately using useUIStore
    useUIStore.getState().setCurrentView(ViewState.DASHBOARD);

    toast.success(
      `Berhasil masuk ke Workspace ${tenant.namaTenant} sebagai ${roleId.replace('_', ' ').toUpperCase()}`,
    );
  };

  // Helper to determine permissions for Role (Simulated based on standard system design)
  const checkPermission = (role: string, viewId: string): boolean => {
    if (role === 'developer') return true;
    if (role === 'admin') return true;

    // Guru Permissions
    if (role === 'guru') {
      const allowedViews = [
        'dashboard',
        'announcements',
        'profile',
        'login_logs',
        'info',
        'rombels',
        'students_list',
        'teachers_list',
        'attendance',
        'points',
      ];
      return allowedViews.includes(viewId);
    }

    // Siswa Permissions
    if (role === 'siswa') {
      const allowedViews = [
        'dashboard',
        'announcements',
        'profile',
        'login_logs',
        'info',
        'attendance',
        'points',
      ];
      return allowedViews.includes(viewId);
    }

    // Orang Tua Permissions
    if (role === 'orangtua') {
      const allowedViews = [
        'dashboard',
        'announcements',
        'profile',
        'info',
        'attendance',
        'points',
      ];
      return allowedViews.includes(viewId);
    }

    return false;
  };

  return (
    <div
      id="manajemen_madrasah_tab"
      className="p-4 md:p-6 overflow-y-auto h-full pb-40 custom-scrollbar bg-slate-50 dark:bg-[#020617]"
    >
      <MadrasahCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => {
          fetchRealMadrasahs();
          toast.success('Pendaftaran madrasah sedang diproses oleh Sync Engine.');
        }}
      />

      <CreateAdminMadrasahModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setSelectedMadrasahForAdmin(null);
        }}
        targetMadrasah={selectedMadrasahForAdmin}
        allMadrasahs={allMadrasahsList}
      />

      {/* Top Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white dark:bg-[#090F1E] p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Icons.BuildingLibraryIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Simulasi & Manajemen Madrasah
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                PULSE GATE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Area simulasi dan preview multi-tenant e-Mam System tanpa mempengaruhi data developer
              global.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {can('madrasah:create' as any) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-indigo-600/15 flex items-center gap-2 transition-all active:scale-95"
            >
              <Icons.PlusIcon className="w-4 h-4" />
              Tambah Madrasah
            </button>
          )}

          {/* Selected Tenant Info */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs">
            {activeTenant.namaTenant.substring(0, 3)}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tenant Aktif
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {activeTenant.namaMadrasah}
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        {[
          { id: 'pilih_tenant', label: '1. Pilih Tenant', icon: Icons.BuildingLibraryIcon },
          { id: 'dashboard', label: '2. Dashboard', icon: Icons.ChartBarIcon },
          { id: 'sidebar', label: '3. Sidebar Preview', icon: Icons.Bars3CenterLeftIcon },
          { id: 'permissions', label: '4. Permission Preview', icon: Icons.ShieldCheckIcon },
          { id: 'responsive', label: '5. Responsive Preview', icon: Icons.RectangleStackIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${
              selectedSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'bg-white dark:bg-[#090F1E] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: PILIH TENANT */}
        {selectedSubTab === 'pilih_tenant' && (
          <motion.div
            key="pilih_tenant"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Step 1: Pilih Madrasah */}
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#090F1E] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                    1
                  </span>
                  Pilih Madrasah (Tenant)
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-bold">
                    {filteredTenants.length + filteredRealMadrasahs.length} Terdaftar
                  </span>
                </h3>

                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Icons.MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama madrasah, NSM, NPSN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    />
                  </div>

                  <select
                    value={filterJenjang}
                    onChange={(e) => setFilterJenjang(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
                  >
                    <option value="ALL">Semua Jenjang</option>
                    <option value="RA">RA</option>
                    <option value="MI">MI</option>
                    <option value="MTs">MTs</option>
                    <option value="MA">MA</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                  </select>
                </div>
              </div>

              {filteredTenants.length === 0 && filteredRealMadrasahs.length === 0 ? (
                <div className="bg-white dark:bg-[#090F1E] rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
                    <Icons.BuildingLibraryIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Tidak ada madrasah ditemukan
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Coba sesuaikan kata kunci pencarian atau filter jenjang dan status di atas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTenants.map((tenant) => {
                    const isActive = tenant.id === activeTenantId;
                    return (
                      <div
                        key={tenant.id}
                        onClick={() => handleSwitchTenant(tenant.id, tenant.namaMadrasah)}
                        className={`cursor-pointer group relative overflow-hidden rounded-3xl border transition-all duration-300 bg-white dark:bg-[#090F1E] ${
                          isActive
                            ? 'border-indigo-500 ring-2 ring-indigo-500/15 shadow-xl shadow-indigo-500/5'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
                        }`}
                      >
                        {/* Decorative Gradient Bar */}
                        <div className={`h-2 bg-gradient-to-r ${tenant.color}`} />

                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 shrink-0">
                                <img
                                  src={tenant.logo}
                                  alt="Logo"
                                  className="w-10 h-10 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase">
                                    {tenant.jenjang} • {tenant.status}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    NPSN: {tenant.npsn}
                                  </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
                                  {tenant.namaMadrasah}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {tenant.namaTenant} • Kab. {tenant.kabupaten}
                                </p>
                              </div>
                            </div>

                            {isActive && (
                              <span className="flex h-3 w-3 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>

                          {/* Operational Quick View Metrics */}
                          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl text-center">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Siswa</div>
                              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                                {isActive ? tenantStats.studentsCount : tenant.students}
                              </div>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl text-center">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Rombel</div>
                              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                                {isActive ? tenantStats.classesCount : tenant.classes}
                              </div>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl text-center">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Guru/GTK</div>
                              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                                {isActive ? tenantStats.teachersCount : tenant.teachers}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-medium text-slate-400">
                              {isActive ? '● Tenant Sedang Aktif' : 'Klik untuk beralih tenant'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMadrasahForAdmin({
                                    tenantId: tenant.id,
                                    namaMadrasah: tenant.namaMadrasah,
                                    npsn: tenant.npsn,
                                  });
                                  setIsAdminModalOpen(true);
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5 transition-all"
                              >
                                <Icons.UserPlusIcon className="w-3.5 h-3.5" />
                                + Akun Admin
                              </button>
                              <button
                                id={`btn_enter_dashboard_${tenant.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnterDashboard(tenant.id, tenant.namaMadrasah);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                              >
                                <Icons.ArrowRightIcon className="w-4 h-4" />
                                Masuk
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Real Madrasahs */}
                  {filteredRealMadrasahs.map((madrasah) => {
                    const isActive = madrasah.tenantId === activeTenantId;
                    return (
                      <div
                        key={madrasah.id}
                        onClick={() => handleSwitchTenant(madrasah.tenantId, madrasah.namaMadrasah)}
                        className={`cursor-pointer group relative overflow-hidden rounded-3xl border transition-all duration-300 bg-white dark:bg-[#090F1E] ${
                          isActive
                            ? 'border-emerald-500 ring-2 ring-emerald-500/15 shadow-xl shadow-emerald-500/5'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
                        }`}
                      >
                        {/* Decorative Gradient Bar */}
                        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                  {madrasah.namaMadrasah.substring(0, 2).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                    <Icons.ShieldCheckIcon className="w-3 h-3" />
                                    Real Tenant • {madrasah.jenjang}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    NPSN: {madrasah.npsn}
                                  </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
                                  {madrasah.namaMadrasah}
                               </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Kab. {madrasah.kabupaten || 'Hulu Sungai Tengah'} • Status: {madrasah.status || 'Negeri'}
                                </p>
                              </div>
                            </div>

                            {isActive && (
                              <span className="flex h-3 w-3 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${madrasah.syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                              Sync: {madrasah.syncStatus || 'Active'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMadrasahForAdmin({
                                    tenantId: madrasah.tenantId || madrasah.npsn,
                                    namaMadrasah: madrasah.namaMadrasah,
                                    npsn: madrasah.npsn,
                                  });
                                  setIsAdminModalOpen(true);
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 transition-all"
                              >
                                <Icons.UserPlusIcon className="w-3.5 h-3.5" />
                                + Akun Admin
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnterDashboard(madrasah.tenantId, madrasah.namaMadrasah);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
                              >
                                <Icons.ArrowRightIcon className="w-4 h-4" />
                                Workspace
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Pilih Peran & Masuk Workspace */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 space-y-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  2
                </span>
                Pilih Peran Otorisasi (RBAC) & Masuk Workspace
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'developer',
                    label: 'Developer',
                    desc: 'Akses penuh + Dev Console',
                    icon: Icons.CpuChipIcon,
                  },
                  {
                    id: 'admin',
                    label: 'Admin Madrasah',
                    desc: 'Semua modul & Pengaturan',
                    icon: Icons.KeyIcon,
                  },
                  {
                    id: 'kepala_madrasah',
                    label: 'Kamad / Kepala',
                    desc: 'Dashboard Kepala & Rapor',
                    icon: Icons.ShieldCheckIcon,
                  },
                  {
                    id: 'kepala_tu',
                    label: 'Tata Usaha / TU',
                    desc: 'Administrasi & Surat',
                    icon: Icons.ClipboardDocumentListIcon,
                  },
                  {
                    id: 'guru',
                    label: 'Guru / GTK',
                    desc: 'Presensi & Kelas diampu',
                    icon: Icons.GraduationCapIcon,
                  },
                  {
                    id: 'guru_bk',
                    label: 'Guru BK',
                    desc: 'Konseling & Poin Siswa',
                    icon: Icons.ZapIcon,
                  },
                  {
                    id: 'wali_kelas',
                    label: 'Wali Kelas',
                    desc: 'Wali & Tanggung Jawab',
                    icon: Icons.TrophyIcon,
                  },
                  {
                    id: 'siswa',
                    label: 'Siswa',
                    desc: 'Poin, Absen & Jadwal',
                    icon: Icons.UserIcon,
                  },
                  {
                    id: 'orangtua',
                    label: 'Orang Tua',
                    desc: 'Portal Anak & Kehadiran',
                    icon: Icons.UsersIcon,
                  },
                ].map((r) => {
                  const isRoleSelected = selectedRole === r.id;
                  const IconComponent = r.icon || Icons.UserIcon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      className={`text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                        isRoleSelected
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/10'
                          : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl transition-all duration-300 ${
                            isRoleSelected
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {r.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {r.desc}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Enter Button Action */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => handleEnterWorkspace(activeTenantId || '', selectedRole || '')}
                  className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/15 hover:shadow-xl hover:shadow-indigo-600/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
                >
                  <Icons.Squares2x2Icon className="w-5 h-5" />
                  Masuk ke Workspace Tenant {activeTenant.namaTenant}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: DASHBOARD SIMULATOR */}
        {selectedSubTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Live Indicator Alert */}
            <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center gap-3">
              <Icons.ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Dashboard ini terhubung langsung ke database <strong>Dexie (IndexedDB)</strong>{' '}
                lokal untuk menjamin prinsip <strong>Offline-First & Local-First</strong>.
              </p>
            </div>

            {/* Simulated Live KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Siswa Terdaftar',
                  value: tenantStats.studentsCount,
                  icon: Icons.UsersGroupIcon,
                  color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
                },
                {
                  label: 'Total Rombel / Kelas',
                  value: tenantStats.classesCount,
                  icon: Icons.BuildingLibraryIcon,
                  color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
                },
                {
                  label: 'Guru & Tenaga Kependidikan',
                  value: tenantStats.teachersCount,
                  icon: Icons.BriefcaseIcon,
                  color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                },
                {
                  label: 'Siswa Hadir Hari Ini',
                  value: tenantStats.attendanceToday,
                  icon: Icons.ClockIcon,
                  color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
                },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#090F1E] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        {kpi.label}
                      </span>
                      <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {kpi.value}
                      </h4>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}
                    >
                      <kpi.icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Area / Attendance Simulation Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Absensi Stats donut placeholder */}
              <div className="bg-white dark:bg-[#090F1E] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 lg:col-span-1 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                  Kehadiran Hari Ini
                </h3>
                <div className="flex items-center justify-center h-48 relative">
                  {/* Simulated Donut Chart */}
                  <div className="w-36 h-36 rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-t-emerald-500 border-r-emerald-500 border-b-indigo-500 border-l-rose-500 rotate-45" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {Math.round(
                          (tenantStats.attendanceToday / (tenantStats.studentsCount || 1)) * 100,
                        )}
                        %
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        Kehadiran
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Present (Hadir)</span>
                    <span className="font-bold text-emerald-500">
                      {tenantStats.attendanceToday} Siswa
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Late (Terlambat)</span>
                    <span className="font-bold text-indigo-500">8 Siswa</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Alpha / Tanpa Ket</span>
                    <span className="font-bold text-rose-500">4 Siswa</span>
                  </div>
                </div>
              </div>

              {/* Latest announcements list */}
              <div className="bg-white dark:bg-[#090F1E] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 lg:col-span-2 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Pengumuman & Broadcast Terbaru
                    </h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      LIVE
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        title: 'Persiapan Ujian Semester Ganjil',
                        target: 'Semua Rombel',
                        date: 'Hari ini',
                      },
                      {
                        title: 'Sosialisasi Program Kedisiplinan Poin',
                        target: 'Wali Kelas & Orang Tua',
                        date: 'Kemarin',
                      },
                      {
                        title: 'Rapat Kerja Pengurus Madrasah',
                        target: 'Guru & GTK',
                        date: '2 hari lalu',
                      },
                    ].map((ann, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between border border-slate-100 dark:border-slate-800/40"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {ann.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Penerima: {ann.target}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">{ann.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Kelola Pengumuman &rarr;
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: SIDEBAR PREVIEW */}
        {selectedSubTab === 'sidebar' && (
          <motion.div
            key="sidebar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left controller panel */}
            <div className="bg-white dark:bg-[#090F1E] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 lg:col-span-1 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                Simulasi Berdasarkan Role
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Pilih salah satu role di bawah ini untuk melihat bagaimana struktur menu sidebar
                dirender secara dinamis sesuai matriks otorisasi.
              </p>

              <div className="space-y-2">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                      selectedRole === role.id
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${role.color}`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {role.label}
                      </span>
                    </div>
                    {selectedRole === role.id && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right sidebar layout preview */}
            <div className="bg-[#0B1121] text-slate-400 p-6 rounded-3xl border border-slate-800 lg:col-span-2 shadow-xl flex flex-col h-[550px] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                    {activeTenant.namaTenant.substring(0, 3)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{activeTenant.namaMadrasah}</div>
                    <div className="text-[10px] text-slate-500">
                      Simulasi Mode: {selectedRole.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
              </div>

              {/* Sidebar Tree representation */}
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                {/* 1. Beranda */}
                {checkPermission(selectedRole, 'dashboard') && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1.5 px-2">
                      Beranda
                    </div>
                    <div className="px-2 py-1.5 rounded-lg bg-slate-800/50 text-white font-bold flex items-center gap-2">
                      <Icons.HouseIcon className="w-4 h-4 text-emerald-400" />
                      Dashboard Admin
                    </div>
                  </div>
                )}

                {/* 2. Komunikasi */}
                {checkPermission(selectedRole, 'announcements') && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1.5 px-2">
                      Komunikasi
                    </div>
                    <div className="px-3 py-1.5 text-slate-400 flex items-center gap-2 hover:text-white transition-colors">
                      <Icons.MegaphoneIcon className="w-4 h-4" />
                      Pengumuman & Broadcast
                    </div>
                  </div>
                )}

                {/* 3. Akademik & Pengajaran */}
                {['developer', 'admin', 'guru'].includes(selectedRole) && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1.5 px-2">
                      Akademik & Pengajaran
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {checkPermission(selectedRole, 'rombels') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.BuildingLibraryIcon className="w-4 h-4" />
                          Rombel & Kelas
                        </div>
                      )}
                      {checkPermission(selectedRole, 'promotion') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.ArrowPathIcon className="w-4 h-4" />
                          Kenaikan Kelas
                        </div>
                      )}
                      {checkPermission(selectedRole, 'reports') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.ClipboardDocumentListIcon className="w-4 h-4" />
                          Cetak Laporan
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Kesiswaan & SDM */}
                {['developer', 'admin', 'guru'].includes(selectedRole) && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1.5 px-2">
                      Kesiswaan & SDM
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {checkPermission(selectedRole, 'students_list') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.UsersGroupIcon className="w-4 h-4" />
                          Data Siswa
                        </div>
                      )}
                      {checkPermission(selectedRole, 'teachers_list') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.BriefcaseIcon className="w-4 h-4" />
                          Guru & GTK
                        </div>
                      )}
                      {checkPermission(selectedRole, 'mutations') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.ExclamationTriangleIcon className="w-4 h-4" />
                          Data Mutasi
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Presensi & Poin */}
                {['developer', 'admin', 'guru', 'siswa', 'orangtua'].includes(selectedRole) && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1.5 px-2">
                      Presensi & Poin
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {checkPermission(selectedRole, 'attendance') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.ClockIcon className="w-4 h-4" />
                          Presensi Kehadiran
                        </div>
                      )}
                      {checkPermission(selectedRole, 'points') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.StarIcon className="w-4 h-4" />
                          Poin & Pelanggaran
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Layanan & Administrasi */}
                {['developer', 'admin'].includes(selectedRole) && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mb-1.5 px-2">
                      Layanan & Administrasi
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {checkPermission(selectedRole, 'letters') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.MegaphoneIcon className="w-4 h-4" />
                          Persuratan
                        </div>
                      )}
                      {checkPermission(selectedRole, 'settings') && (
                        <div className="px-2 py-1.5 flex items-center gap-2 hover:text-white transition-colors">
                          <Icons.ShieldCheckIcon className="w-4 h-4" />
                          Pengaturan
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: PERMISSION PREVIEW */}
        {selectedSubTab === 'permissions' && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-[#090F1E] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Matriks Akses & Permission Preview
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Status visibilitas menu berdasarkan Role pada e-Mam System.
                </p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-3 py-1 rounded-full font-bold">
                AUTO-EVALUATED
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4">Kategori Halaman</th>
                    <th className="p-4">Nama Halaman</th>
                    {ROLES.map((role) => (
                      <th key={role.id} className="p-4 text-center">
                        {role.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                  {SYSTEM_VIEWS.map((view) => (
                    <tr key={view.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="p-4 font-bold text-slate-400">{view.category}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {view.label}
                      </td>
                      {ROLES.map((role) => {
                        const hasAccess = checkPermission(role.id, view.id);
                        return (
                          <td key={role.id} className="p-4 text-center">
                            {hasAccess ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-400 dark:bg-rose-950/20 dark:text-rose-900/60">
                                ✕
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* VIEW 5: RESPONSIVE PREVIEW */}
        {selectedSubTab === 'responsive' && (
          <motion.div
            key="responsive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Controller for viewport */}
            <div className="flex items-center gap-3 bg-white dark:bg-[#090F1E] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Viewport Simulation Frame
                </h4>
                <p className="text-[10px] text-slate-500">
                  Uji visual responsiveness dashboard madrasah di berbagai ukuran perangkat.
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'desktop', label: 'Desktop (1200px)', icon: Icons.CpuChipIcon },
                  { id: 'tablet', label: 'Tablet (768px)', icon: Icons.ClipboardDocumentListIcon },
                  { id: 'mobile', label: 'Mobile (375px)', icon: Icons.ClockIcon },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setViewportSize(view.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                      viewportSize === view.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <view.icon className="w-3.5 h-3.5" />
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Device Sandbox */}
            <div className="flex justify-center bg-slate-100 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-[500px]">
              <div
                className="transition-all duration-500 bg-white dark:bg-[#040815] rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
                style={{
                  width:
                    viewportSize === 'desktop'
                      ? '100%'
                      : viewportSize === 'tablet'
                        ? '768px'
                        : '375px',
                  maxWidth: '100%',
                }}
              >
                {/* Simulated Browser Title Bar */}
                <div className="bg-slate-50 dark:bg-[#090F1E] border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="bg-slate-200/50 dark:bg-slate-800/60 text-[10px] px-8 py-1 rounded-lg text-slate-500 dark:text-slate-400 w-1/2 text-center truncate">
                    https://emam.madrasah.go.id/tenant/{activeTenantId}/dashboard
                  </div>
                  <div className="w-8" />
                </div>

                {/* Simulated Device content (A beautifully condensed live preview of the tenant's app header and simple dashboard cards) */}
                <div className="p-6 overflow-y-auto max-h-[500px] flex-1 custom-scrollbar text-xs">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wide">
                        {activeTenant.namaTenant}
                      </div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        Sistem Akademik Terintegrasi
                      </h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600">
                      <Icons.UsersGroupIcon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Responsive grid based on container dimensions */}
                  <div
                    className={`grid gap-4 ${viewportSize === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'}`}
                  >
                    {[
                      {
                        label: 'Siswa',
                        val: tenantStats.studentsCount,
                        color: 'border-l-blue-500',
                      },
                      {
                        label: 'Kelas',
                        val: tenantStats.classesCount,
                        color: 'border-l-indigo-500',
                      },
                      {
                        label: 'Guru/GTK',
                        val: tenantStats.teachersCount,
                        color: 'border-l-emerald-500',
                      },
                      {
                        label: 'Kehadiran',
                        val: tenantStats.attendanceToday,
                        color: 'border-l-rose-500',
                      },
                    ].map((card, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 border-l-4 ${card.color}`}
                      >
                        <div className="text-[10px] font-medium text-slate-400">{card.label}</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {card.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Simulated main panel */}
                  <div className="mt-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Informasi Rencana Pembelajaran Terkini
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Layanan presensi terintegrasi madrasah siap digunakan untuk guru, staf, wali
                      kelas, dan siswa. Semua riwayat tersimpan offline di IndexedDB dan
                      disinkronisasikan berkala.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
};
