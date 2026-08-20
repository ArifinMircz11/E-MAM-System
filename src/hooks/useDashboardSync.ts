import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { isMockMode } from '@/services/authService';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { getDashboardStats } from '@/services/dashboardService';
import { getSecurityContext } from '@/core/security/contextHelper';
import { useAuthStore } from '@/stores/authStore';
import { useStudentStore } from '@/stores/studentStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAttendanceDashboardStore } from '@/stores/attendanceStore';
import { useUserStore } from '@/stores/userStore';
import type { UserRole } from '@/types';

export const useDashboardSync = (userRole: UserRole, isStaff: boolean) => {
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const tenantId = useUserStore((state) => state.tenantId) || '30315537';
  const studentsId = user?.studentsId || user?.idUnik;

  const setStats = useDashboardStore((state) => state.setStats);
  const setLiveAttendance = useAttendanceDashboardStore((state) => state.setLiveAttendance);
  const setAttendanceStatus = useAttendanceDashboardStore((state) => state.setAttendanceStatus);
  const setTodayAttendanceRecords = useAttendanceDashboardStore(
    (state) => state.setTodayAttendanceRecords,
  );
  const selectedClass = useStudentStore((state) => state.selectedClass);
  const selectedClassName = selectedClass?.name;

  useEffect(() => {
    const syncDashboard = async () => {
      if (isMockMode) {
        setLoading(false);
        return;
      }
      if (!user || !tenantId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const today = format(new Date(), 'yyyy-MM-dd');

        // 1. Fetch System Stats (Optimized Repository Pattern)
        const dashboardData = await getDashboardStats(tenantId);
        const dailyStats = await attendanceRepository.getAttendanceSummary(
          tenantId,
          today,
        );

        // 2. Apply Stats to Store
        setStats((prev) => ({
          ...prev,
          totalStudents: dashboardData?.totalStudents || prev.totalStudents,
          totalTeachers: dashboardData?.totalTeachers || prev.totalTeachers,
          totalGTK: dashboardData?.totalGTK || prev.totalGTK,
          totalClasses: dashboardData?.totalClasses || prev.totalClasses,
          presentToday: dailyStats?.totalHadir || dailyStats?.presentCount || 0,
          totalMisconductPointsCount:
            dailyStats?.totalPoinPelanggaran || dailyStats?.totalMisconduct || 0,
          totalAchievementPointsCount:
            dailyStats?.totalPoinPrestasi || dailyStats?.totalAchievement || 0,
          lateToday: dailyStats?.perType?.Terlambat || 0,
          permittedToday: (dailyStats?.perType?.Izin || 0) + (dailyStats?.perType?.Sakit || 0),
          haidToday: dailyStats?.perType?.Haid || 0,
          isStale: dashboardData?.isStale || !dailyStats || false,
        }));

        setLiveAttendance((prev) => ({
          ...prev,
          studentPresent: dailyStats?.totalHadir || dailyStats?.presentCount || 0,
          teacherPresent: dailyStats?.totalGuruHadir || dailyStats?.teacherCount || 0,
          studentTotal: dashboardData?.totalStudents || prev.studentTotal,
          teacherTotal: dashboardData?.totalTeachers || prev.teacherTotal,
        }));

        // 3. User Specific Stats (Student View)
        if (studentsId) {
          const studentAtt = await attendanceRepository.getAttendanceByStudent(tenantId, studentsId);
          if (studentAtt && studentAtt.length > 0) {
            const sorted = [...studentAtt].sort((a, b) =>
              (b.tanggal || '').localeCompare(a.tanggal || ''),
            );
            if (sorted[0].tanggal === today) {
              setAttendanceStatus(sorted[0].status || null);
            }
          }
        }

        // 4. Staff Specific Stats (Teacher/Admin View)
        if (isStaff) {
          // Optimization: Call repository which handles Dexie + Quota limiting
          const records = await attendanceRepository.getTodayAttendance(tenantId, today);
          setTodayAttendanceRecords(records);
        }
      } catch (err) {
        console.warn('[useDashboardSync] Refresh failed (Safe Mode active):', err);
      } finally {
        setLoading(false);
      }
    };

    syncDashboard();
  }, [
    userRole,
    isMockMode,
    studentsId,
    isStaff,
    selectedClassName,
    tenantId,
    setStats,
    setLiveAttendance,
    setAttendanceStatus,
    setTodayAttendanceRecords,
  ]);

  return { loading };
};
