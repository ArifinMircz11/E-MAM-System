/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Digital ID Card Component
 */

import React, { useRef } from 'react';
import Layout from '@/layouts/Layout';
import { getPlaceholderAvatar } from '@/utils/avatarHelper';
import { QRCodeCanvas } from 'qrcode.react';
import {
  IdentificationIcon,
  ShareIcon,
  DownloadIcon,
  ShieldCheckIcon,
  AppLogo,
  CalendarIcon,
} from '@/shared/Icons';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useSystemStore } from '@/stores/systemStore';
import { UserRole } from '@/types';
import { toast } from 'sonner';

interface IDCardProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
}

const IDCard: React.FC<IDCardProps> = ({ onBack, onOpenSidebar }) => {
  const user = useAuthStore((state) => state.user);
  const madrasahInfo = useSystemStore((state) => state.madrasahInfo);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    toast.info('Fitur unduh kartu sedang dalam pengembangan.');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'ID Card Digital e-Mam System',
          text: `Kartu Digital ${user?.displayName} - e-Mam System`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      toast.info('Berbagi tidak didukung pada perangkat ini.');
    }
  };

  if (!user) {
    return (
      <Layout title="ID Card Digital" onBack={onBack} icon={IdentificationIcon}>
        <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center">
          <IdentificationIcon className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Akses Terbatas</h3>
          <p className="text-[10px] text-slate-500 mt-2">
            Silakan login untuk melihat ID Card Anda.
          </p>
        </div>
      </Layout>
    );
  }

  const isSiswa = user.role === UserRole.SISWA || user.role === UserRole.KETUA_KELAS;

  return (
    <Layout
      title="ID Card Digital"
      subtitle="Kartu identitas civitas madrasah"
      onBack={onBack}
      icon={IdentificationIcon}
      actions={
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 active:scale-90 transition-all border border-slate-200 dark:border-slate-700"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-indigo-600 rounded-xl text-white active:scale-90 transition-all shadow-lg shadow-indigo-500/20"
          >
            <DownloadIcon className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="p-6 md:p-10 flex flex-col items-center gap-10 pb-32">
        {/* --- THE CARD --- */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20, rotateY: 15 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="relative w-full max-w-[340px] aspect-[1/1.6] bg-white dark:bg-[#0B1121] rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 group preserve-3d"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute top-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"></div>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:10px_10px]"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center pt-8 px-6 text-center h-full">
            {/* Header Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                <AppLogo className="w-full h-full" />
              </div>
              <div className="text-left">
                <h1 className="text-[9px] font-bold text-white tracking-wide leading-none">
                  E-MAM SYSTEM
                </h1>
                <p className="text-[6px] font-bold text-white/60 tracking-[0.2em] mt-0.5 leading-none uppercase">
                  Enterprise v8.0
                </p>
              </div>
            </div>

            {/* Photo Container */}
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-3xl bg-white p-1.5 shadow-xl border border-slate-100 transform -rotate-1 group-hover:rotate-0 transition-transform">
                <div className="w-full h-full rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 relative">
                  <img
                    src={user.photoURL || getPlaceholderAvatar(user.displayName || 'ID')}
                    className="w-full h-full object-cover animate-fade-in"
                    alt={user.displayName}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              {/* Verification Badge */}
              <div className="absolute -bottom-2 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-xl border-4 border-white dark:border-[#0B1121] flex items-center justify-center shadow-lg transform rotate-6">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="space-y-1 mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                {user.displayName.toLowerCase()}
              </h2>
              <p className="text-[9px] font-bold text-neon-emerald drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] tracking-[0.3em] uppercase">
                {String(user.role || '').replace('_', ' ')}
              </p>
            </div>

            {/* User Details Grid */}
            <div className="w-full grid grid-cols-2 gap-4 text-left p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 mb-8 shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide block">
                  ID Unit
                </span>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {user.uid.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide block">
                  Lembaga
                </span>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {madrasahInfo?.nama || 'Madrasah'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide block">
                  Masa Berlaku
                </span>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 block">
                  30/06/2026
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide block">
                  Status
                </span>
                <span className="text-[9px] font-bold text-emerald-600 block">
                  Verified Digital
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-auto pb-4 flex flex-col items-center">
              <div className="w-16 h-16 p-1 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
                <QRCodeCanvas value={user.uid} size={64} level="H" className="w-full h-full" />
              </div>
              <p className="text-[7px] font-bold text-slate-300 dark:text-slate-600 mt-2 tracking-[0.4em] uppercase">
                Scan to Verify
              </p>
            </div>
          </div>

          {/* Security Hologram Strip Effect */}
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-indigo-500/20 via-pink-500/20 to-indigo-500/20 blur-[1px]"></div>
        </motion.div>

        {/* --- FOOTER INFO --- */}
        <div className="max-w-[340px] w-full p-6 bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 flex gap-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[10px] font-bold text-amber-900 dark:text-amber-100 tracking-tight leading-none mb-1 text-left">
              KEGUNAAN KARTU
            </h4>
            <p className="text-[9px] text-amber-800/60 dark:text-amber-200/60 leading-relaxed text-left">
              ID Card ini adalah tanda pengenal resmi madrasah. Gunakan untuk akses perpustakaan dan
              validasi kehadiran harian via QR.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IDCard;
