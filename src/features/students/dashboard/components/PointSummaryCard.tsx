import React from 'react';
import type { StudentPointSummary } from '../types';
import { motion } from 'framer-motion';
import { Trophy, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';

interface PointSummaryCardProps {
  summary: StudentPointSummary | null;
  onClickHistory?: () => void;
}

export const PointSummaryCard: React.FC<PointSummaryCardProps> = ({ summary, onClickHistory }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] p-5 border border-indigo-500/10 rounded-[2.5rem] relative overflow-hidden group shadow-xl flex flex-col justify-between"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center justify-between shrink-0 mb-1">
        <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Kredit Kedisiplinan
        </h3>
        <button
          onClick={onClickHistory}
          className="text-[9px] font-bold text-indigo-400 flex items-center gap-0.5 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
        >
          RIWAYAT <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-end justify-between py-2">
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">
            Total Skor
          </p>
          <p className="text-4xl font-bold text-white  leading-none">
            {summary?.totalPoints || 0}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-right">
            <p className="text-[8.5px] font-bold text-emerald-400 uppercase flex items-center justify-end gap-1">
              <Trophy className="w-2.5 h-2.5" /> PRESTASI
            </p>
            <p className="text-base font-bold text-white leading-none mt-1">
              {summary?.totalAchievement || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8.5px] font-bold text-rose-400 uppercase flex items-center justify-end gap-1">
              <AlertCircle className="w-2.5 h-2.5" /> SANKSI
            </p>
            <p className="text-base font-bold text-white leading-none mt-1">
              {summary?.totalViolation || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 shrink-0">
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, summary?.totalPoints || 0)}%` }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </div>
        <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-400 tracking-wider uppercase leading-none">
          <span>Kepatuhan Madrasah</span>
          <span className="text-indigo-400">Target Harian ✓</span>
        </div>
      </div>
    </motion.div>
  );
};
