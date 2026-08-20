import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ChevronRight,
  SparklesIcon,
  ZapIcon,
} from '@/shared/Icons';
import { useTenantStore } from '@/stores/tenantStore';
import { getRoleScope, roleLabels } from '@/constants/dashboard';

const getPermissionStatus = (role: string) => {
  const r = String(role || 'tamu').toLowerCase();

  const isDev = r === 'developer';
  const isAdmin = r === 'admin';
  const isKepala = r === 'kepala_madrasah';
  const isWakamad = r === 'wakamad';
  const isTU = r === 'kepala_tu';
  const isGuru = ['guru', 'wali_kelas', 'guru_bk', 'pembina_ekskul'].includes(r);

  const isManagement = isDev || isAdmin || isKepala || isWakamad || isTU;

  return {
    dashboard: true,
    akademik: true,
    kesiswaan: isManagement || isGuru || r === 'staf',
    presensi: true,
    bk: ['guru_bk', 'admin', 'developer', 'wakamad', 'kepala_madrasah'].includes(r),
    persuratan: true,
    user: isDev || isAdmin,
    pengaturan: isDev || isAdmin || isKepala,
    devConsole: isDev || isAdmin,
  };
};

interface ProfileHomeProps {
  profile: any;
  onEdit: (section: string) => void;
  theme: any;
}

