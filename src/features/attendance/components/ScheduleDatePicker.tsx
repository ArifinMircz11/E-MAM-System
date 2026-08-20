import React, { useRef } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';

export const ScheduleDatePicker = ({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ambil Senin minggu ini sebagai referensi
  const today = new Date();
  const currentDay = today.getDay();
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));

  // Buat list Senin - Jum'at
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    days.push(addDays(monday, i));
  }

  const customDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

  return (
    <div ref={containerRef} className="w-full flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {days.map((date, i) => {
        const active = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());

        return (
          <motion.button
            key={i}
            onClick={() => onSelect(date)}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 min-w-[70px] py-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 transition-all relative ${
              active
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30'
                : 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/70'
            }`}
          >
            {isToday && !active && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            )}
            <span
              className={`text-[8px] font-bold  tracking-wide ${active ? 'text-indigo-100' : 'text-slate-400'}`}
            >
              {customDayNames[date.getDay()]}
            </span>
            <span
              className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}
            >
              {format(date, 'd')}
            </span>
            {active && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-1 w-6 h-1 bg-white rounded-full"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
