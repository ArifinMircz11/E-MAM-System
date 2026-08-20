import React from 'react';
import { FilterListIcon, ChevronDownIcon } from '@/shared/Icons';
import type { ClassData } from '@/types';

interface SmartFilterBarProps {
  selectedClass: ClassData | null;
  onOpenClassSelector: () => void;
}

const SmartFilterBar: React.FC<SmartFilterBarProps> = ({ selectedClass, onOpenClassSelector }) => {
  return (
    <div className="px-6 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FilterListIcon className="w-5 h-5 text-slate-400" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filter:</span>
      </div>

      <button
        onClick={onOpenClassSelector}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 transition-colors"
      >
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {selectedClass ? selectedClass.name : 'Semua Kelas'}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
};

export default SmartFilterBar;
