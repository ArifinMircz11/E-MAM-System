import React from 'react';

const IconPlaceholder = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
    />
  </svg>
);

export const AgendaItem = ({ time, subject, room, status, isBreak }: any) => (
  <div
    className={`p-5 flex items-center gap-5 group transition-all hover:bg-slate-50 dark:hover:bg-slate-800/20 ${isBreak ? 'opacity-40 grayscale' : ''}`}
  >
    <div className="flex flex-col items-center shrink-0 w-12 text-slate-400 dark:text-slate-500">
      <span className="text-[11px] font-bold leading-none">{time}</span>
      <div className="w-4 h-[1px] bg-slate-200 dark:bg-slate-700 my-1.5"></div>
      <span className="text-[7px] font-bold lowercase">wib</span>
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 lowercase truncate tracking-tight">
        {subject}
      </h4>
      <div className="flex items-center gap-2 mt-1 px-1">
        <IconPlaceholder className="w-3 h-3 text-slate-300" />
        <span className="text-[8px] font-bold text-slate-400 lowercase tracking-wide shrink-0">
          {room}
        </span>
      </div>
    </div>
    <div
      className={`px-2.5 py-1 rounded-lg text-[7px] font-bold lowercase tracking-wide border shrink-0 ${isBreak ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-100 dark:border-slate-800' : 'bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-500/80 border-indigo-100/50 dark:border-indigo-900/20'}`}
    >
      {status.toLowerCase()}
    </div>
  </div>
);
