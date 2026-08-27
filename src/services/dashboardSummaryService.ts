import { dashboardSummaryRepository, type DashboardSummaryEntity } from '@/repositories/DashboardSummaryRepository';
import { getCurrentUser } from '@/services/authService';

export interface KemenagOrganizationSummary {
  madrasah: number;
  students: number;
  teachers: number;
  classes: number;
  attendanceRateToday: number;
  violations: number;
  achievements: number;
  syncedMadrasah: number;
  pendingMadrasah: number;
  errorMadrasah: number;
  updatedAt: number | null;
}

const EMPTY: KemenagOrganizationSummary = {
  madrasah: 0,
  students: 0,
  teachers: 0,
  classes: 0,
  attendanceRateToday: 0,
  violations: 0,
  achievements: 0,
  syncedMadrasah: 0,
  pendingMadrasah: 0,
  errorMadrasah: 0,
  updatedAt: null,
};

/**
 * Read-only organization dashboard use case.
 * UI never touches Dexie/Firestore; this service reads the tenant-scoped
 * dashboard summary repository. Firestore refresh remains owned by SyncEngine.
 */
export async function getKemenagOrganizationSummary(): Promise<KemenagOrganizationSummary> {
  const user = getCurrentUser();
  const tenantId = user?.tenantId;
  if (!tenantId) return EMPTY;

  const rows: DashboardSummaryEntity[] = await dashboardSummaryRepository.findAll(tenantId);
  if (!rows.length) return EMPTY;

  const totals = rows.reduce(
    (acc, row) => ({
      students: acc.students + (Number(row.totalStudents) || 0),
      teachers: acc.teachers + (Number(row.totalTeachers) || 0),
      classes: acc.classes + (Number(row.totalClasses) || 0),
      attendanceSum: acc.attendanceSum + (Number(row.attendanceRateToday) || 0),
      violations: acc.violations + (Number(row.totalViolations) || 0),
      achievements: acc.achievements + (Number(row.totalAchievements) || 0),
      synced: acc.synced + (row.syncStatus === 'synced' ? 1 : 0),
      pending: acc.pending + (row.syncStatus === 'pending' || row.syncStatus === 'local_only' ? 1 : 0),
      errors: acc.errors + (row.syncStatus === 'error' ? 1 : 0),
      updatedAt: Math.max(acc.updatedAt, Number(row.updatedAt) || 0),
    }),
    { students: 0, teachers: 0, classes: 0, attendanceSum: 0, violations: 0, achievements: 0, synced: 0, pending: 0, errors: 0, updatedAt: 0 },
  );

  return {
    madrasah: rows.length,
    students: totals.students,
    teachers: totals.teachers,
    classes: totals.classes,
    attendanceRateToday: Math.round((totals.attendanceSum / rows.length) * 10) / 10,
    violations: totals.violations,
    achievements: totals.achievements,
    syncedMadrasah: totals.synced,
    pendingMadrasah: totals.pending,
    errorMadrasah: totals.errors,
    updatedAt: totals.updatedAt || null,
  };
}
