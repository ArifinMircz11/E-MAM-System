import React from 'react';
import type { PermissionActive } from '../types';
import { motion } from 'framer-motion';
import { HeartPulse, FileText, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface PermissionCardProps {
  permission: PermissionActive | null;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({ permission }) => {
  if (!permission) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-amber-50 dark:bg-amber-900/20 rounded-3xl p-6 border border-amber-100 dark:border-amber-800 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wide flex items-center gap-2">
          <HeartPulse className="w-3 h-3" />
          Izin Aktif
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-2.5 h-2.5" /> DISETUJUI
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          <FileText className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            {permission.type}
          </p>
          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
            {format(parseISO(permission.date), 'dd MMMM yyyy', { locale: id })}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
              {permission.approvedBy.charAt(0)}
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              Oleh:{' '}
              <span className="text-slate-600 dark:text-slate-300 font-bold">
                {permission.approvedBy}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
