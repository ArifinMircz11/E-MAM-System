import React from 'react';
import type { AttendanceToday } from '../types';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AttendanceTodayCardProps {
  attendance: AttendanceToday | null;
}

export const AttendanceTodayCard: React.FC<AttendanceTodayCardProps> = ({ attendance }) => {
  const sessions = [
    { label: 'MASUK', key: 'masuk' as const },
    { label: 'DUHA', key: 'duha' as const },
    { label: 'ZUHUR', key: 'zuhur' as const },
    { label: 'ASHAR', key: 'ashar' as const },
    { label: 'PULANG', key: 'pulang' as const },
  ];

  const getStatusInfo = (time?: string) => {
    if (!time || time === '--:--' || time.toLowerCase().includes('ts')) {
      return {
        icon: <XCircle className="w-3.5 h-3.5 text-rose-500/70" />,
        bg: 'bg-rose-500/[0.03] dark:bg-rose-950/[0.1]',
        text: 'text-rose-600/90 dark:text-rose-450',
        label: time || '--:--',
      };
    }
    return {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      bg: 'bg-emerald-500/[0.03] dark:bg-emerald-950/[0.1]',
      text: 'text-emerald-600 dark:text-emerald-450',
      label: time,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-[340px] shrink-0 snap-start h-[215px] bg-[#0F172A] border border-indigo-500/10 rounded-[2.5rem] p-5 flex flex-col justify-between relative overflow-hidden group shadow-xl"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Kehadiran Hari Ini
        </h3>
        {attendance?.status && (
          <span
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              attendance.status === 'Hadir'
                ? 'bg-emerald-500/15 text-emerald-400'
                : (attendance.status === 'Izin' || attendance.status === 'Sakit')
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {attendance.status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1 flex-1 overflow-y-auto pr-0.5 scrollbar-hide py-1">
        {sessions.map((session) => {
          const info = getStatusInfo(attendance?.[session.key]);
          return (
            <div
              key={session.key}
              className={`flex items-center justify-between py-1 px-3 rounded-xl ${info.bg} border border-white/5`}
            >
              <span className={`text-[8.5px] font-bold tracking-wide ${info.text}`}>
                {session.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold font-mono ${info.text}`}>{info.label}</span>
                {info.icon}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
