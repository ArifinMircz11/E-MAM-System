import { db } from '@/database/db';
import { TenantContext } from '@/core/context/TenantContext';

export const getDashboardSummary = async (tenantId?: string) => {
  const activeTenant = tenantId || TenantContext.getTenantId();
  const studentsCount = await db.table('students').where('tenantId').equals(activeTenant).filter((s: any) => s.deleted !== true).count();
  const teachersCount = await db.table('teachers').where('tenantId').equals(activeTenant).filter((t: any) => t.deleted !== true).count();
  return {
    totalStudents: studentsCount,
    totalTeachers: teachersCount,
    attendanceRate: null,
    violationsCount: null,
  };
};

export const getDashboardStats = async (tenantId?: string) => {
  const activeTenant = tenantId || TenantContext.getTenantId();
  const [studentsCount, teachersCount, classesCount] = await Promise.all([
    db.table('students').where('tenantId').equals(activeTenant).filter((s: any) => s.deleted !== true).count(),
    db.table('teachers').where('tenantId').equals(activeTenant).filter((t: any) => t.deleted !== true).count(),
    db.table('classes').where('tenantId').equals(activeTenant).filter((c: any) => c.deleted !== true).count(),
  ]);
  return {
    totalStudents: studentsCount,
    totalTeachers: teachersCount,
    totalGTK: teachersCount,
    totalClasses: classesCount,
    isStale: false,
  };
};

export const dashboardService = {
  getDashboardSummary,
  getDashboardStats,
};
