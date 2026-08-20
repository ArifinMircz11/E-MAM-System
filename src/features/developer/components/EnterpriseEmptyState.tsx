import React from 'react';
import { FolderSearch, Plus } from 'lucide-react';

interface EnterpriseEmptyStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export const EnterpriseEmptyState: React.FC<EnterpriseEmptyStateProps> = ({
  title = 'Tidak ada data ditemukan',
  description = 'Belum ada record data yang tersedia pada modul ini atau filter pencarian tidak sesuai.',
  onAction,
  actionLabel = 'Tambah Data Baru',
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#0B1121] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm my-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/50">
        {icon || <FolderSearch className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
