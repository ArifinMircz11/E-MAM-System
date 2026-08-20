import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  ClockIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from '@/shared/Icons';
import type { StudentPoint, StudentPointSummary } from '@/domain/point/pointDomain';
import { getLevelDisplay, SanctionLevel } from '@/domain/point/pointDomain';

interface StudentPointDetailProps {
  selectedStudent: any;
  summary: StudentPointSummary | null;
  history: StudentPoint[];
  isStaff: boolean;
  isStudentOnly: boolean;
  onBackToSearch: () => void;
  onOpenAddModal: (type: 'Misconduct' | 'Achievement') => void;
  onSetPointToDelete: (pointData: {
    id: string;
    studentsId: string;
    category: string;
    description: string;
    points: number;
  }) => void;
}

export const StudentPointDetail: React.FC<StudentPointDetailProps> = ({
  selectedStudent,
  summary,
  history,
  isStaff,
  isStudentOnly,
  onBackToSearch,
  onOpenAddModal,
  onSetPointToDelete,
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {!isStudentOnly && (
        <button
          onClick={onBackToSearch}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali ke Pencarian
        </button>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 overflow-hidden relative">
        <div
          className={`absolute top-0 right-0 w-32 h-32 opacity-10 -mr-8 -mt-8 rounded-full ${
            summary ? getLevelDisplay(summary.sanctionLevel).color : 'bg-slate-500'
          }`}
        ></div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-slate-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {selectedStudent.namaLengkap}
            </h2>
            <p className="text-xs text-slate-400 font-bold tracking-tight">
              Kelas {selectedStudent.tingkatRombel} • {selectedStudent.idUnik}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">
              Total poin
            </p>
            <div className="flex items-end gap-1">
              <span
                className={`text-2xl font-bold ${
                  summary && summary.totalPoints > 0 ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {summary && summary.totalPoints > 0 ? '+' : ''}
                {summary?.totalPoints || 0}
              </span>
              <span className="text-[10px] font-bold text-slate-400 mb-1.5">poin</span>
            </div>
          </div>
          <div
            className={`p-4 rounded-2xl border shadow-lg shadow-black/5 ${
              summary
                ? getLevelDisplay(summary.sanctionLevel).color
                : 'bg-slate-50 border-slate-100'
            } bg-opacity-10`}
          >
            <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">
              Status sanksi
            </p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  summary ? getLevelDisplay(summary.sanctionLevel).color : 'bg-slate-400'
                }`}
              ></div>
              <span
                className={`text-xs font-bold ${
                  summary
                    ? `text-${getLevelDisplay(summary.sanctionLevel).color.split('-')[1]}-600`
                    : 'text-slate-500'
                }`}
              >
                {summary ? getLevelDisplay(summary.sanctionLevel).label : '-'}
              </span>
            </div>
          </div>
        </div>

        {summary && summary.sanctionLevel !== SanctionLevel.AMAN && (
          <div className="bg-rose-50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20 flex gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium italic">
              {getLevelDisplay(summary.sanctionLevel).text}
            </p>
          </div>
        )}

        {isStaff && (
          <div className="flex gap-3">
            <button
              onClick={() => onOpenAddModal('Misconduct')}
              className="flex-1 bg-rose-600 text-white py-4 rounded-2xl text-[10px] font-bold tracking-wide shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              Pelanggaran (+)
            </button>
            <button
              onClick={() => onOpenAddModal('Achievement')}
              className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-bold tracking-wide shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <TrophyIcon className="w-4 h-4" />
              Prestasi (-)
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between pl-1">
          <h3 className="text-[10px] font-bold tracking-wide text-slate-400 flex items-center gap-2">
            <ClockIcon className="w-3 h-3" />
            Riwayat poin terakhir
          </h3>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center border border-dashed border-slate-200 dark:border-slate-700">
              <ClockIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">Belum ada catatan poin</p>
            </div>
          ) : (
            history.map((h, idx) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    h.points < 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {h.points < 0 ? (
                    <TrophyIcon className="w-5 h-5" />
                  ) : (
                    <ShieldExclamationIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wide text-slate-400">
                      {h.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          h.points < 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {h.points > 0 ? '+' : ''}
                        {h.points}
                      </span>
                      {isStaff && (
                        <button
                          onClick={() =>
                            onSetPointToDelete({
                              id: h.id || '',
                              studentsId: selectedStudent.id || '',
                              category: h.category,
                              description: h.description || 'Tanpa keterangan',
                              points: h.points,
                            })
                          }
                          className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {h.description || 'Tanpa keterangan'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold italic">
                    Oleh {h.authorName} • {h.timestamp?.toDate().toLocaleDateString('id-ID')}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};
