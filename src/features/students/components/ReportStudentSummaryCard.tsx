import React from 'react';

interface ReportStudentSummaryCardProps {
  student: any;
}

export const ReportStudentSummaryCard: React.FC<ReportStudentSummaryCardProps> = ({ student }) => {
  return (
    <div className="bg-white dark:bg-[#0B1121] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20 uppercase shrink-0">
          {student.namaLengkap?.substring(0, 2) || 'S'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight truncate">
            {student.namaLengkap}
          </h3>
          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide">
            NIS / NO INDUK:{' '}
            <span className="text-slate-600 dark:text-slate-300 font-bold">
              {student.idUnik || '-'}
            </span>
          </p>
          <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5">
            KELAS: {student.tingkatRombel || student.class || '-'} • {student.jenisKelamin || '-'}
          </p>
        </div>
      </div>
    </div>
  );
};
