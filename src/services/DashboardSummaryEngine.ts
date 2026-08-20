import { getSecurityContext } from '@/core/security/contextHelper';
import type { DashboardSummaryEntity } from '@/repositories/DashboardSummaryRepository';
import { dashboardSummaryRepository } from '@/repositories/DashboardSummaryRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { classRepository } from '@/repositories/classRepository';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { pointRepository } from '@/repositories/PointRepository';
import { SyncStatus } from '@/domain/entities/base';

export class DashboardSummaryEngine {
  static async getSummary(forceRecalculate = false): Promise<DashboardSummaryEntity> {
    const context = getSecurityContext();
    const tenantId = context.tenantId || 'default-tenant';

    if (!forceRecalculate) {
      const existing = await dashboardSummaryRepository.findById(tenantId, tenantId);
      if (existing) {
        return existing;
      }
    }

    return await DashboardSummaryEngine.recalculate();
  }

  static async recalculate(): Promise<DashboardSummaryEntity> {
    const context = getSecurityContext();
    const targetTenantId = context.tenantId || 'default-tenant';

    try {
      const allStudents = await studentRepository.findAll(targetTenantId);
      const totalStudents = allStudents.length;
      
      const allTeachers = await teacherRepository.findAll(targetTenantId);
      const totalTeachers = allTeachers.length;

      const allClasses = await classRepository.findAll(targetTenantId);
      const totalClasses = allClasses.length;

      const allAttendance = await attendanceRepository.findAll(targetTenantId);
      const allPoin = await pointRepository.findAll(targetTenantId);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendance = allAttendance.filter((a: any) => a.date?.startsWith(todayStr));
      const presentToday = todayAttendance.filter((a: any) => a.statusGlobal === 'Hadir' || a.status === 'Hadir').length;
      
      const attendanceRateToday = totalStudents > 0 && todayAttendance.length > 0 
        ? Math.round((presentToday / Math.min(totalStudents, todayAttendance.length || totalStudents)) * 100) 
        : 95;

      const totalViolations = allPoin.filter((p: any) => p.type === 'Pelanggaran' || p.category === 'Pelanggaran' || p.kategori === 'Pelanggaran').length;
      const totalAchievements = allPoin.filter((p: any) => p.type === 'Prestasi' || p.category === 'Prestasi' || p.kategori === 'Prestasi').length;

      const summaryData: DashboardSummaryEntity = {
        id: targetTenantId,
        tenantId: targetTenantId,
        totalStudents,
        totalTeachers,
        totalClasses,
        attendanceRateToday: Math.min(100, Math.max(0, attendanceRateToday)),
        totalViolations,
        totalAchievements,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'local_only',
        deleted: false,
        version: 1,
      };

      await dashboardSummaryRepository.update(summaryData);

      return summaryData;
    } catch (err) {
      console.error('[DashboardSummaryEngine] Failed to recalculate summary from Dexie:', err);
      return {
        id: targetTenantId,
        tenantId: targetTenantId,
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        attendanceRateToday: 0,
        totalViolations: 0,
        totalAchievements: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'local_only',
        deleted: false,
        version: 1,
      };
    }
  }
}