export const ProfileHome: React.FC<ProfileHomeProps> = ({ profile, onEdit, theme }) => {
  const { config: tenantConfig } = useTenantStore();
  const scope = getRoleScope(profile.role);
  const perms = getPermissionStatus(profile.role);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending_account_approval':
      case 'pending_data_approval':
        return {
          label: 'Menunggu Verifikasi',
          color: 'text-amber-500',
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          animate: 'animate-pulse',
        };
      case 'onboarding_rejected':
        return {
          label: 'Ditolak / Perbaikan',
          color: 'text-rose-500',
          bg: 'bg-rose-50 dark:bg-rose-900/20',
          animate: '',
        };
      case 'needs_id_verification':
      case 'needs_data_linkage':
        return {
          label: 'Butuh Penautan Data',
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          animate: '',
        };
      case 'Active':
      case 'active':
        return {
          label: 'Aktif',
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          animate: '',
        };
      default:
        return {
          label: status || 'Aktif',
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          animate: '',
        };
    }
  };

  const statusCfg = getStatusConfig(profile.status);

  const stats = [
    {
      label: 'Status Akun',
      value: statusCfg.label,
      icon: ShieldCheckIcon,
      color: statusCfg.color,
      bg: statusCfg.bg,
      animate: statusCfg.animate,
    },
    {
      label: 'ID Unik',
      value: profile.idUnik || profile.studentsId || profile.teachersId || '-',
      icon: IdentificationIcon,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: 'Role Sistem',
      value: theme.label,
      icon: theme.icon,
      color: theme.text.split(' ')[0],
      bg: theme.bgLight,
    },
  ];

  const quickLinks = [
    { id: 'akun', label: 'Pengaturan Akun', desc: 'Email, Nama & Password', icon: ShieldCheckIcon },
    { id: 'dataPokok', label: 'Biodata Instansi', desc: 'NIP/NISN & Data Akademik', icon: ZapIcon },
    { id: 'kontak', label: 'Alamat & Kontak', desc: 'Telepon & Lokasi Rumah', icon: MapPinIcon },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} ${stat.animate || ''}`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                {stat.label}
              </p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase mt-0.5">
                {stat.value}
              </h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xl">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <SparklesIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-[0.2em]">
              Ringkasan Identitas
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                    Email Terdaftar
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {profile.email || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                    Nomor WhatsApp
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {profile.phone || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                    Domisili
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {profile.address || 'Alamat belum diatur'}
                  </p>
                </div>
              </div>
              {profile.class && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-indigo-500">
                    <ZapIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                      Rombel / Penugasan
                    </p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      {profile.class}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Terakhir diperbarui:{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* --- RBAC INFORMATION CENTER & PERMISSION SUMMARY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RBAC Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">🛡️</span>
              <h3 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-[0.2em]">
                RBAC Information Center
              </h3>
            </div>

            <div className="space-y-3.5">
              {[
                { label: 'Nama Pengguna', value: profile.displayName || '-' },
                {
                  label: 'Tenant Madrasah',
                  value: tenantConfig?.namaSekolah || 'MAN 1 Hulu Sungai Tengah',
                },
                { label: 'NSM / NPSN', value: tenantConfig?.npsn || '30315537' },
                {
                  label: 'Role Aktif',
                  value: roleLabels[profile.role] || profile.role || 'Tenaga Kependidikan',
                  highlight: true,
                },
                {
                  label: 'Role Scope',
                  customValue: (
                    <span
                      className={`text-[8.5px] font-extrabold uppercase px-2.5 py-0.5 rounded border tracking-wider ${scope.color}`}
                    >
                      {scope.symbol} {scope.label}
                    </span>
                  ),
                },
                { label: 'Status Akun', value: 'Aktif', isStatus: true },
                { label: 'Login Terakhir', value: '2 Juli 2026' },
                { label: 'Permission Group', value: scope.group, isMono: true },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40 last:border-0"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {row.label}
                  </span>
                  {row.customValue ? (
                    row.customValue
                  ) : row.isStatus ? (
                    <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 rounded-full uppercase tracking-wider">
                      {row.value}
                    </span>
                  ) : (
                    <span
                      className={`text-xs text-right max-w-[60%] truncate ${row.highlight ? 'font-bold text-indigo-600 dark:text-indigo-400 uppercase' : row.isMono ? 'font-mono text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded' : 'font-bold text-slate-700 dark:text-slate-300'}`}
                    >
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Developer Platform Info Banner */}
          {profile.role?.toLowerCase() === 'developer' && (
            <div className="mt-6 p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                Developer Console Access
              </span>
              <p className="text-[10px] font-medium leading-relaxed text-purple-700 dark:text-purple-300">
                You have full <strong>Platform-wide administrative capability</strong> under the{' '}
                <code>developer</code> permission group, allowing you to debug and administer any
                active tenant.
              </p>
            </div>
          )}
        </div>

        {/* Permission Summary Checklists */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl">📋</span>
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-[0.2em]">
              Cakupan Hak Akses (Permission Summary)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'dashboard', label: 'Dashboard', desc: 'Akses Beranda & Ringkasan' },
              { id: 'akademik', label: 'Akademik', desc: 'Jurnal, Jadwal & Kalender' },
              { id: 'kesiswaan', label: 'Kesiswaan', desc: 'Data Siswa, Kelas & Mutasi' },
              { id: 'presensi', label: 'Presensi', desc: 'Scan QR & Presensi Guru/Siswa' },
              { id: 'bk', label: 'Layanan BK', desc: 'Konseling & Poin Pelanggaran' },
              { id: 'persuratan', label: 'Persuratan (PTSP)', desc: 'Pengajuan & Moderasi Surat' },
              { id: 'user', label: 'Manajemen User', desc: 'Kelola Akun, GTK & Siswa' },
              { id: 'pengaturan', label: 'Pengaturan', desc: 'Konfigurasi Sistem & Tenant' },
              { id: 'devConsole', label: 'Developer Console', desc: 'Akses Konsol Pengembang' },
            ].map((p) => {
              const hasAccess = perms[p.id as keyof typeof perms];
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${hasAccess ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-500/5 border-slate-100 dark:border-slate-800/40 opacity-70'}`}
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                      {p.label}
                    </h5>
                    <p className="text-[7px] text-slate-400 dark:text-slate-500 mt-1 leading-none uppercase font-semibold truncate">
                      {p.desc}
                    </p>
                  </div>

                  {hasAccess ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-emerald-500/20">
                      ✔
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-[9px] shrink-0 border border-rose-500/20">
                      ✖
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigasi Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-4">
          Kelola Informasi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onEdit(link.id)}
              className="group bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-500 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <link.icon className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-none uppercase">
                    {link.label}
                  </h5>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold  opacity-70">
                    {link.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
