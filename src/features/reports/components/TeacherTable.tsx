import React from 'react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';

interface TeacherTableProps {
  paginatedData: any[];
}

export const TeacherTable: React.FC<TeacherTableProps> = ({ paginatedData }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <th className="px-6 py-3 text-left font-bold">Nama Guru</th>
            <th className="px-6 py-3 text-center font-bold">Jam Scan</th>
            <th className="px-6 py-3 text-center font-bold">Jarak</th>
            <th className="px-6 py-3 text-right font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((teacher: any) => {
            const timeStr = teacher.timestamp
              ? format(new Date(teacher.timestamp), 'HH:mm:ss', { locale: localeID })
              : '--:--:--';
            return (
              <tr
                key={teacher.id}
                className="bg-white dark:bg-[#0B1121] group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
              >
                <td className="px-6 py-4 rounded-l-[1.5rem] border-y border-l border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500">
                        {teacher.teacherName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {teacher.teacherName || teacher.name}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800 font-mono font-bold text-slate-500">
                  {timeStr}
                </td>

                <td className="px-6 py-4 text-center border-y border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                  {teacher.distance ? `${teacher.distance}m` : '-'}
                </td>

                <td className="px-6 py-4 rounded-r-[1.5rem] border-y border-r border-slate-100 dark:border-slate-800 text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${teacher.status === 'VALID' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
                  >
                    {teacher.status || 'BELUM VALID'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
