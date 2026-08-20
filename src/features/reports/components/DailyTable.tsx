import React from 'react';
import {
  ArrowRightIcon,
} from '@/shared/Icons';
import type { Student } from '@/types';

interface DailyTableProps {
  paginatedData: Student[];
  attendanceRecords: any[];
  onDetailClick: (student: any) => void;
}

export const DailyTable: React.FC<DailyTableProps> = ({
  paginatedData,
  attendanceRecords,
  onDetailClick,
}) => {
  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hadir':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-100';
      case 'terlambat':
        return 'bg-amber-500/10 text-amber-600 border-amber-100';
      case 'sakit':
        return 'bg-blue-500/10 text-blue-600 border-blue-100';
      case 'izin':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-100';
      case 'alpha':
        return 'bg-rose-500/10 text-rose-600 border-rose-100';
      case 'haid':
        return 'bg-pink-500/10 text-pink-600 border-pink-100';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <th className="px-6 py-3 text-left font-bold">Siswa</th>
            <th className="px-6 py-3 text-center font-bold">Masuk</th>
            <th className="px-6 py-3 text-center font-bold">Duha</th>
            <th className="px-6 py-3 text-center font-bold">Zuhur</th>
            <th className="px-6 py-3 text-center font-bold">Ashar</th>
            <th className="px-6 py-3 text-center font-bold">Pulang</th>
            <th className="px-6 py-3 text-right font-bold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((student) => {
            const record = attendanceRecords.find(
              (r) => r.studentsId === (student.idUnik || student.id),
            );
            const status = record?.statusGlobal || 'Tanpa Keterangan';
            const sessions = record?.sessions || {};

            return (
              <tr
                key={student.id}
                className="bg-white dark:bg-[#0B1121] group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
              >
                <td className="px-6 py-4 rounded-l-[1.5rem] border-y border-l border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500">
                        {student.namaLengkap?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {student.namaLengkap}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${getStatusStyles(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {['masuk', 'duha', 'zuhur', 'ashar', 'pulang'].map((s) => (
                  <td
                    key={s}
                    className="px-4 py-4 text-center border-y border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {sessions[s]?.time || '--:--'}
                    </span>
                  </td>
                ))}

                <td className="px-6 py-4 rounded-r-[1.5rem] border-y border-r border-slate-100 dark:border-slate-800 text-right">
                  <button
                    onClick={() => onDetailClick(student)}
                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 rounded-xl transition-all"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
