import type { AppEntity } from './base';

/**
 * PointTransaction Entity - Domain representation of a student discipline point.
 */
export interface PointTransaction extends AppEntity {
  studentsId: string;
  studentId?: string;
  studentName?: string;
  namaSiswa?: string;
  className?: string;
  classId?: string;
  class?: string;
  type: 'pelanggaran' | 'prestasi' | 'Pelanggaran' | 'Prestasi' | 'Achievement' | 'Misconduct' | 'Neutral' | string;
  points: number;
  point?: number;
  skor?: number;
  category?: string;
  categoryId?: string;
  kategori?: string;
  description?: string;
  keterangan?: string;
  recordedBy?: string;
  date?: string;
  idPetugas?: string;
  attendanceId?: string;
  version: number;
}

/**
 * PointCategory Entity - Discipline category definition.
 */
export interface PointCategory extends AppEntity {
  name: string;
  points: number;
  type: 'Pelanggaran' | 'Prestasi';
  description: string;
  isActive: boolean;
  linkedToAttendance?: boolean;
  linkedSession?: 'masuk' | 'duha' | 'zuhur' | 'ashar' | 'pulang' | null;
}
