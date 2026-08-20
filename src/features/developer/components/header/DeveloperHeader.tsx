import React from 'react';
import { CommandLineIcon, XMarkIcon } from '@/shared/Icons';

interface DeveloperHeaderProps {
  onClose?: () => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export const DeveloperHeader: React.FC<DeveloperHeaderProps> = ({
  onClose,
  onBack,
  title = 'Developer Console',
  subtitle = 'Pusat Kontrol & Manajemen Sistem e-MAM',
}) => {
  const handleClose = onClose || onBack || (() => {});

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
          <CommandLineIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              v2.0
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>

      <button
        onClick={handleClose}
        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        title="Tutup Console"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
