import React from 'react';
import { Search } from '@/shared/Icons';

interface AttendanceStaffFiltersProps {
  viewType: 'daily' | 'monthly';
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  classes: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const AttendanceStaffFilters: React.FC<AttendanceStaffFiltersProps> = ({
  viewType,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  selectedClass,
  setSelectedClass,
  classes,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-1">
      <div className="flex items-center gap-1 flex-1">
        <div className="relative flex-1 max-w-[140px]">
          {viewType === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2 px-2 text-[10px] font-semibold uppercase"
            />
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2 px-2 text-[10px] font-semibold uppercase"
            />
          )}
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2 px-2 text-[10px] font-semibold w-24"
        >
          <option value="All">Rombel</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2 pl-8 pr-2 text-[10px] font-bold"
          />
        </div>
      </div>
    </div>
  );
};
