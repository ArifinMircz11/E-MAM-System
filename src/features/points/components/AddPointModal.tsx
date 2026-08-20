import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@/shared/Icons';
import type { PointType } from '@/domain/point/pointDomain';
import type { PointCategory } from '@/types';

interface AddPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointType: PointType;
  setPointType: (type: PointType) => void;
  pointValue: number;
  setPointValue: (val: number) => void;
  category: string;
  setCategory: (cat: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  dynamicCategories: PointCategory[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddPointModal: React.FC<AddPointModalProps> = ({
  isOpen,
  onClose,
  pointType,
  setPointType,
  pointValue,
  setPointValue,
  category,
  setCategory,
  description,
  setDescription,
  dynamicCategories,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Catat Poin Baru
            </h3>
            <button
              onClick={onClose}
              className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"
            >
              <ArrowLeftIcon className="w-6 h-6 text-slate-400 rotate-90" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setPointType('Achievement')}
                className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-xl transition-all ${
                  pointType === 'Achievement'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400'
                }`}
              >
                Prestasi (-)
              </button>
              <button
                type="button"
                onClick={() => setPointType('Misconduct')}
                className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-xl transition-all ${
                  pointType === 'Misconduct'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'text-slate-400'
                }`}
              >
                Pelanggaran (+)
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold tracking-wide text-slate-400 flex items-center gap-2">
                Nilai poin
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[5, 10, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPointValue(val)}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                      pointValue === val
                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Atau masukkan manual..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-amber-500"
                value={pointValue || ''}
                onChange={(e) => setPointValue(Number(e.target.value))}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold tracking-wide text-slate-400">
                Kategori
              </label>
              <div className="flex flex-wrap gap-2">
                {dynamicCategories
                  .filter(
                    (c) =>
                      c.isActive &&
                      (pointType === 'Achievement'
                        ? c.type === 'Prestasi'
                        : c.type === 'Pelanggaran'),
                  )
                  .map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.name);
                        setPointValue(Math.abs(cat.points));
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                        category === cat.name
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold tracking-wide text-slate-400">
                Keterangan
              </label>
              <textarea
                placeholder="Detail kejadian..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !category || pointValue === 0}
              className="w-full py-4 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 rounded-2xl text-xs font-bold tracking-wide shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN CATATAN'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
