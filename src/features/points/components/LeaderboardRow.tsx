import React from 'react';

interface LeaderboardRowProps {
  s: any;
  idx: number;
  getLevelDisplay: (sanctionLevel: any) => { label: string; color: string; text: string };
}

export const LeaderboardRow = React.memo<LeaderboardRowProps>(({ s, idx, getLevelDisplay }) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
          idx === 0
            ? 'bg-amber-100 text-amber-600'
            : idx === 1
              ? 'bg-slate-100 text-slate-600'
              : idx === 2
                ? 'bg-orange-100 text-orange-600'
                : 'bg-slate-50 text-slate-400'
        }`}
      >
        {idx + 1}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[150px]">
          {s.studentName || s.studentsId}
        </h4>
        <p className="text-[10px] font-bold text-slate-400">
          {getLevelDisplay(s.sanctionLevel).label}
        </p>
      </div>
      <div
        className={`text-sm font-bold ${s.totalPoints > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
      >
        {s.totalPoints > 0 ? '+' : ''}
        {s.totalPoints}
      </div>
    </div>
  );
});

LeaderboardRow.displayName = 'LeaderboardRow';
