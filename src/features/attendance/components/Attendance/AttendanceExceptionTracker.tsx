import React from 'react';
import { XCircleIcon, ClockIcon, ArrowRightIcon, HeartIcon } from '@/shared/Icons';
import type { AttendanceRecord } from '@/types';

interface AttendanceExceptionTrackerProps {
  records: AttendanceRecord[];
}

export const AttendanceExceptionTracker: React.FC<AttendanceExceptionTrackerProps> = ({
  records,
}) => {
  const safeRecords = Array.isArray(records) ? records.filter(Boolean) : [];
  const tidakScanCount = safeRecords.filter((r) => r.pelanggaran?.tidakScan).length;
  const terlambatCount = safeRecords.filter((r) => r.pelanggaran?.terlambat).length;
  const pulangCepatCount = safeRecords.filter((r) => r.pelanggaran?.pulangCepat).length;
  const haidCount = safeRecords.filter((r) => r.isHaid).length;

  return (
    <div className="bg-white dark:bg-[#0B1121] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Exception Tracker (Bulan Ini)
        </div>
        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wide">
          PERSONAL AUDIT
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <XCircleIcon className="w-5 h-5 text-slate-400" />
          <span className="text-lg font-bold text-slate-800 dark:text-white leading-none">
            {tidakScanCount}
          </span>
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
            TIDAK SCAN
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <ClockIcon className="w-5 h-5 text-amber-500" />
          <span className="text-lg font-bold text-amber-600 leading-none">{terlambatCount}</span>
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
            TERLAMBAT
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <ArrowRightIcon className="w-5 h-5 text-indigo-500 rotate-180" />
          <span className="text-lg font-bold text-indigo-600 leading-none">
            {pulangCepatCount}
          </span>
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
            PULANG CEPAT
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#1E1111]/30 border border-slate-100 dark:border-slate-800">
          <HeartIcon className="w-5 h-5 text-rose-500" />
          <span className="text-lg font-bold text-rose-500 leading-none">{haidCount}</span>
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
            IBADAH KHUSUS
          </span>
        </div>
      </div>
    </div>
  );
};
