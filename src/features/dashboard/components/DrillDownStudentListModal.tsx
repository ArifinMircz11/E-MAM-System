import React, { useState, useEffect } from 'react';
import { XCircleIcon } from '@/shared/Icons';
import type { DrillDownData } from '../types';
import { SyncStatus } from '@/domain/entities/base';

interface DrillDownStudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  drillDownData: DrillDownData | null;
  onSelectStudent: (student: any) => void;
}

export const DrillDownStudentListModal: React.FC<DrillDownStudentListModalProps> = ({
  isOpen,
  onClose,
  drillDownData,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !drillDownData) return null;

  const filteredStudents = drillDownData.students.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (query === '') return true;
    return (
      (s.namaLengkap || '').toLowerCase().includes(query) ||
      (s.idUnik || '').toLowerCase().includes(query) ||
      (s.tingkatRombel || '').toLowerCase().includes(query) ||
      (s.className || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="bg-white dark:bg-[#0F172A] w-full max-w-lg max-h-[85vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drilldown-modal-title"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {drillDownData.type}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {drillDownData.students.length} Total Siswa
              </span>
            </div>
            <h3 id="drilldown-modal-title" className="font-bold text-base text-slate-800 dark:text-white uppercase tracking-tight mt-1">
              {drillDownData.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NISN, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="py-20 text-center opacity-40 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {searchQuery ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Tidak ada data siswa'}
            </div>
          ) : (
            filteredStudents.map((s, i) => {
              const syncStatus = s.att?.syncStatus;
              const isSynced = syncStatus === SyncStatus.SYNCED;
              const isPending = syncStatus === SyncStatus.PENDING;

              return (
                <div
                  key={s.id || s.studentsId || i}
                  onClick={() => {
                    onSelectStudent(s);
                    onClose();
                  }}
                  className="p-4 bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5 active:scale-98"
                  title="Klik untuk membuka laporan detail bulanan siswa ini"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform relative">
                      {s.namaLengkap?.charAt(0) || 'S'}
                      <div 
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#0B1121] shadow-sm ${
                          isSynced 
                            ? 'bg-emerald-500' 
                            : isPending
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={isSynced ? 'Sudah Sinkron' : isPending ? 'Menunggu Sinkronisasi' : 'Lokal (Belum Sinkron)'}
                      />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-slate-800 dark:text-white leading-none mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                        {s.namaLengkap || 'Siswa Tanpa Nama'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                          {s.idUnik || s.studentsId || 'NISN -'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wide">
                          {s.tingkatRombel || s.className || 'Kelas Umum'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tight shadow-sm ${
                        drillDownData.type === 'Haid'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : drillDownData.type === 'T'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : drillDownData.type === 'TS'
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                              : drillDownData.type === 'DETEKSI'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                : drillDownData.type === 'Izin'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
                      }`}
                    >
                      {s.reason ||
                        (drillDownData.type === 'DETEKSI' ? 'AKTIF SCAN' : drillDownData.type)}
                    </div>
                    <p className="text-[7px] font-bold text-indigo-500 uppercase tracking-wide mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Detail Bulanan →
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            Menampilkan {filteredStudents.length} dari {drillDownData.students.length} siswa
          </span>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl text-[10px] uppercase tracking-wide hover:opacity-90 active:scale-98 transition-all shadow-md"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
