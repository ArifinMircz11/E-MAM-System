import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon } from '@/shared/Icons';

interface ClearPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmInput: string;
  setConfirmInput: (val: string) => void;
  isClearing: boolean;
  onExecuteClear: () => Promise<void>;
}

export const ClearPointsModal: React.FC<ClearPointsModalProps> = ({
  isOpen,
  onClose,
  confirmInput,
  setConfirmInput,
  isClearing,
  onExecuteClear,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wide">
              RESET SELURUH POIN
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tindakan ini akan menghapus seluruh RIWAYAT poin dan me-reset status sanksi
              seluruh siswa ke AMAN (0).
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[8px] font-bold text-slate-400 uppercase text-center tracking-wide">
                Ketik "RESET" untuk melanjutkan
              </p>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-rose-100 dark:border-rose-900/30 rounded-xl py-3 px-4 text-sm font-bold text-center focus:ring-0 outline-none uppercase"
                placeholder="RESET"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-bold tracking-wide"
              >
                BATAL
              </button>
              <button
                onClick={onExecuteClear}
                disabled={confirmInput.toUpperCase() !== 'RESET' || isClearing}
                className="py-3 bg-rose-600 text-white rounded-xl text-[10px] font-bold tracking-wide disabled:opacity-50"
              >
                KONFIRMASI RESET
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
