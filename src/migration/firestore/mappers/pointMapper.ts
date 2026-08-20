/**
 * PHASE: FIRESTORE LEGACY DATA EXTRACTION
 * PURPOSE: Export raw Firestore collections before Enterprise Data Dictionary V7.8 migration
 * 
 * Point Mapper: poin, points, point_records, point_transactions
 */

export interface LegacyPointRecord {
  id?: string;
  studentId: string; // idUnik of student
  points: number;
  type: string; // legacy type, usually "Penghargaan" or "Pelanggaran" or "+" or "-"
  category?: string;
  description?: string;
  tenantId: string;
  createdAt?: any;
}

/**
 * Maps legacy points record to modern point_transactions structure
 */
export function mapLegacyPoint(legacy: LegacyPointRecord) {
  const transactionId = legacy.id ? `pt_${legacy.id}` : `pt_generated_${Math.random().toString(36).substr(2, 9)}`;
  const mappedStudentId = legacy.studentId ? `std_${legacy.studentId.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  
  const poin = Math.abs(legacy.points || 0);
  let jenis = 'Penghargaan';
  
  if (legacy.type === 'Pelanggaran' || legacy.type === '-' || (legacy.points && legacy.points < 0)) {
    jenis = 'Pelanggaran';
  }

  return {
    id: transactionId,
    tenantId: legacy.tenantId || 'default_tenant',
    studentId: mappedStudentId,
    categoryId: legacy.category ? `cat_${legacy.category.replace(/[^a-zA-Z0-9]/g, '_')}` : 'cat_general_discipline',
    poin: poin,
    jenis: jenis,
    keterangan: legacy.description || 'Pencatatan mutasi poin migrasi',
    tanggal: formatTimestamp(legacy.createdAt).split('T')[0],
    version: 1,
    schemaVersion: 1,
    syncStatus: 'synced' as const,
    deleted: false,
    createdAt: formatTimestamp(legacy.createdAt),
    updatedAt: formatTimestamp(legacy.createdAt),
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
