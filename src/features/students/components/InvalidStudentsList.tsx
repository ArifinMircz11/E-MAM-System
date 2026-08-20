/**
 * @license
 * e-Mam System - Invalid Students List Component
 * LAYER: PRESENTATIONAL UI (Vertical Slice Architecture Compliant)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudents } from '../hooks/useStudents';
import {
  XCircleIcon,
  AlertCircleIcon,
  UserIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  RefreshCwIcon,
} from 'lucide-react';
import type { Student } from '@/types';

interface InvalidStudentsListProps {
  onEditStudent?: (student: Student) => void;
}

export const InvalidStudentsList: React.FC<InvalidStudentsListProps> = ({ onEditStudent }) => {
  const { invalidStudents, isLoading, error, loadInvalidStudents } = useStudents();

  // Helper to map invalid fields to human-readable text
  const getIssueDescription = (student: Student): string => {
    const issues: string[] = [];
    if (!student.nisn || student.nisn.trim() === '') issues.push('NISN Kosong');
    if (!student.jenisKelamin || student.jenisKelamin.trim() === '')
      issues.push('Jenis Kelamin Kosong');
    if (!student.tingkatRombel || student.tingkatRombel.trim() === '') issues.push('Kelas Kosong');

    return issues.join(', ') || 'Data Tidak Lengkap';
  };

  if (isLoading && invalidStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCwIcon className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Memindai database lokal...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-start gap-4">
        <XCircleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Terjadi Kesalahan</h4>
          <p className="text-xs text-red-600/80 dark:text-red-500/70 mt-1">{error}</p>
          <button
            onClick={() => loadInvalidStudents()}
            className="mt-3 px-4 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (invalidStudents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2Icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 lowercase tracking-tight">
          Database Bersih!
        </h3>
        <p className="text-sm text-emerald-600/80 dark:text-emerald-500/70 mt-2 max-w-xs mx-auto">
          Seluruh data siswa di penyimpanan lokal sudah valid dan lengkap sesuai standar sistem.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white lowercase ">
            Audit Data Lokal
          </h3>
          <p className="text-xs text-slate-500 lowercase mt-1">
            Ditemukan {invalidStudents.length} siswa dengan data tidak lengkap
          </p>
        </div>
        <button
          onClick={() => loadInvalidStudents()}
          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Refresh Data"
        >
          <RefreshCwIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {invalidStudents.map((student, index) => (
            <motion.div
              key={`${student.id || student.idUnik || 'invalid-student'}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate lowercase tracking-tight">
                    {student.namaLengkap}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/30">
                      <AlertCircleIcon className="w-2.5 h-2.5" />
                      {getIssueDescription(student)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium lowercase">
                      {student.tingkatRombel || 'Tanpa Kelas'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onEditStudent?.(student)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-all shrink-0"
              >
                Lengkapi Data
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
        <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/60 leading-relaxed text-center italic">
          Audit ini hanya memindai basis data lokal perangkat Anda untuk memastikan performa
          maksimal tanpa penggunaan kuota Firestore.
        </p>
      </div>
    </div>
  );
};
