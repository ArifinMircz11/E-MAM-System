import React from 'react';
import { motion } from 'framer-motion';
import { UserIcon, WhatsAppIcon, ArrowLeftIcon } from '@/shared/Icons';

interface StudentPointRowProps {
  s: any;
  idx: number;
  onClick: () => void;
}

export const StudentPointRow = React.memo<StudentPointRowProps>(({ s, idx, onClick }) => {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-4 rounded-2xl text-left border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:border-amber-300 dark:hover:border-amber-700 transition-all group w-full"
    >
      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center text-amber-600">
        <UserIcon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors">
            {s.namaLengkap}
          </h4>
          {(s.noHp || s.noTelepon) && (
            <a
              href={`https://wa.me/${(s.noHp || s.noTelepon || '').replace(/\D/g, '').replace(/^0/, '62')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-0.5 text-emerald-500 hover:text-emerald-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="WhatsApp"
            >
              <WhatsAppIcon className="w-3 h-3" />
            </a>
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          Kelas {s.tingkatRombel} • ID: {s.idUnik}
        </p>
      </div>
      <ArrowLeftIcon className="w-4 h-4 text-slate-300 rotate-180" />
    </motion.button>
  );
});

StudentPointRow.displayName = 'StudentPointRow';
