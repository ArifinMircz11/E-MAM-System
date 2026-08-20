import React from 'react';
import { TrophyIcon, ShieldExclamationIcon, AlertCircleIcon } from '@/shared/Icons';

interface PointSummaryCardProps {
  totalPelanggaran: number;
  totalPrestasi: number;
  totalSiswaBermasalah: number;
}

export const PointSummaryCard: React.FC<PointSummaryCardProps> = ({
  totalPelanggaran,
  totalPrestasi,
  totalSiswaBermasalah,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Total Pelanggaran
          </p>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {totalPelanggaran} <span className="text-sm font-normal text-slate-400">Kasus</span>
          </h3>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
          <ShieldExclamationIcon className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Total Prestasi
          </p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalPrestasi} <span className="text-sm font-normal text-slate-400">Pencapaian</span>
          </h3>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl">
          <TrophyIcon className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Siswa Perlu Penanganan
          </p>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalSiswaBermasalah} <span className="text-sm font-normal text-slate-400">Orang</span>
          </h3>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl">
          <AlertCircleIcon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
