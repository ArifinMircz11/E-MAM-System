import React from 'react';
import type { ScheduleItem } from '@/types';
import { motion } from 'framer-motion';
import { BookOpen, MapPin } from 'lucide-react';

interface ScheduleTodayCardProps {
  schedules: ScheduleItem[];
}

export const ScheduleTodayCard: React.FC<ScheduleTodayCardProps> = ({ schedules }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-[340px] shrink-0 snap-start h-[215px] bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 border border-slate-100 dark:border-white/5 shadow-md flex flex-col justify-between"
    >
      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5 shrink-0">
        <BookOpen className="w-3.5 h-3.5" />
        Jadwal Hari Ini
      </h3>

      <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-hide py-2 space-y-2">
        {schedules.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-6">
            <p className="text-[9px] font-bold text-slate-400">Tidak ada jadwal aktif</p>
          </div>
        ) : (
          schedules.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-[#0F172A]/40 hover:bg-slate-100 dark:hover:bg-[#0F172A] border border-slate-100 dark:border-white/5 transition-colors"
            >
              <div className="w-14 text-center border-r border-slate-200 dark:border-slate-800 pr-3 shrink-0">
                <p className="text-[9px] font-bold text-indigo-505 dark:text-indigo-400 font-mono ">
                  {item.time.split(' - ')[0]}
                </p>
                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-0.5" />
                <p className="text-[9px] font-bold text-slate-400 font-mono ">
                  {item.time.split(' - ')[1]}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                  {item.subject}
                </p>
                <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5" />
                  {item.room} {item.teacherName ? `• ${item.teacherName}` : ''}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="text-[7.5px] font-bold text-slate-400/90 dark:text-slate-500 uppercase tracking-wide shrink-0 mt-1 flex justify-between">
        <span>Madrasah Aliyah</span>
        <span>Akademik Terpadu</span>
      </div>
    </motion.div>
  );
};
