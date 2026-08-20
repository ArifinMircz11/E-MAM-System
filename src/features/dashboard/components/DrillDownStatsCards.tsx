import React from 'react';
import { ArrowRightIcon, XCircleIcon, ClockIcon, HeartIcon } from '@/shared/Icons';
import type { DrillDownData } from '../types';

interface DrillDownStatsCardsProps {
  anomalies: {
    listTerdeteksi: any[];
    listHadir: any[];
    listSakitIzin: any[];
    listAlpha: any[];
    listTs: any[];
    listT: any[];
    listPC: any[];
    listHaid: any[];
  } | null;
  stats: {
    hadir?: number;
    alpha?: number;
    [key: string]: any;
  };
  onSelectDrill: (data: DrillDownData) => void;
}

export const DrillDownStatsCards: React.FC<DrillDownStatsCardsProps> = ({
  anomalies,
  stats,
  onSelectDrill,
}) => {
  if (!anomalies) {
    return (
      <div className="py-8 text-center opacity-40 text-xs font-bold uppercase tracking-wider">
        Menghitung data monitoring...
      </div>
    );
  }

  const {
    listTerdeteksi = [],
    listHadir = [],
    listSakitIzin = [],
    listAlpha = [],
    listTs = [],
    listT = [],
    listPC = [],
    listHaid = [],
  } = anomalies;

  return (
    <div className="space-y-4">
      {/* Layer 1: General Aggregates */}
      <div className="grid grid-cols-2 gap-3">
        {/* DRILL DOWN 3: ACTIVE MONITORING */}
        <button
          onClick={() =>
            onSelectDrill({
              title: 'Siswa Terdeteksi (Scan)',
              students: listTerdeteksi,
              type: 'DETEKSI',
            })
          }
          className="bg-emerald-600 dark:bg-emerald-500 p-5 rounded-[2rem] shadow-lg shadow-emerald-500/20 text-white text-left relative overflow-hidden active:scale-95 transition-all group cursor-pointer border-0"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-550" />
          <span className="block text-[10px] font-bold uppercase tracking-wide opacity-80 mb-1">
            DRILL DOWN 3
          </span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold leading-none">{listTerdeteksi.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-tight mb-1 opacity-90">
              Terdeteksi
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide">
            Lihat Daftar{' '}
            <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        {/* DRILL DOWN 1: QUICK ACCESS */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
              DRILL DOWN 1
            </span>
            <div className="flex -space-x-1.5">
              <button
                onClick={() =>
                  onSelectDrill({ title: 'Siswa Hadir', students: listHadir, type: 'DETEKSI' })
                }
                className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center border-2 border-white dark:border-slate-800 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="Klik untuk melihat detail siswa Hadir"
              >
                <span className="text-[8px] font-bold text-emerald-600">H</span>
              </button>
              <button
                onClick={() =>
                  onSelectDrill({
                    title: 'Siswa Sakit & Izin',
                    students: listSakitIzin,
                    type: 'Izin',
                  })
                }
                className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center border-2 border-white dark:border-slate-800 font-bold text-blue-600 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="Klik untuk melihat detail siswa Sakit & Izin"
              >
                <span className="text-[8px]">I</span>
              </button>
              <button
                onClick={() =>
                  onSelectDrill({ title: 'Siswa Alpha', students: listAlpha, type: 'TS' })
                }
                className="w-6 h-6 rounded-full bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center border-2 border-white dark:border-slate-800 font-bold text-rose-600 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="Klik untuk melihat detail siswa Alpha"
              >
                <span className="text-[8px]">A</span>
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase ">
            <button
              onClick={() =>
                onSelectDrill({ title: 'Siswa Hadir', students: listHadir, type: 'DETEKSI' })
              }
              className="text-emerald-600 dark:text-emerald-400 hover:underline text-left font-bold focus:outline-none transition-colors"
            >
              {listHadir.length} Hadir
            </button>
            <button
              onClick={() =>
                onSelectDrill({
                  title: 'Siswa Alpha / Belum Absen',
                  students: listAlpha,
                  type: 'TS',
                })
              }
              className="text-rose-600 dark:text-rose-400 hover:underline text-left font-bold focus:outline-none transition-colors"
            >
              {listAlpha.length} Alpha
            </button>
          </div>
        </div>
      </div>

      {/* Layer 2: Exceptions (DRILL DOWN 2) */}
      <div className="bg-white dark:bg-[#0B1121] rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Exception Tracker
          </div>
          <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950 dark:text-rose-400 text-rose-600 rounded-full text-[8px] font-bold uppercase tracking-wide">
            DRILL DOWN 2
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() =>
              onSelectDrill({ title: 'Tidak Scan (TS)', students: listTs, type: 'TS' })
            }
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-all active:scale-95 cursor-pointer"
          >
            <XCircleIcon className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-850 dark:text-white leading-none">
              {listTs.length}
            </span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
              TS
            </span>
          </button>
          <button
            onClick={() => onSelectDrill({ title: 'Terlambat (T)', students: listT, type: 'T' })}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-all active:scale-95 cursor-pointer"
          >
            <ClockIcon className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-600 leading-none">{listT.length}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
              T
            </span>
          </button>
          <button
            onClick={() =>
              onSelectDrill({ title: 'Pulang Cepat (PC)', students: listPC, type: 'PC' })
            }
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowRightIcon className="w-4 h-4 text-indigo-500 rotate-180" />
            <span className="text-sm font-bold text-indigo-600 leading-none">{listPC.length}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
              PC
            </span>
          </button>
          <button
            onClick={() =>
              onSelectDrill({ title: 'Ibadah Khusus (HD)', students: listHaid, type: 'Haid' })
            }
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#1E1111]/30 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-all active:scale-95 cursor-pointer"
          >
            <HeartIcon className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-bold text-rose-500 leading-none">{listHaid.length}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wide">
              HD
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
