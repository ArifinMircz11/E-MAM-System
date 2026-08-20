import React from 'react';

export const ActionTile = ({ title, icon: Icon, color, bg, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1.5 p-1 transition-all hover:scale-110 active:scale-95 group relative w-full"
  >
    <div className="relative">
      <Icon
        className={`w-6 h-6 ${color || 'text-slate-700 dark:text-slate-300'} transition-transform group-hover:scale-110`}
      />
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-rose-500 rounded-full text-[7px] font-bold text-white flex items-center justify-center animate-pulse border border-white dark:border-slate-900 shadow-sm">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-tight tracking-tight text-center truncate w-full max-w-[85px] group-hover:text-indigo-500 transition-colors">
      {title}
    </span>
  </button>
);

export default ActionTile;
