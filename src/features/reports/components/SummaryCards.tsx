import React from 'react';



interface SummaryCardsProps {
  attendanceRecords: any[];
  totalStudents: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ attendanceRecords, totalStudents }) => {
  const stats = React.useMemo(() => {
    let h = 0,
      t = 0,
      ts = 0,
      i = 0,
      s = 0,
      hp = 0,
      pc = 0,
      a = 0;

    attendanceRecords.forEach((r) => {
      const status = r.status || 'Alpha';
      // Mapping based on user request H, T, TS, I, S, H+, PC, A
      if (status === 'Hadir') h++;
      else if (status === 'Terlambat') t++;
      else if (status === 'Tugas')
        ts++; // Assuming TS = Tugas
      else if (status === 'Izin') i++;
      else if (status === 'Sakit') s++;
      else if (status === 'Haid')
        hp++; // Assuming H+ = Haid
      else if (status === 'PC') pc++;
      else a++;
    });

    if (attendanceRecords.length < totalStudents) {
      a += totalStudents - attendanceRecords.length;
    }

    return { h, t, ts, i, s, hp, pc, a };
  }, [attendanceRecords, totalStudents]);

  return (
    <div className="bg-white dark:bg-[#0B1121] p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mx-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-400">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      <div className="grid grid-cols-8 gap-0.5 text-center">
        <StatItem label="H" value={stats.h} color="text-emerald-600 dark:text-emerald-400" />
        <StatItem label="T" value={stats.t} color="text-amber-600 dark:text-amber-400" />
        <StatItem label="TS" value={stats.ts} color="text-purple-600 dark:text-purple-400" />
        <StatItem label="I" value={stats.i} color="text-blue-600 dark:text-blue-400" />
        <StatItem label="S" value={stats.s} color="text-amber-500 dark:text-amber-300" />
        <StatItem label="H+" value={stats.hp} color="text-pink-600 dark:text-pink-400" />
        <StatItem label="PC" value={stats.pc} color="text-indigo-600 dark:text-indigo-400" />
        <StatItem label="A" value={stats.a} color="text-rose-600 dark:text-rose-400" />
      </div>
    </div>
  );
};

const StatItem = ({ label, value, color }: any) => (
  <div className="flex flex-col items-center">
    <span className={`text-base font-bold leading-none ${color}`}>{value}</span>
    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none mt-0.5">
      {label}
    </span>
  </div>
);
