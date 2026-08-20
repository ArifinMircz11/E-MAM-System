import React from 'react';
import { motion } from 'framer-motion';

export const DashboardCard = ({
  title,
  content,
  sub,
  icon: Icon,
  color,
  className,
  onClick,
  progressValue,
  progressTotal,
  isLive,
}: any) => {
  const styles: Record<string, any> = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-900/20',
      text: 'text-emerald-500',
      glow: 'bg-emerald-500/5',
      bar: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
      pulse: 'bg-emerald-500',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      hover: 'hover:border-emerald-200 dark:hover:border-emerald-800',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-100 dark:border-indigo-900/20',
      text: 'text-indigo-500',
      glow: 'bg-indigo-500/5',
      bar: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]',
      pulse: 'bg-indigo-500',
      badgeText: 'text-indigo-600 dark:text-indigo-400',
      hover: 'hover:border-indigo-200 dark:hover:border-indigo-800',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-100 dark:border-rose-900/20',
      text: 'text-rose-500',
      glow: 'bg-rose-500/5',
      bar: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
      pulse: 'bg-rose-500',
      badgeText: 'text-rose-600 dark:text-rose-400',
      hover: 'hover:border-rose-200 dark:hover:border-rose-800',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-900/20',
      text: 'text-amber-500',
      glow: 'bg-amber-500/5',
      bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      pulse: 'bg-amber-500',
      badgeText: 'text-amber-600 dark:text-amber-400',
      hover: 'hover:border-amber-200 dark:hover:border-amber-800',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-100 dark:border-purple-900/20',
      text: 'text-purple-500',
      glow: 'bg-purple-500/5',
      bar: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
      pulse: 'bg-purple-500',
      badgeText: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:border-purple-200 dark:hover:border-purple-800',
    },
  };
  const theme = styles[color] || styles.indigo;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all active:scale-95 rounded-[1.5rem] ${theme.hover} ${className || ''}`}
      title={title}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 ${theme.glow}`}
      ></div>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-xl ${theme.bg}`}>
          <Icon className={`w-5 h-5 ${theme.text}`} />
        </div>
        {isLive && (
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${theme.bg} ${theme.border}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.pulse}`}></div>
            <span className={`text-[7px] font-bold tracking-wide ${theme.badgeText}`}>live</span>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-end gap-1 mb-0.5 relative z-10">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none ">
            {content}
          </span>
          {progressTotal !== undefined && (
            <span className="text-[10px] font-bold text-slate-400 mb-0.5">/ {progressTotal}</span>
          )}
        </div>
        <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 lowercase tracking-wide relative z-10">
          {title}
        </h3>
        <p className="text-[8px] font-medium text-slate-500 mt-0.5 relative z-10">{sub}</p>
      </div>
      {progressTotal !== undefined && (
        <div className="mt-3 w-full h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden relative z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(progressValue / (progressTotal || 1)) * 100}%` }}
            className={`h-full ${theme.bar}`}
          />
        </div>
      )}
    </div>
  );
};
