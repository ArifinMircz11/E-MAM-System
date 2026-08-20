import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface EnterpriseFilterPanelProps {
  groups: FilterGroup[];
  selectedFilters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

export const EnterpriseFilterPanel: React.FC<EnterpriseFilterPanelProps> = ({
  groups,
  selectedFilters,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-[#0B1121] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Filter Enterprise</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filter</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {groups.map((group) => (
          <div key={group.key} className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
              {group.label}
            </label>
            <select
              value={selectedFilters[group.key] || ''}
              onChange={(e) => onChange(group.key, e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">Semua {group.label}</option>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
