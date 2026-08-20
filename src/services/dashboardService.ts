// src/services/dashboardService.ts
import { dashboardSummaryRepository } from '@/repositories/DashboardSummaryRepository';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGTK: number;
  totalClasses: number;
  lastUpdated: string;
  isStale?: boolean;
}

export interface DailyStats {
  presentCount: number;
  teacherCount: number;
  totalMisconduct: number;
  totalAchievement: number;
  lateToday: number;
  permittedToday: number;
  haidToday: number;
  isStale?: boolean;
}

// Memory cache to prevent aggressive refetching within the same session
let cachedStats: DashboardStats | null = null;
let lastStatsFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes

export const getDashboardStats = async (
  tenantId: string,
  forceRefresh = false,
): Promise<DashboardStats | null> => {
  const actualTenantId = tenantId;
  const now = Date.now();

  if (cachedStats && !forceRefresh && now - lastStatsFetch < CACHE_TTL) {
    return { ...cachedStats, isStale: false };
  }

  try {
    const summaryData = await dashboardSummaryRepository.findById(`dashboard_stats_${actualTenantId}`, actualTenantId);

    if (summaryData) {
      cachedStats = {
        totalStudents: summaryData.totalStudents || 0,
        totalTeachers: summaryData.totalTeachers || 0,
        totalGTK: (summaryData as any).totalGTK || 0,
        totalClasses: summaryData.totalClasses || 0,
        lastUpdated: new Date().toISOString(),
        isStale: false,
      };
      lastStatsFetch = now;
      return cachedStats;
    }

    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalGTK: 0,
      totalClasses: 0,
      lastUpdated: new Date().toISOString(),
      isStale: true,
    };
  } catch (error) {
    console.error('[DashboardService] Failed to fetch system stats:', error);
    return cachedStats ? { ...cachedStats, isStale: true } : null;
  }
};

export const getDailyDashboardStats = async (
  tenantId: string,
  forceRefresh = false,
): Promise<DailyStats | null> => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const dailyStatsId = `${today}_${tenantId}`;
    const data = await dashboardSummaryRepository.findById(dailyStatsId, tenantId) as any;

    if (data) {
      return {
        presentCount: data.totalHadir || 0,
        teacherCount: data.totalGuruHadir || 0,
        totalMisconduct: data.totalPoinPelanggaran || 0,
        totalAchievement: data.totalPoinPrestasi || 0,
        lateToday: data.perType?.Terlambat || 0,
        permittedToday: (data.perType?.Izin || 0) + (data.perType?.Sakit || 0),
        haidToday: data.perType?.Haid || 0,
        isStale: false,
      };
    }

    return {
      presentCount: 0,
      teacherCount: 0,
      totalMisconduct: 0,
      totalAchievement: 0,
      lateToday: 0,
      permittedToday: 0,
      haidToday: 0,
      isStale: true,
    };
  } catch (error) {
    console.error('[DashboardService] Failed to fetch daily stats:', error);
    return null;
  }
};
