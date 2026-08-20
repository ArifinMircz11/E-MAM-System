import React from 'react';
import type { LetterRequest } from '@/types';
import LetterCard from './LetterCard';
import { ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@/shared/Icons';

interface LetterDateGroupProps {
  dateKey: string;
  groupLetters: LetterRequest[];
  isExpanded: boolean;
  canViewAll: boolean;
  onToggle: (dateKey: string) => void;
  onViewLetter: (letter: LetterRequest) => void;
}

export const LetterDateGroup: React.FC<LetterDateGroupProps> = ({
  dateKey,
  groupLetters,
  isExpanded,
  canViewAll,
  onToggle,
  onViewLetter,
}) => {
  const unreadCount = groupLetters.filter(
    (l) => (l.status === 'Pending' || l.status === 'Proses') && !l.is_read,
  ).length;

  const formatGroupDate = (dateStr: string) => {
    if (dateStr === 'Tanggal Tidak Diketahui') return dateStr;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
      {/* Accordion Header */}
      <div
        onClick={() => onToggle(dateKey)}
        className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl">
            <ClockIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              {formatGroupDate(dateKey)}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {groupLetters.length} Surat dimasukkan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && unreadCount > 0 && (
            <span className="bg-red-500 text-white rounded-full text-[10px] font-bold px-2.5 py-0.5 animate-pulse uppercase tracking-wider">
              {unreadCount} Baru
            </span>
          )}

          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="p-4 bg-transparent border-t border-slate-50 dark:border-slate-800 space-y-3">
          {groupLetters.map((letter, idx) => (
            <LetterCard
              key={`${letter.id}-${idx}`}
              letter={letter}
              canViewAll={canViewAll}
              onView={onViewLetter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LetterDateGroup;
