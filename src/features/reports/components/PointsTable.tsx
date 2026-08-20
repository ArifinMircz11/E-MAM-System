import React from 'react';
import { ArrowRightIcon } from '@/shared/Icons';

interface PointsTableProps {
  paginatedData: any[];
  onDetailClick: (student: any) => void;
}

export const PointsTable: React.FC<PointsTableProps> = ({ paginatedData, onDetailClick }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <th className="px-6 py-3 text-left font-bold">Siswa</th>
            <th className="px-6 py-3 text-center font-bold">Total Poin</th>
            <th className="px-6 py-3 text-center font-bold">Histori</th>
            <th className="px-6 py-3 text-right font-bold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((student: any) => {
            const totalPoints = student.pointsResult || 0;
            const historyCount = student.pointsData?.length || 0;

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

                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${totalPoints >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
                  >
                    {totalPoints > 0 ? `+${totalPoints}` : totalPoints}
                  </span>
                </td>

                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500">
                  {historyCount} Catatan
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
