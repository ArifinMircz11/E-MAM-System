import React from 'react';
import { ArrowRightIcon } from '@/shared/Icons';

export const ClassAttendanceCard = React.memo(({ c, onClick }: { c: any; onClick: () => void }) => {
  const ratio = c.total > 0 ? (c.present / c.total) * 100 : 0;
  const isAlert = ratio < 80;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group shadow-sm hover:shadow-md active:scale-[0.98] relative overflow-hidden h-full flex flex-col justify-between"
      title={`Detail Presensi Kelas ${c.name} - Klik untuk daftar siswa`}
    >
      <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-500/5 rounded-full blur-lg -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors"></div>

      <div className="flex justify-between items-start mb-1 relative z-10">
        <div>
          <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-100 leading-none mb-0.5 truncate max-w-[80px]">
            {c.name}
          </h4>
          <p className="text-[7px] font-bold text-slate-400 tracking-widest leading-none">
            {c.present}/{c.total}
          </p>
        </div>
        {c.isPinging && (
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-white dark:border-slate-900"></span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center relative z-10 pt-1">
        <span
          className={`text-[7px] font-black tracking-tight ${isAlert ? 'text-rose-500' : 'text-indigo-500'}`}
        >
          {Math.round(ratio)}%
        </span>
        <ArrowRightIcon className="w-2.5 h-2.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>
    </div>
  );
});
