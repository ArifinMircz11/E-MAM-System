import React from 'react';
import type { LetterRequest } from '@/types';
import { motion } from 'framer-motion';
import { FileStack, ChevronRight } from 'lucide-react';

interface LettersCardProps {
  letters: LetterRequest[];
  onClickAll?: () => void;
}

export const LettersCard: React.FC<LettersCardProps> = ({ letters, onClickAll }) => {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'selesai':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10';
      case 'ditolak':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/10';
      default:
        return 'text-amber-500 bg-amber-500/10 border-amber-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-[340px] shrink-0 snap-start h-[215px] bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 border border-slate-100 dark:border-white/5 shadow-md flex flex-col justify-between"
    >
      <div className="flex items-center justify-between shrink-0 mb-1">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <FileStack className="w-3.5 h-3.5" />
          Surat Saya
        </h3>
        <button
          onClick={onClickAll}
          className="text-[9px] font-bold text-indigo-500 flex items-center gap-0.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition-colors"
        >
          SEMUA <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-hide py-2 space-y-3">
        {letters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-6">
            <p className="text-[9px] font-bold text-slate-400">Belum ada pengajuan surat</p>
          </div>
        ) : (
          letters.slice(0, 3).map((letter, idx) => (
            <div
              key={letter.id || idx}
              className="flex items-center justify-between group cursor-pointer py-0.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors shrink-0" />
                <div className="truncate">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                    {letter.type}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{letter.date}</p>
                </div>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border uppercase  shrink-0 ${getStatusStyle(letter.status)}`}
              >
                {letter.status}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[7.5px] font-bold text-slate-400/95 dark:text-slate-500 uppercase tracking-wide shrink-0 mt-1 flex justify-between">
        <span>Pengajuan Terintegrasi</span>
        <span>Arsip Pelayanan ✓</span>
      </div>
    </motion.div>
  );
};
