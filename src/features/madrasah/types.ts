import { UserRole } from '@/types';

export interface Madrasah {
  id: string;
  tenantId: string;
  npsn: string;
  nsm: string;
  namaMadrasah: string;
  jenjang: 'RA' | 'MI' | 'MTs' | 'MA';
  status: 'Negeri' | 'Swasta';
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan?: string;
  alamat: string;
  kodePos?: string;
  latitude?: string;
  longitude?: string;
  
  // Tenant Info
  subdomain?: string;
  statusTenant: 'active' | 'inactive' | 'maintenance';
  
  // Metadata
  version: number;
  syncStatus: 'synced' | 'pending' | 'error';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  deleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface MadrasahCreateInput extends Omit<Madrasah, 'id' | 'tenantId' | 'version' | 'syncStatus' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deleted'> {
  // Optional Headmaster
  kepalaMadrasah?: {
    nama: string;
    nip?: string;
    email: string;
    phone?: string;
  };
  
  // Initial Config
  config: {
    activateAcademicYear: boolean;
    createFolderStructure: boolean;
    createMasterData: boolean;
    createDefaultCalendar: boolean;
    activateSync: boolean;
    activatePWA: boolean;
  };
}

export interface MadrasahMetadata {
  capabilities: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canRestore: boolean;
  };
}
