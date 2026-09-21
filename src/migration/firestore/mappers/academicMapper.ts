/**
 * PHASE: FIRESTORE LEGACY DATA EXTRACTION
 * PURPOSE: Export raw Firestore collections before Enterprise Data Dictionary V7.8 migration
 * 
 * Academic Mapper: classes, academic_years, schedules
 */

export interface LegacyClass {
  classId: string;
  name: string;
  level: string;
  academicYear: string;
  teacherId?: string;
  tenantId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface LegacyAcademicYear {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  tenantId: string;
}

/**
 * Maps legacy Class to modern Class structure
 */
export function mapLegacyClass(legacy: LegacyClass, academicYearIdsByName: Record<string, string> = {}) {
  if (!legacy.classId || !legacy.tenantId || !legacy.academicYear) throw new Error('Legacy class requires classId, tenantId and academicYear');
  const cId = `cls_${legacy.classId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const normalizedYearId = academicYearIdsByName[legacy.academicYear] || `ay_${legacy.academicYear.replace(/[^a-zA-Z0-9]/g, '_')}`;

  return {
    id: cId,
    classId: legacy.classId || '',
    tenantId: legacy.tenantId,
    name: legacy.name,
    level: legacy.level,
    academicYearId: normalizedYearId,
    // Legacy academicYear string is intentionally not persisted; academicYearId is canonical
    waliKelasId: legacy.teacherId ? `gtk_${legacy.teacherId.replace(/[^a-zA-Z0-9]/g, '_')}` : null,
    studentCount: 0,
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
 * Maps legacy Academic Year to modern Academic Year structure
 */
export function mapLegacyAcademicYear(legacy: LegacyAcademicYear) {
  if (!legacy.tenantId || !legacy.name) throw new Error('Legacy academic year requires tenantId and name');
  const ayId = legacy.id ? `ay_${legacy.id.replace(/[^a-zA-Z0-9]/g, '_')}` : `ay_${legacy.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

  return {
    id: ayId,
    tenantId: legacy.tenantId,
    name: legacy.name,
    status: legacy.isActive || legacy.status === 'Aktif' ? 'ACTIVE' : 'INACTIVE',
    version: 1,
    schemaVersion: 1,
    syncStatus: 'synced' as const,
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
