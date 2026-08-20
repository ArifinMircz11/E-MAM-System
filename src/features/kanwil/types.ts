export type SatuanKerjaType = 'KANWIL' | 'KANKENAG_KAB_KOTA' | 'MADRASAH';
export type EducationLevel = 'MA' | 'MTs' | 'MI';
export type AssignmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SatuanKerjaData {
  id: string;
  name: string;
  code: string;
  region: string; // e.g. "Kalimantan Selatan" or Kabupaten/Kota name
  type: SatuanKerjaType;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'synced' | 'pending' | 'modified';
}

export interface AssignmentRequestData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  satuanKerjaId: string;
  satuanKerjaName: string;
  jenjang?: EducationLevel;
  madrasahId?: string;
  madrasahName?: string;
  status: AssignmentStatus;
  requestedAt: number;
  approvedAt?: number;
  approvedBy?: string;
  tenantId?: string;
}

export interface KanwilDashboardSummary {
  totalSatuanKerjaKabKota: number;
  totalMA: number;
  totalMTs: number;
  totalMI: number;
  totalMadrasah: number;
  totalUsers: number;
  pendingAssignments: number;
  activeNotifications: number;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: number;
}
