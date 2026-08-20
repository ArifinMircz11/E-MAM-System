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
export function mapLegacyClass(legacy: LegacyClass) {
  const cId = legacy.classId ? `cls_${legacy.classId.replace(/[^a-zA-Z0-9]/g, '_')}` : `cls_generated_${Math.random().toString(36).substr(2, 9)}`;
  const normalizedYearId = `ay_${(legacy.academicYear || '2025_2026').replace(/[^a-zA-Z0-9]/g, '_')}`;

  return {
    id: cId,
    classId: legacy.classId || '',
    tenantId: legacy.tenantId || 'default_tenant',
    name: legacy.name || 'Unnamed Class',
    level: legacy.level || 'Unassigned',
    academicYearId: normalizedYearId,
    academicYear: legacy.academicYear || '2025/2026', // Keep for compatibility
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
  const ayId = legacy.id ? `ay_${legacy.id.replace(/[^a-zA-Z0-9]/g, '_')}` : `ay_${legacy.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

  return {
    id: ayId,
    tenantId: legacy.tenantId || 'default_tenant',
    name: legacy.name || '2025/2026',
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
