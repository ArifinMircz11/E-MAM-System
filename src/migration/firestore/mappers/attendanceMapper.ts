/**
 * PHASE: FIRESTORE LEGACY DATA EXTRACTION
 * PURPOSE: Export raw Firestore collections before Enterprise Data Dictionary V7.8 migration
 * 
 * Attendance Mapper: attendance
 */

export interface LegacyAttendance {
  id?: string;
  tanggal: string;
  studentId: string; // usually legacy student idUnik
  classId: string;   // legacy class id string
  status: string;    // Sakit, Hadir, Izin, Alpha, dll
  tenantId: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Maps legacy attendance to modern attendance_daily structure
 */
export function mapLegacyAttendance(legacy: LegacyAttendance) {
  const attendanceId = legacy.id ? `att_${legacy.id}` : `att_generated_${Math.random().toString(36).substr(2, 9)}`;
  
  // Resolve PK associations mapping
  const studentId = legacy.studentId ? `std_${legacy.studentId.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const classId = legacy.classId ? `cls_${legacy.classId.replace(/[^a-zA-Z0-9]/g, '_')}` : '';

  return {
    id: attendanceId,
    tenantId: legacy.tenantId || 'default_tenant',
    date: legacy.tanggal || new Date().toISOString().split('T')[0],
    studentId: studentId,
    classId: classId,
    status: mapAttendanceStatus(legacy.status),
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

function mapAttendanceStatus(status: string): string {
  const validStatuses = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Haid', 'Terlambat', 'TS', 'PC'];
  const capitalized = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Hadir';
  if (validStatuses.includes(capitalized)) return capitalized;
  if (capitalized === 'Present') return 'Hadir';
  if (capitalized === 'Sick') return 'Sakit';
  if (capitalized === 'Permit') return 'Izin';
  if (capitalized === 'Absent') return 'Alpha';
  return 'Hadir'; // Default fallback
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
