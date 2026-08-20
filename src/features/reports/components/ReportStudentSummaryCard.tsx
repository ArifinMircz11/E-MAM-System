import React from 'react';
import { UserIcon, IdentificationIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface ReportStudentSummaryCardProps {
  student: any;
}

export const ReportStudentSummaryCard: React.FC<ReportStudentSummaryCardProps> = ({ student }) => {
  if (!student) return null;

  return (
    <div className="bg-white dark:bg-[#0B1121] p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase truncate">
            {student.namaLengkap}
          </h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
              <IdentificationIcon className="w-3 h-3" />
              {student.idUnik || student.studentsId}
            </span>
            <span className="flex items-center gap-1 text-[8px] font-bold text-indigo-500 uppercase tracking-wide bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">
              <MapPinIcon className="w-3 h-3" />
              {student.tingkatRombel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
