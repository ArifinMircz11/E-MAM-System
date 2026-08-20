/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: SERVICE (BUSINESS LOGIC)
 *
 * AttendanceSummaryService bertanggung jawab atas:
 * - Agregasi data absensi
 * - Perhitungan statistik (H, T, TS, I, S, H+, PC, etc.)
 * - Transformasi data untuk ViewModel (Badge, Status display)
 * - Perhitungan Poin berdasarkan aturan bisnis
 */

import type { AttendanceRecord } from '@/types';

export interface AttendanceStats {
  total: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  pc: number; // Pulang Cepat
  ts: number; // Tidak Scan
}

export const AttendanceSummaryService = {
  /**
   * Menghitung statistik absensi lengkap
   */
  calculateStats: (records: AttendanceRecord[]): AttendanceStats => {
    const stats: AttendanceStats = {
      total: records.length,
      hadir: 0,
      terlambat: 0,
      izin: 0,
      sakit: 0,
      alpa: 0,
      pc: 0,
      ts: 0,
    };

    records.forEach((r) => {
      const status = ((r as any).statusGlobal || r.status || '').toLowerCase();

      if (status === 'hadir') stats.hadir++;
      else if (status === 'terlambat') stats.terlambat++;
      else if (status === 'izin') stats.izin++;
      else if (status === 'sakit') stats.sakit++;
      else if (status === 'alpha' || status === 'alpa') stats.alpa++;
      else if (status === 'pc' || status === 'pulang cepat') stats.pc++;
      else if (status === 'tidak scan') stats.ts++;
    });

    return stats;
  },

  /**
   * Mendapatkan label status dan warna badge berdasarkan status
   */
  getDisplayStatus: (status: string | undefined): { label: string; color: string } => {
    const s = (status || '').toLowerCase();

    switch (s) {
      case 'hadir':
        return { label: 'Hadir', color: 'bg-green-100 text-green-800' };
      case 'terlambat':
        return { label: 'Terlambat', color: 'bg-yellow-100 text-yellow-800' };
      case 'izin':
        return { label: 'Izin', color: 'bg-blue-100 text-blue-800' };
      case 'sakit':
        return { label: 'Sakit', color: 'bg-purple-100 text-purple-800' };
      case 'pc':
      case 'pulang cepat':
        return { label: 'Pulang Cepat', color: 'bg-orange-100 text-orange-800' };
      case 'alpa':
      case 'alpha':
        return { label: 'Alpha', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Tidak Scan', color: 'bg-slate-100 text-slate-800' };
    }
  },

  getFormattedSession: (sessionData: any) => {
    const time = sessionData?.time || 'Ts';
    const isHaid = sessionData?.status === 'haid';

    if (isHaid && time === 'Ts') return { text: 'Ts (Haid)', color: 'text-rose-500 font-bold' };
    if (isHaid) return { text: `${time} (Haid)`, color: 'text-pink-500' };
    if (time === 'Ts') return { text: 'Ts', color: 'text-rose-500 font-bold' };
    if (time.includes('Pc')) return { text: time, color: 'text-amber-500 font-bold' };

    return { text: time, color: 'text-slate-700 dark:text-slate-300' };
  },
};
