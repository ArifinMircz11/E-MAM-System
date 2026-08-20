import React from 'react';
import { Loader2 } from '@/shared/Icons';

export const StudentAttendanceList = ({
  students,
  onSelectStudent,
  loading,
  getStatusStyles,
}: any) => {
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wide px-1">Otorisasi data...</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-2 animate-in slide-in-from-right-4 duration-500 px-2 lg:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {students.map((s: any) => (
          <div
            key={s.idUnik || s.id}
            onClick={() => onSelectStudent(s)}
            className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${['Alpha', 'A'].includes(s.status) ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
              >
                {s.namaLengkap[0]}
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-0.5 truncate">
                  {s.namaLengkap}
                </h4>
                <p className="text-[8px] font-bold text-slate-400 tracking-wide">
                  ID Unik: {s.idUnik}
                </p>
              </div>
            </div>
            <div
              className={`px-2 py-0.5 rounded-lg text-[8px] font-bold tracking-wide border shrink-0 ${getStatusStyles(s.status)}`}
            >
              {s.status === 'Alpha' ? 'A' : s.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
