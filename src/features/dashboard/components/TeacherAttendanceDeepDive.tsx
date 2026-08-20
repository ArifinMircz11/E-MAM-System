import React from 'react';

const TeacherAttendanceHeatmap = ({ data }: { data: any[] }) => {
  return (
    <div className="flex flex-col gap-2">
      <h5 className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">
        Riwayat 30 hari
      </h5>
      <div className="grid grid-flow-col grid-rows-5 gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {data.map((d, i) => {
          const getColor = () => {
            if (d.status === 'VALID') return 'bg-emerald-500';
            if (d.status === 'INVALID') return 'bg-rose-500';
            return 'bg-slate-100 dark:bg-slate-800';
          };
          return (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-sm transition-colors cursor-help ${getColor()}`}
              title={`${d.date}: ${d.status || 'Tidak ada data'}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const TeacherAttendanceDeepDive = ({
  teacher,
  logs,
  heatmap,
}: {
  teacher: any;
  logs: any[];
  heatmap: any[];
}) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Identity */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
          {(teacher?.teacherName || 'G')[0]}
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1.5">
            {teacher?.teacherName || 'Guru'}
          </h4>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[9px] font-bold rounded-md tracking-wide">
              ID Guru: {teacher?.teacherId || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <TeacherAttendanceHeatmap data={heatmap} />

      {/* Log Logistik */}
      <div className="flex flex-col gap-3">
        <h5 className="text-[10px] font-bold text-slate-400 tracking-wide px-1">
          Log absensi (Terbaru)
        </h5>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
          {logs.map((log: any, i: number) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${log.status === 'VALID' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                ></div>
                <div>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">
                    {log.date}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">
                    {log.time} — {log.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
