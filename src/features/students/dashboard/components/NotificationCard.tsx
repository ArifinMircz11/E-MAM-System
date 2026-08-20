import React from 'react';
import type { AppNotification } from '@/types';
import { motion } from 'framer-motion';
import { Bell, Award, FileText, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface NotificationCardProps {
  notifications: AppNotification[];
  onClickAll?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notifications,
  onClickAll,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'transaksi':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'surat':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-white/5"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <Bell className="w-3 h-3" />
          Notifikasi
        </h3>
        <button
          onClick={onClickAll}
          className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition-colors"
        >
          LIHAT RIWAYAT
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 dark:bg-[#0F172A] rounded-[2rem] border border-dashed border-indigo-100 dark:border-indigo-500/10 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-white dark:bg-[#020617] rounded-full shadow-sm flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-indigo-300 dark:text-indigo-400 opacity-50" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Tidak ada notifikasi baru
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-1">
              Belum ada aktivitas terbaru saat ini
            </p>
          </div>
        ) : (
          notifications.map((notif, idx) => (
            <div key={notif.id || idx} className="flex gap-4 group cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getIcon(notif.type)}
                </div>
              </div>
              <div className="flex-1 pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  {notif.title}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 line-clamp-1">
                  {notif.message}
                </p>
                <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase mt-1 tracking-wide">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
