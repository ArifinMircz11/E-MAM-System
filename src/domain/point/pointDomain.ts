/**
 * Domain Logic for Point Management
 * e-Mam System
 */

import { BaseEntity } from '@/entities/BaseEntity';

export enum SanctionLevel {
  AMAN = 'AMAN',
  PERINGATAN_1 = 'PERINGATAN_1',
  PANGGILAN_1 = 'PANGGILAN_1',
  PANGGILAN_2 = 'PANGGILAN_2',
  PANGGILAN_3 = 'PANGGILAN_3',
  DROP_OUT = 'DROP_OUT',
}

export type PointType = 'Achievement' | 'Misconduct' | 'Neutral' | 'Prestasi' | 'Pelanggaran';

export interface StudentPoint {
  id?: string;
  studentsId: string;
  studentName: string;
  classId: string;
  class?: string; // Legacy support
  points: number;
  type: PointType;
  category: string;
  description: string;
  timestamp: any;
  authorId: string;
  authorName: string;
}

export interface StudentPointSummary extends BaseEntity {
  studentsId: string;
  studentName: string;
  totalPoints: number;
  sanctionLevel: SanctionLevel;
  lastUpdate: any;
}

/**
 * Calculate sanction level based on points
 * e-Mam System v7.0 Convention: Higher positive points = More violations
 */
export const calculateSanctionLevel = (points: number): SanctionLevel => {
  if (points < 15) return SanctionLevel.AMAN;
  if (points >= 15 && points < 25) return SanctionLevel.PERINGATAN_1;
  if (points >= 25 && points < 50) return SanctionLevel.PANGGILAN_1;
  if (points >= 50 && points < 75) return SanctionLevel.PANGGILAN_2;
  if (points >= 75 && points < 100) return SanctionLevel.PANGGILAN_3;
  return SanctionLevel.DROP_OUT;
};

/**
 * Get display info for a sanction level
 */
export const getLevelDisplay = (level: SanctionLevel) => {
  switch (level) {
    case SanctionLevel.AMAN:
      return { label: 'Aman', color: 'bg-emerald-500', text: 'Siswa dalam kondisi aman.' };
    case SanctionLevel.PERINGATAN_1:
      return {
        label: 'Peringatan 1',
        color: 'bg-amber-500',
        text: 'Peringatan 1 (Konseling / Himbauan)',
      };
    case SanctionLevel.PANGGILAN_1:
      return { label: 'Panggilan 1', color: 'bg-orange-500', text: 'Panggilan Orang Tua 1' };
    case SanctionLevel.PANGGILAN_2:
      return { label: 'Panggilan 2', color: 'bg-rose-500', text: 'Panggilan Orang Tua 2' };
    case SanctionLevel.PANGGILAN_3:
      return {
        label: 'Panggilan 3',
        color: 'bg-red-600',
        text: 'Panggilan Orang Tua 3 (Terakhir)',
      };
    case SanctionLevel.DROP_OUT:
      return { label: 'Drop Out', color: 'bg-black', text: 'Sanksi Terberat: Drop Out' };
    default:
      return { label: 'Unknown', color: 'bg-slate-500', text: '-' };
  }
};
