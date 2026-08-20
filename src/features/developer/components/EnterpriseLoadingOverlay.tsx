import React from 'react';
import { Loader2 } from 'lucide-react';

interface EnterpriseLoadingOverlayProps {
  message?: string;
}

export const EnterpriseLoadingOverlay: React.FC<EnterpriseLoadingOverlayProps> = ({
  message = 'Memuat data sistem...',
}) => {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 transition-all">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
        <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {message}
      </p>
      <p className="text-xs text-slate-400 mt-1">IMAM System Enterprise Core</p>
    </div>
  );
};
