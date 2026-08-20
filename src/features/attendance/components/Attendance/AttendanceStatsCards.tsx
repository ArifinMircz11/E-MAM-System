import React from 'react';

interface AttendanceStatsCardsProps {
  stats: {
    hadir: number;
    izin?: number;
    sakit?: number;
    alpa: number;
    total: number;
  };
}

export const AttendanceStatsCards: React.FC<AttendanceStatsCardsProps> = ({ stats }) => {
  const percentage = stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-emerald-500 p-5 rounded-[2rem] shadow-lg shadow-emerald-500/20 text-white">
        <span className="block text-[8px] font-bold uppercase tracking-wide opacity-80 mb-1">
          TOTAL HADIR
        </span>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold leading-none">{stats.hadir}</span>
          <span className="text-[10px] font-bold uppercase tracking-tight mb-1 opacity-90">
            Hari
          </span>
        </div>
      </div>
      <div className="bg-indigo-500 p-5 rounded-[2rem] shadow-lg shadow-indigo-500/20 text-white">
        <span className="block text-[8px] font-bold uppercase tracking-wide opacity-80 mb-1">
          IZIN / SAKIT
        </span>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold leading-none">
            {(stats.izin || 0) + (stats.sakit || 0)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-tight mb-1 opacity-90">
            Hari
          </span>
        </div>
      </div>
      <div className="bg-rose-500 p-5 rounded-[2rem] shadow-lg shadow-rose-500/20 text-white">
        <span className="block text-[8px] font-bold uppercase tracking-wide opacity-80 mb-1">
          TANPA KETERANGAN
        </span>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold leading-none">{stats.alpa}</span>
          <span className="text-[10px] font-bold uppercase tracking-tight mb-1 opacity-90">
            Hari
          </span>
        </div>
      </div>
      <div className="bg-white dark:bg-[#0B1121] p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">
          PRESENTASE
        </span>
        <div className="flex items-end gap-1">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {percentage}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mb-1">%</span>
        </div>
      </div>
    </div>
  );
};
