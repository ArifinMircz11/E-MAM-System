import React from 'react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id';
import { getHolidayInfo } from '@/utils/holidayHelper';

interface AttendanceCalendarMapProps {
  selectedMonth: string;
  attendanceRecords: any[];
}

export const AttendanceCalendarMap: React.FC<AttendanceCalendarMapProps> = ({
  selectedMonth,
  attendanceRecords,
}) => {
  const year = new Date(selectedMonth + '-01').getFullYear();
  const month = new Date(selectedMonth + '-01').getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="bg-white dark:bg-[#0B1121] p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative group">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          PETA MONITORING BULANAN (
          {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: localeID })})
        </h4>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Hadir" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Terlambat" />
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Ibadah Khusus" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 justify-center">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
          <div
            key={i}
            className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase text-center py-2 tracking-wide"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl"
          ></div>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayStr = String(i + 1).padStart(2, '0');
          const dateStr = `${selectedMonth}-${dayStr}`;
          const record = attendanceRecords.find((r) => r.date === dateStr);
          const holiday = getHolidayInfo(dateStr);

          let boxStyle =
            'bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-800 font-medium';
          let titleText = `Tanggal ${i + 1}: Belum Ada Data`;

          if (record) {
            const s = record.statusGlobal?.toLowerCase() || '';
            const isH =
              s === 'haid' ||
              (record.sessions?.masuk?.time &&
                String(record.sessions.masuk.time).toLowerCase().includes('haid'));
            const isT =
              s === 'terlambat' ||
              (record.sessions?.masuk?.time && String(record.sessions.masuk.time).includes('[T]'));
            const isPC =
              record.sessions?.pulang?.time && String(record.sessions.pulang.time).includes('[PC]');

            if (isH) {
              boxStyle =
                'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
              titleText = `Tanggal ${i + 1}: Ibadah Khusus (Haid)`;
            } else if (isT) {
              boxStyle =
                'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
              titleText = `Tanggal ${i + 1}: Terlambat Masuk`;
            } else if (isPC) {
              boxStyle =
                'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30';
              titleText = `Tanggal ${i + 1}: Pulang Cepat (PC)`;
            } else if (['hadir', 'h', 'valid'].includes(s)) {
              boxStyle =
                'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
              titleText = `Tanggal ${i + 1}: Hadir`;
            } else if (['sakit', 's'].includes(s)) {
              boxStyle =
                'bg-amber-50/55 dark:bg-amber-900/20 text-amber-500 border border-amber-100/30';
              titleText = `Tanggal ${i + 1}: Sakit`;
            } else if (['izin', 'i'].includes(s)) {
              boxStyle =
                'bg-blue-50/55 dark:bg-blue-900/20 text-blue-500 border border-blue-100/30';
              titleText = `Tanggal ${i + 1}: Izin`;
            } else {
              boxStyle =
                'bg-rose-50/55 dark:bg-rose-900/20 text-rose-500 border border-rose-100/30';
              titleText = `Tanggal ${i + 1}: Alpha`;
            }
          } else if (holiday.isHoliday) {
            if (holiday.type === 'weekend') {
              boxStyle =
                'bg-slate-50 dark:bg-slate-900/30 text-slate-200 dark:text-slate-700 opacity-60';
            } else {
              boxStyle =
                'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-500/10';
            }
            titleText = `Hari Libur: ${holiday.name}`;
          }

          return (
            <div
              key={i}
              className={`aspect-square rounded-2xl flex items-center justify-center text-[10px] font-bold transition-all hover:scale-115 cursor-help ${boxStyle}`}
              title={titleText}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};
