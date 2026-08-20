import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingLibraryIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon, 
  RefreshCwIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon
} from '@/shared/Icons';
import { KanwilDashboardService } from '../services/kanwilDashboardService';
import type { KanwilDashboardSummary } from '../types';
import { ViewState } from '@/types/roles';

interface Props {
  onNavigate: (view: ViewState) => void;
}

export const KanwilDashboardView: React.FC<Props> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<KanwilDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    KanwilDashboardService.getSummary().then((data) => {
      if (isMounted) {
        setSummary(data);
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wide rounded-full border border-emerald-400/30">
                Workspace Kanwil
              </span>
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wide rounded-full border border-cyan-400/30">
                Provinsi Kalimantan Selatan
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">
              Kanwil Kementerian Agama
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl font-medium">
              Pusat Kendali Pengawasan, Data Satuan Kerja, Jenjang Madrasah, Penugasan, dan Sinkronisasi Offline-First Seluruh Wilayah Kalimantan Selatan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(ViewState.DEV_SYNC)}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all border border-white/20 flex items-center gap-2 shadow-sm"
            >
              <RefreshCwIcon className="w-4 h-4 animate-spin-slow" />
              <span>Sinkronisasi Delta</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate(ViewState.MADRASAH_MASTER)}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <BuildingLibraryIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
              Total Madrasah
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {isLoading ? '...' : summary?.totalMadrasah.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">MA, MTs, & MI se-Kalsel</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400">
              <GlobeAltIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg">
              Satuan Kerja
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {isLoading ? '...' : summary?.totalSatuanKerjaKabKota}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Kankemenag Kab/Kota</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UsersIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
              Pengguna Aktif
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {isLoading ? '...' : summary?.totalUsers.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">GTK, Siswa & Pegawai</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ClipboardDocumentListIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg">
              Ajuan Pending
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {isLoading ? '...' : summary?.pendingAssignments}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Menunggu Verifikasi</p>
        </motion.div>
      </div>

      {/* Jenjang Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
              Jenjang MA
            </span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">
              {isLoading ? '...' : summary?.totalMA} Madrasah
            </h3>
            <p className="text-xs text-slate-400 mt-1">Madrasah Aliyah Negeri & Swasta</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600">
            🎓
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded">
              Jenjang MTs
            </span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">
              {isLoading ? '...' : summary?.totalMTs} Madrasah
            </h3>
            <p className="text-xs text-slate-400 mt-1">Madrasah Tsanawiyah Negeri & Swasta</p>
          </div>
          <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600">
            🏫
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded">
              Jenjang MI
            </span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">
              {isLoading ? '...' : summary?.totalMI} Madrasah
            </h3>
            <p className="text-xs text-slate-400 mt-1">Madrasah Ibtidaiyah Negeri & Swasta</p>
          </div>
          <div className="w-14 h-14 bg-cyan-50 dark:bg-cyan-950/40 rounded-2xl flex items-center justify-center text-cyan-600">
            📚
          </div>
        </div>
      </div>

      {/* Quick Navigation & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
            Menu Navigasi Cepat Kanwil
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate(ViewState.MADRASAH_MASTER)}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-slate-800 text-left transition-all group"
            >
              <BuildingLibraryIcon className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="block text-xs font-bold text-slate-800 dark:text-white uppercase">Satuan Kerja</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Kabupaten / Kota</span>
            </button>
            <button
              onClick={() => onNavigate(ViewState.USERS)}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-slate-800 text-left transition-all group"
            >
              <UsersIcon className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="block text-xs font-bold text-slate-800 dark:text-white uppercase">Pengguna</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Manajemen Akun</span>
            </button>
            <button
              onClick={() => onNavigate(ViewState.ACCOUNT_APPROVAL)}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-100 dark:border-slate-800 text-left transition-all group"
            >
              <ClipboardDocumentListIcon className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="block text-xs font-bold text-slate-800 dark:text-white uppercase">Penugasan</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Verifikasi Ajuan</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
              Status Sinkronisasi Offline-First
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Database Operasional</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" /> Dexie (IDB)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Mode Jaringan</span>
                <span className="text-xs font-bold text-teal-600 flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" /> {navigator.onLine ? 'Online (Delta Sync)' : 'Offline (Local-First)'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">
              IMAM System Enterprise v8.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
