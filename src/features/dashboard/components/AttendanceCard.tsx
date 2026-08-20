import React, { Suspense, lazy } from 'react';

const AttendanceChart = lazy(() =>
  import('./AttendanceChart').then((module) => ({ default: module.AttendanceChart })),
);

const AttendanceCard = ({
  present,
  total,
  late,
  alpha,
  haid,
  izin,
  onClick,
  title = 'Kehadiran siswa hari ini',
  subtitle,
}: any) => {
  const percentage = total > 0 ? (present / total) * 100 : 0;
  const data = [
    { name: 'Hadir', value: present, color: '#10b981' },
    { name: 'Sisa', value: Math.max(0, total - present), color: 'rgba(255,255,255,0.05)' },
  ];

  return (
    <div
      onClick={onClick}
      className="w-[340px] h-[215px] shrink-0 snap-start bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:border-indigo-200 transition-all active:scale-[0.98] rounded-[24px]"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-slate-800 tracking-wider">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 border border-slate-200 backdrop-blur-sm">
            <div className="w-1 h-1 rounded-full animate-pulse bg-emerald-500"></div>
            <span className="text-[7px] font-black tracking-widest text-slate-600 leading-none">
              Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-1 mb-2">
          {/* Ring Chart */}
          <Suspense
            fallback={
              <div className="w-24 h-[96px] min-h-[96px] shrink-0 animate-pulse bg-slate-200 rounded-full" />
            }
          >
            <AttendanceChart data={data} percentage={percentage} />
          </Suspense>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-grow">
            <div className="flex flex-col">
              <span className="text-[7px] font-black tracking-widest text-emerald-600/60">
                Hadir
              </span>
              <span className="text-xl font-black text-slate-800 leading-tight">{present}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black tracking-widest text-amber-600/60">
                Terlambat
              </span>
              <span className="text-xl font-black text-slate-800 leading-tight">{late}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black tracking-widest text-rose-600/60">Absen</span>
              <span className="text-xl font-black text-slate-800 leading-tight">{alpha}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black tracking-widest text-slate-500">Total</span>
              <span className="text-xl font-black text-slate-800 leading-tight">{total}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-sm font-mono tracking-[0.2em] text-slate-400 leading-none">
            •••• •••• •••• {present}
          </span>
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"></div>
            <div className="w-5 h-5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCard;
