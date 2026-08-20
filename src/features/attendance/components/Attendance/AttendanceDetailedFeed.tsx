import React, { useState } from 'react';
import { buildMonthlyGridDays, MonthlyGridDay } from '@/utils/attendanceCalculations';

interface AttendanceDetailedFeedProps {
  records: any[];
  selectedMonth?: string;
}

export const AttendanceDetailedFeed: React.FC<AttendanceDetailedFeedProps> = ({
  records,
  selectedMonth,
}) => {
  const [viewFormat, setViewFormat] = useState<'table' | 'cards'>('table');
  const { daysList, daysInMonth, monthName } = buildMonthlyGridDays(selectedMonth, records);

  const renderStatusBadge = (status: string, isWeekend: boolean) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('haid')) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200/50 dark:border-pink-900/50">
          Haid
        </span>
      );
    }
    if (s.includes('terlambat') || s === 't') {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50">
          Terlambat
        </span>
      );
    }
    if (s.includes('sakit') || s === 's') {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/50 dark:border-sky-900/50">
          Sakit
        </span>
      );
    }
    if (s.includes('izin') || s === 'i') {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
          Izin
        </span>
      );
    }
    if (s.includes('hadir') || s === 'h') {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
          Hadir
        </span>
      );
    }
    if (s.includes('libur') || isWeekend) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
          Libur
        </span>
      );
    }
    if (s === '-') {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600">
          -
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50">
        Alpha
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0B1121] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden mb-24">
      {/* Header bar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Tabel Kehadiran Individual (Hari 1 - {daysInMonth})
            </h4>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold font-mono border border-indigo-100 dark:border-indigo-900/50">
              {monthName}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Rekap lengkap 5 sesi harian (Masuk, Duha, Zuhur, Ashar, Pulang) sesuai format Laporan Presensi PDF.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
          <button
            onClick={() => setViewFormat('table')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
              viewFormat === 'table'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Tabel Matrix (1-{daysInMonth})
          </button>
          <button
            onClick={() => setViewFormat('cards')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
              viewFormat === 'cards'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Kartu Sesi
          </button>
        </div>
      </div>

      {/* VIEW FORMAT: TABLE MATRIX (DAYS 1-31) */}
      {viewFormat === 'table' && (
        <div className="overflow-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-12">
                  NO
                </th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  HARI & TANGGAL
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-28">
                  STATUS
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  MASUK
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  DUHA
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  ZUHUR
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  ASHAR
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  PULANG
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-16">
                  POIN
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {daysList.map((dayItem: MonthlyGridDay) => {
                const isSun = dayItem.dayName.toLowerCase() === 'minggu';
                return (
                  <tr
                    key={dayItem.date}
                    className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors ${
                      isSun ? 'bg-slate-50/60 dark:bg-slate-900/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-xs font-bold text-slate-400 text-center font-mono">
                      {dayItem.dayNumber}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      <span className={isSun ? 'text-rose-500 font-extrabold' : ''}>
                        {dayItem.dayName}
                      </span>
                      <span className="text-slate-400 font-normal ml-1 text-[11px] font-mono">
                        ({dayItem.formattedDate})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-center">
                      {renderStatusBadge(dayItem.statusGlobal, dayItem.isWeekend)}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 text-center">
                      <span
                        className={
                          dayItem.sessions.masuk !== '--:--'
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-300 dark:text-slate-700'
                        }
                      >
                        {dayItem.sessions.masuk}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 text-center">
                      <span
                        className={
                          dayItem.sessions.duha !== '--:--'
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-300 dark:text-slate-700'
                        }
                      >
                        {dayItem.sessions.duha}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 text-center">
                      <span
                        className={
                          dayItem.sessions.zuhur !== '--:--'
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-300 dark:text-slate-700'
                        }
                      >
                        {dayItem.sessions.zuhur}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 text-center">
                      <span
                        className={
                          dayItem.sessions.ashar !== '--:--'
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-300 dark:text-slate-700'
                        }
                      >
                        {dayItem.sessions.ashar}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 text-center">
                      <span
                        className={
                          dayItem.sessions.pulang !== '--:--'
                            ? 'text-slate-900 dark:text-white font-bold'
                            : 'text-slate-300 dark:text-slate-700'
                        }
                      >
                        {dayItem.sessions.pulang}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-center font-mono font-bold">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] ${
                          dayItem.totalPoinHariIni > 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}
                      >
                        {dayItem.totalPoinHariIni}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW FORMAT: CARDS FEED */}
      {viewFormat === 'cards' && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[550px] overflow-auto custom-scrollbar">
          {daysList.map((d: MonthlyGridDay) => (
            <div
              key={d.date}
              className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-mono font-bold flex items-center justify-center">
                    {d.dayNumber}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {d.dayName}, {d.formattedDate}
                    </span>
                  </div>
                </div>
                {renderStatusBadge(d.statusGlobal, d.isWeekend)}
              </div>

              <div className="grid grid-cols-5 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[7px] text-slate-400 font-bold uppercase mb-1">
                    Masuk
                  </span>
                  <span className="block text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {d.sessions.masuk}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[7px] text-slate-400 font-bold uppercase mb-1">
                    Duha
                  </span>
                  <span className="block text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {d.sessions.duha}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[7px] text-slate-400 font-bold uppercase mb-1">
                    Zuhur
                  </span>
                  <span className="block text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {d.sessions.zuhur}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[7px] text-slate-400 font-bold uppercase mb-1">
                    Ashar
                  </span>
                  <span className="block text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {d.sessions.ashar}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[7px] text-slate-400 font-bold uppercase mb-1">
                    Pulang
                  </span>
                  <span className="block text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                    {d.sessions.pulang}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
