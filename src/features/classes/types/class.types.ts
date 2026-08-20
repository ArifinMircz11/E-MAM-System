import type { IClassEntity } from '@/repositories/contracts/IClassRepository';

export type ClassStatus = 'active' | 'closed' | 'archived';

export interface ClassRoom extends IClassEntity {
  academicYearId: string;
  tingkat: string;
  waliKelasId?: string;
  waliKelasNama?: string;
  jumlahSiswa: number;
  kapasitas?: number;
  status: ClassStatus;
  
  // Relations (usually IDs for Dexie/Firestore)
  studentIds?: string[];
}

export interface ClassCreateInput {
  namaKelas: string;
  kodeKelas: string;
  tingkat: string;
  academicYearId: string;
  waliKelasId?: string;
}

export interface ClassFilterState {
  searchQuery: string;
  tingkat: string;
  academicYearId: string;
  status: string;
}
