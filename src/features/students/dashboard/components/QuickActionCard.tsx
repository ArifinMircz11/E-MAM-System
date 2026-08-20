import React from 'react';
import { motion } from 'framer-motion';
import { ViewState } from '@/types';
import {
  QrCode,
  Award,
  FileStack,
  UserCircle,
  Zap,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface QuickActionCardProps {
  onNavigate: (view: ViewState) => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ onNavigate }) => {
  const actions = [
    {
      label: 'Presensi',
      icon: <QrCode className="w-5 h-5" />,
      view: ViewState.PERSONAL_ATTENDANCE,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: 'Siswa',
      icon: <Users className="w-5 h-5" />,
      view: ViewState.PERSONAL_ATTENDANCE,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Poin',
      icon: <Award className="w-5 h-5" />,
      view: ViewState.POINTS,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Surat',
      icon: <FileStack className="w-5 h-5" />,
      view: ViewState.LETTERS,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      label: 'Profil',
      icon: <UserCircle className="w-5 h-5" />,
      view: ViewState.PROFILE,
      color: 'text-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
    },
    {
      label: 'Audit RBAC',
      icon: <ShieldCheck className="w-5 h-5" />,
      view: ViewState.SYSTEM_AUDIT,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-white/5"
    >
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-6">
        <Zap className="w-3 h-3 text-amber-500" />
        Akses Cepat
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.view)}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
            >
              {action.icon}
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
