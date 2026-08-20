import type { AppEntity } from './base';
import type { AsnStatus, EmploymentStatus } from '@/types/roles';

/**
 * Teacher Entity - Domain representation of a teacher.
 * Version: 3.0 (Enterprise Standard)
 */
export interface Teacher extends AppEntity {
  // --- Identity ---
  idUnik: string;        // Mandatory Primary Identity (Document ID)
  uid?: string;          // Firebase Auth UID
  npsn: string;          // Tenant Identity
  
  // --- Personal Data ---
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  nik: string;           // Mandatory NIK (16 digit)
  nip?: string;          // Mandatory if ASN/PPPK
  nuptk?: string;
  jenisKelamin: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  agama?: string;
  
  // --- Contact ---
  email?: string;
  telepon?: string;
  alamat?: string;
  photoURL?: string;
  
  // --- Employment ---
  employmentStatus: EmploymentStatus;
  asnStatus: AsnStatus;
  jabatan: string;
  unitKerja?: string;
  tanggalMasuk?: string;
  statusAktif: boolean;
  
  // --- Legacy & Extended Data (Optional/Any) ---
  teacherType?: string;
  position?: string;
  sistemJangkar?: any;
  jabatanDanStatus?: any;
  penugasanAkademik?: any;
  kontak?: any;
  
  // Backward Compatibility (To be deprecated)
  teachersId?: string;
  userUid?: string;
}
