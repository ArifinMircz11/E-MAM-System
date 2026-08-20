import React from 'react';
import type { LetterRequest } from '@/types';
import LetterStatusBadge from './LetterStatusBadge';
import { FileText, UserIcon, ArrowRightIcon } from '@/shared/Icons';

interface LetterCardProps {
  letter: LetterRequest;
  canViewAll: boolean;
  onView: (letter: LetterRequest) => void;
}

export const LetterCard: React.FC<LetterCardProps> = ({ letter, canViewAll, onView }) => {
  return (
    <div
      onClick={() => onView(letter)}
      className={`bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden ${
        !letter.is_read
          ? 'border-indigo-100 dark:border-indigo-900/60 shadow-md ring-2 ring-indigo-500/10'
          : 'border-slate-100 dark:border-slate-700/60 shadow-sm'
      }`}
    >
      {/* Blue ribbon or indicator for unread letters */}
      {!letter.is_read && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              letter.type.includes('Keterangan')
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : letter.type.includes('Izin')
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                  : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">{letter.type}</h3>
              <span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded">
                {letter.category}
              </span>
              {/* Unread dot */}
              {!letter.is_read && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {letter.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <LetterStatusBadge status={letter.status} />

          {!letter.is_read && (
            <span className="text-[8px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md">
              Baru
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          {canViewAll && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
              <UserIcon className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {letter.userName}
              </span>
              <span className="text-[9px] text-slate-400">({letter.userRole})</span>
            </div>
          )}
          <span className="text-[10px] text-slate-400">
            {new Date(letter.date || '').toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>
    </div>
  );
};

export default LetterCard;
