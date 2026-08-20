import React from 'react';
import { HomeIcon, LockIcon } from '@/shared/Icons';

interface AccessDeniedProps {
  onBack?: () => void;
  message?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  onBack,
  message = 'Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.',
}) => {
  const handleGoBack =
    onBack ||
    (() => {
      window.location.reload();
    });

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 transition-colors items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50 dark:ring-red-900/10">
        <LockIcon className="w-10 h-10 text-red-500" />
      </div>

      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Akses Ditolak</h1>

      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed mb-8">
        {message}
      </p>

      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 cursor-pointer"
      >
        <HomeIcon className="w-4 h-4" />
        Kembali ke Dashboard
      </button>
    </div>
  );
};

export default AccessDenied;
