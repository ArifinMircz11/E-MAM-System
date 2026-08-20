/**
 * PHASE: FIRESTORE LEGACY DATA EXTRACTION
 * PURPOSE: Export raw Firestore collections before Enterprise Data Dictionary V7.8 migration
 * 
 * Master Mapper: teachers -> gtk & students -> students
 */

export interface LegacyTeacher {
  teachersId: string;
  npsn: string;
  namaLengkap: string;
  gender?: string;
  nip?: string;
  active?: boolean;
  userUid?: string;
  phone?: string;
  address?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface LegacyStudent {
  idUnik: string;
  namaLengkap: string;
  nis?: string;
  nisn?: string;
  className?: string;
  rombel?: string;
  tingkatRombel?: string;
  statusAktif?: boolean;
  poinAkumulasi?: number;
  tenantId: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Maps legacy teacher to modern GTK structure
 */
export function mapLegacyTeacher(legacy: LegacyTeacher, tenantId: string = 'default_tenant') {
  const teacherId = legacy.teachersId ? `gtk_${legacy.teachersId.replace(/[^a-zA-Z0-9]/g, '_')}` : `gtk_generated_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: teacherId,
    tenantId: tenantId,
    teachersId: legacy.teachersId || '',
    npsn: legacy.npsn || '12345678',
    namaLengkap: legacy.namaLengkap || 'Unnamed Teacher',
    gelarDepan: '',
    gelarBelakang: '',
    nik: '', // Needs verification
    nip: legacy.nip || '',
    nuptk: '',
    jenisKelamin: legacy.gender === 'P' || legacy.gender === 'Perempuan' ? 'P' : 'L',
    tempatLahir: '',
    tanggalLahir: '',
    agama: 'Islam',
    email: '',
    telepon: legacy.phone || '',
    alamat: legacy.address || '',
    photoURL: '',
    employmentStatus: 'HONORER',
    asnStatus: 'NON_ASN',
    jabatan: 'GURU_MAPEL',
    unitKerja: '',
    tanggalMasuk: '',
    statusAktif: legacy.active !== false,
    version: 1,
    schemaVersion: 1,
    syncStatus: 'synced' as const,
    deleted: false,
    createdAt: formatTimestamp(legacy.createdAt),
    updatedAt: formatTimestamp(legacy.updatedAt || legacy.createdAt),
    createdBy: 'system_migration',
    updatedBy: 'system_migration'
  };
}

/**
 * Maps legacy student to modern Student structure
 */
export function mapLegacyStudent(legacy: LegacyStudent) {
  const studentId = legacy.idUnik ? `std_${legacy.idUnik.replace(/[^a-zA-Z0-9]/g, '_')}` : `std_generated_${Math.random().toString(36).substr(2, 9)}`;
  const normalizedClass = legacy.className || legacy.rombel || legacy.tingkatRombel || 'Unassigned';

  return {
    id: studentId,
    idUnik: legacy.idUnik || '',
    tenantId: legacy.tenantId || 'default_tenant',
    namaLengkap: legacy.namaLengkap || 'Unnamed Student',
    nisn: legacy.nisn || legacy.nis || '',
    nik: '',
    npsn: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    alamat: '',
    noHp: '',
    className: normalizedClass,
    classId: `cls_${normalizedClass.replace(/[^a-zA-Z0-9]/g, '_')}`,
    status: legacy.statusAktif !== false ? 'Aktif' : 'Lulus',
    poinAkumulasi: legacy.poinAkumulasi || 0,
    version: 1,
    schemaVersion: 1,
    syncStatus: 'synced' as const,
    deleted: false,
    createdAt: formatTimestamp(legacy.createdAt),
    updatedAt: formatTimestamp(legacy.updatedAt || legacy.createdAt),
    createdBy: 'system_migration',
    updatedBy: 'system_migration'
  };
}

function formatTimestamp(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts.toDate && typeof ts.toDate === 'function') {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'number') return new Date(ts).toISOString();
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  return new Date().toISOString();
}
