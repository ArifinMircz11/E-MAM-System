import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircleIcon } from '@/shared/Icons';

interface DeletePointRecordModalProps {
  pointToDelete: {
    id: string;
    studentsId: string;
    category: string;
    description: string;
    points: number;
  } | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export const DeletePointRecordModal: React.FC<DeletePointRecordModalProps> = ({
  pointToDelete,
  onClose,
  onConfirmDelete,
}) => {
  if (!pointToDelete) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Hapus Catatan Poin
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Apakah Anda yakin ingin menghapus poin{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {pointToDelete.points}
              </span>{' '}
              kategori{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {pointToDelete.category}
              </span>
              ?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-bold tracking-wide"
            >
              BATAL
            </button>
            <button
              onClick={onConfirmDelete}
              className="py-3 bg-rose-600 text-white rounded-xl text-[10px] font-bold tracking-wide"
            >
              HAPUS
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
