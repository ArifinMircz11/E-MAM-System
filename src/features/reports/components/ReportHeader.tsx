import React from 'react';
import {
  CalendarIcon,
  ChevronDownIcon,
  Search,
  BuildingLibraryIcon,
  XCircleIcon,
} from '@/shared/Icons';
import type { ClassData } from '@/types';

interface ReportHeaderProps {
  reportType: 'daily' | 'monthly' | 'teacher' | 'points';
  setReportType: (val: any) => void;
  selectedClassFilter: string;
  setSelectedClassFilter: (val: string) => void;
  classes: ClassData[];
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  filterNama: string;
  setFilterNama: (val: string) => void;
  isStaff: boolean;
  walasClassLocked: string | null;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  reportType,
  setReportType,
  selectedClassFilter,
  setSelectedClassFilter,
  classes,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  filterNama,
  setFilterNama,
  isStaff,
  walasClassLocked,
}) => {
  return (
    <div className="space-y-6">
      {/* Type Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl w-full max-w-md">
        {(['daily', 'monthly', 'teacher', 'points'] as const).map((type) => {
          if (type === 'teacher' && !isStaff) return null;
          return (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                reportType === type
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {type === 'daily'
                ? 'Harian'
                : type === 'monthly'
                  ? 'Bulanan'
                  : type === 'teacher'
                    ? 'Guru'
                    : 'Poin'}
            </button>
          );
        })}
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Class Filter */}
        {reportType !== 'teacher' && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-cyan-400 flex items-center gap-1.5 ml-1">
              <BuildingLibraryIcon className="w-3 h-3" /> Pilih Kelas
            </label>
            <div className="relative group">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                disabled={!!walasClassLocked}
                className="w-full bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 rounded-2xl px-2 py-2 text-[10px] font-bold outline-none appearance-none disabled:opacity-60 transition-all focus:border-indigo-500"
              >
                {classes.map((cls, idx) => (
                  <option key={idx} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>
        )}

        {/* Date/Month Picker */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-cyan-400 flex items-center gap-1.5 ml-1">
            <CalendarIcon className="w-3 h-3" />{' '}
            {reportType === 'daily' || reportType === 'teacher' ? 'Tanggal' : 'Bulan'}
          </label>
          <div className="relative group">
            <input
              type={reportType === 'daily' || reportType === 'teacher' ? 'date' : 'month'}
              value={
                reportType === 'daily' || reportType === 'teacher' ? selectedDate : selectedMonth
              }
              onChange={(e) =>
                reportType === 'daily' || reportType === 'teacher'
                  ? setSelectedDate(e.target.value)
                  : setSelectedMonth(e.target.value)
              }
              className="w-full bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 rounded-2xl px-2 py-2 text-[10px] font-bold outline-none transition-all focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-cyan-400 flex items-center gap-1.5 ml-1">
            <Search className="w-3 h-3" /> Nama
          </label>
          <div className="relative group">
            <input
              type="text"
              placeholder="Cari..."
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              className="w-full bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 rounded-2xl pl-7 pr-2 py-2 text-[10px] font-bold outline-none transition-all focus:border-indigo-500"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            {filterNama && (
              <button
                onClick={() => setFilterNama('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <XCircleIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
