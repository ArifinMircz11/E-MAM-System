import React from 'react';
import { motion } from 'framer-motion';
import { AppLogo, ShieldCheckIcon } from '@/shared/Icons';

interface MaintenanceOverlayProps {
  onBypass?: () => void;
  isDeveloper?: boolean;
  title?: string;
  message?: string;
  isDisconnected?: boolean;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  onBypass,
  isDeveloper,
  title = 'Sistem Sedang',
  message = 'Kami sedang memperbarui sistem untuk meningkatkan kualitas layanan. Harap kembali beberapa saat lagi.',
  isDisconnected = false,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 p-6 overflow-hidden">
      <div className="text-emerald-500 mb-6 flex justify-center">
        <AppLogo className="w-24 h-24" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center"
      >
        <div className="inline-flex items-center justify-center px-4 py-2 border border-emerald-500/30 rounded-full bg-emerald-500/10 mb-6">
          <ShieldCheckIcon className="w-5 h-5 text-emerald-400 mr-2" />
          <span className="text-emerald-400 font-medium tracking-wide">SYSTEM UPDATE</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">{title}</h1>
        <p className="text-slate-400 text-lg leading-relaxed mb-8">{message}</p>

        {onBypass && (
          <button
            onClick={onBypass}
            className="text-sm font-medium text-slate-500 hover:text-emerald-400 transition-colors"
          >
            Developer Access Login
          </button>
        )}
      </motion.div>
    </div>
  );
};
