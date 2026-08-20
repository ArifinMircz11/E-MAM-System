import React from 'react';
import { Plus, Search, Download, Upload, RefreshCw } from 'lucide-react';

interface EnterpriseCrudToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdd: () => void;
  addButtonLabel?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export const EnterpriseCrudToolbar: React.FC<EnterpriseCrudToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onAdd,
  addButtonLabel = 'Tambah Data',
  onRefresh,
  onExport,
  onImport,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari data (nama, email, ID)..."
          className="w-full bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
        />
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Muat Ulang"
            className="p-3 bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-3 bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Ekspor</span>
          </button>
        )}
        {onImport && (
          <button
            onClick={onImport}
            className="px-4 py-3 bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Impor</span>
          </button>
        )}
        <button
          onClick={onAdd}
          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{addButtonLabel}</span>
        </button>
      </div>
    </div>
  );
};
