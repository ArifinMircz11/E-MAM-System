import React from 'react';

const ConsoleStatTile = ({ label, val, icon: Icon, color, trend }: any) => {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-500',
    indigo: 'text-indigo-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    violet: 'text-violet-500',
  };
  return (
    <div
      className="bg-white dark:bg-slate-900/50 p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all hover:shadow-xl dark:hover:border-slate-700 backdrop-blur-sm h-full"
      title={`Statistik: ${label}`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className={`p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 ${colors[color]}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        {trend && (
          <span
            className={`text-[9px] sm:text-[10px] font-bold ${trend.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}
          >
            {trend.toLowerCase()}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 leading-none tracking-tight">
          {val}
        </h3>
        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400/60 lowercase tracking-wide mt-1">
          {label}
        </p>
      </div>
    </div>
  );
};

export default ConsoleStatTile;
