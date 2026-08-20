import React from 'react';

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  theme?: {
    bgLight: string;
    text: string;
  };
}

export const InfoItem = ({ icon: Icon, label, value, theme }: InfoItemProps) => {
  const t = theme || { bgLight: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600' };
  return (
    <div className="flex items-center gap-3 py-2.5 px-0 border-b last:border-0 border-slate-100 dark:border-slate-700/50">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.bgLight} ${t.text} shrink-0`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5 uppercase">
          {label}
        </p>
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
          {value || '-'}
        </div>
      </div>
    </div>
  );
};
