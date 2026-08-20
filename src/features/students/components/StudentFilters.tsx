/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import {
  XCircleIcon,
  ChevronDownIcon,
} from '@/shared/Icons';

interface StudentFiltersProps {
  showOnlyInvalid: boolean;
  setShowOnlyInvalid: (val: boolean) => void;
  filterLevel: string;
  setFilterLevel: (val: string) => void;
  filterKelas: string;
  setFilterKelas: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  viewMode: 'card' | 'table';
  setViewMode: (val: 'card' | 'table') => void;
  classList: string[];
  filteredClassOptions: string[];
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  showOnlyInvalid,
  setShowOnlyInvalid,
  filterLevel,
  setFilterLevel,
  filterKelas,
  setFilterKelas,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  classList,
  filteredClassOptions,
}) => {
  return (
    <div className="p-1 px-3 border-b border-slate-200 dark:border-slate-800 flex flex-nowrap items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="flex p-0.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
        <button
          onClick={() => setShowOnlyInvalid(!showOnlyInvalid)}
          className={`px-3 py-1 rounded-md text-[9px] font-bold tracking-wide transition-all flex items-center gap-2 ${
            showOnlyInvalid
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
          }`}
        >
          <XCircleIcon className="w-3 h-3" />
          AUDIT DATA LOKAL
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 self-center" />
        {!showOnlyInvalid &&
          ['10', '11', '12', 'Tanpa Rombel'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setFilterLevel(lvl);
                if (lvl === 'Tanpa Rombel') {
                  setFilterKelas('Tanpa Rombel');
                } else {
                  const matched = classList.find((c) => String(c || '').startsWith(lvl));
                  setFilterKelas(matched || `${lvl} A`);
                }
              }}
              className={`px-3 py-1 rounded-md text-[9px] font-bold tracking-wide transition-all ${
                filterLevel === lvl
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {lvl}
            </button>
          ))}
      </div>

      {!showOnlyInvalid && (
        <>
          <div className="relative shrink-0">
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="pl-2 pr-6 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-bold border border-slate-200 dark:border-slate-800 outline-none appearance-none cursor-pointer text-slate-600 dark:text-slate-300 min-w-[120px]"
            >
              {filterLevel === 'Tanpa Rombel' && (
                <option value="Tanpa Rombel">Tanpa Rombel</option>
              )}
              {filteredClassOptions.map((c, i) => (
                <option key={`${c}-${i}`} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-2 pr-6 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-bold border border-slate-200 dark:border-slate-800 outline-none appearance-none cursor-pointer text-slate-600 dark:text-slate-300 min-w-[120px]"
            >
              <option value="All">Semua status</option>
              <option value="Aktif">1. Aktif</option>
              <option value="Lulus">2. Lulus</option>
              <option value="Mutasi">3. Mutasi</option>
              <option value="Keluar">4. Keluar</option>
              <option value="Nonaktif">5. Nonaktif</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </>
      )}

      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 ml-auto">
        <button
          onClick={() => setViewMode('card')}
          className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-[9px] font-bold tracking-wide ${
            viewMode === 'card'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Tampilan Kartu"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">KARTU</span>
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-[9px] font-bold tracking-wide ${
            viewMode === 'table'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Tampilan Tabel"
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TABEL</span>
        </button>
      </div>
    </div>
  );
};
