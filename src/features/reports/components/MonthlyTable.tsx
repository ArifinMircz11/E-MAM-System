import React from 'react';
import { ArrowRightIcon } from '@/shared/Icons';

interface MonthlyTableProps {
  paginatedData: any[];
  onDetailClick: (student: any) => void;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({ paginatedData, onDetailClick }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <th className="px-6 py-3 text-left font-bold">Siswa</th>
            <th className="px-6 py-3 text-center font-bold">Hadir</th>
            <th className="px-6 py-3 text-center font-bold">Sakit</th>
            <th className="px-6 py-3 text-center font-bold">Izin</th>
            <th className="px-6 py-3 text-center font-bold">Alpha</th>
            <th className="px-6 py-3 text-right font-bold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((student: any) => {
            const summary = student.summary || { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
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
                      <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        {student.idUnik}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800 font-mono font-bold text-emerald-500">
                  {summary.hadir}
                </td>
                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800 font-mono font-bold text-blue-500">
                  {summary.sakit}
                </td>
                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800 font-mono font-bold text-indigo-500">
                  {summary.izin}
                </td>
                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800 font-mono font-bold text-rose-500">
                  {summary.alpha}
                </td>

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
