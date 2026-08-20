/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo, lazy, useRef } from 'react';
import type { ViewState, Student, NewsItem } from '@/types/index';
import { UserRole } from '@/types/index';
import { isMockMode } from '@/services/authService';
import { Loader2 } from '@/shared/Icons';
import { toast } from 'sonner';
import { getNews } from '@/services/newsService';
import { getStudentGenderBreakdown } from '@/services/studentService';
import { useAuthStore } from '@/stores/authStore';
import { useStudentStore } from '@/stores/studentStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useAttendanceDashboardStore } from '@/stores/attendanceStore';
import { useSyncStore } from '@/stores/syncStore';
import { useUserStore } from '@/stores/userStore';
import { useStudentAttendance } from '@/hooks/useStudentAttendance';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { useTenantStore } from '@/hooks/useTenant';
import { parseTimeWithMeta } from '@/utils/attendanceCalculations';
import { useDashboardAnomalies } from '@/hooks/useDashboardAnomalies';
import { AttendanceDetailedFeed } from '@/features/attendance/components/Attendance/AttendanceDetailedFeed';

// Components
import DashboardCards from '@/features/dashboard/components/DashboardCards';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import ActionTile from '@/features/dashboard/components/ActionTile';
import ModalsSection from '@/features/dashboard/components/ModalsSection';

import { roleLabels, getCoreActions } from '@/constants/dashboard';
import { useRenderProfiler } from '@/core/monitoring';

const DrillDownStudentListModal = lazy(() =>
  import('@/features/dashboard/components/DrillDownStudentListModal').then((m) => ({
    default: m.DrillDownStudentListModal,
  })),
);

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  onOpenSidebar?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userRole: UserRole;
  onLogout: () => void;
  unreadNotifCount?: number;
  unreadChatCount?: number;
  pendingLetterCount?: number;
  pendingApprovalCount?: number;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const {
    onNavigate,
    onOpenSidebar,
    userRole,
    isDarkMode,
    onToggleTheme,
    unreadNotifCount = 0,
    unreadChatCount = 0,
    pendingLetterCount = 0,
    pendingApprovalCount = 0,
  } = props;

  // Performance Monitoring Profiler for Dashboard component
  useRenderProfiler('Dashboard', { role: userRole });

  const syncStatus = useSyncStore((state) => state);
  const user = useAuthStore((state) => state.user);
  const roles = useUserStore((state) => state.roles);
  const accountType = useUserStore((state) => state.accountType);
  const referenceId = useUserStore((state) => state.referenceId);

  const userName = user?.displayName || 'Pengguna';
  const userPhoto = user?.photoURL || '';
  const studentsId = (accountType as string) === 'student' ? referenceId : null;

  const isStaff = useMemo(() => {
    const staffRoles = [
      UserRole.ADMIN,
      UserRole.DEVELOPER,
      UserRole.STAF,
      UserRole.KEPALA_MADRASAH,
      UserRole.KEPALA_TU,
      UserRole.WAKAMAD,
      UserRole.GURU,
      UserRole.WALI_KELAS,
      UserRole.GURU_BK,
      UserRole.PUSTAKAWAN,
      UserRole.LABORAN,
      UserRole.GTK,
      UserRole.KURIKULUM,
      UserRole.PIKET,
      UserRole.KESISWAAN,
      UserRole.HUMAS,
      UserRole.PEMBINA_EKSKUL,
    ];
    return roles.some((role) => staffRoles.includes(role as UserRole));
  }, [roles]);

  const { isTeacher, isStudent } = useMemo(
    () => ({
      isTeacher: [UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK, UserRole.GTK].includes(
        userRole,
      ),
      isStudent:
        [UserRole.SISWA, UserRole.KETUA_KELAS].includes(userRole) ||
        roles.includes(UserRole.SISWA) ||
        roles.includes(UserRole.KETUA_KELAS),
    }),
    [roles, userRole],
  );

  // States
  const [showScheduleReminder, setShowScheduleReminder] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [selectedStudentDeepDive, setSelectedStudentDeepDive] = useState<Student | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [activeTab, setActiveTab] = useState<'context' | 'students'>('context');
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [drillDownData, setDrillDownData] = useState<any | null>(null);

  const dashboardNewsRef = useRef<HTMLDivElement>(null);
  const { stats: studentAttendanceStats, attendanceRecords: studentAttendanceRecords } =
    useStudentAttendance(isStudent ? (user?.idUnik || studentsId || undefined) : undefined);
  const { loading: syncLoading } = useDashboardSync(userRole, isStaff);
  const { tenantData } = useTenantStore();

  // Store access
  const stats = useDashboardStore((state) => state.stats);
  const news = useAnalyticsStore((state) => state.dailyNews);
  const setNews = useAnalyticsStore((state) => state.setDailyNews);

  const isBreakdownOpen = useAttendanceDashboardStore((state) => state.isBreakdownOpen);
  const setIsBreakdownOpen = useAttendanceDashboardStore((state) => state.setIsBreakdownOpen);
  const selectedBreakdownClass = useAttendanceDashboardStore(
    (state) => state.selectedBreakdownClass,
  );
  const setSelectedBreakdownClass = useAttendanceDashboardStore(
    (state) => state.setSelectedBreakdownClass,
  );
  const liveAttendance = useAttendanceDashboardStore((state) => state.liveAttendance);
  const todayAttendanceRecords = useAttendanceDashboardStore(
    (state) => state.todayAttendanceRecords,
  );
  const loadingBreakdown = useAttendanceDashboardStore((state) => state.loadingBreakdown);
  const setLoadingBreakdown = useAttendanceDashboardStore((state) => state.setLoadingBreakdown);
  const setMonitoringModalOpen = useAttendanceDashboardStore(
    (state) => state.setMonitoringModalOpen,
  );
  const monitoringModalOpen = useAttendanceDashboardStore((state) => state.monitoringModalOpen);
  const selectedMonitoringTab = useAttendanceDashboardStore((state) => state.selectedMonitoringTab);
  const setSelectedMonitoringTab = useAttendanceDashboardStore(
    (state) => state.setSelectedMonitoringTab,
  );
  const monitoringSearchQuery = useAttendanceDashboardStore((state) => state.monitoringSearchQuery);
  const setMonitoringSearchQuery = useAttendanceDashboardStore(
    (state) => state.setMonitoringSearchQuery,
  );

  const fetchStudents = useStudentStore((state) => state.fetchStudents);
  const students = useStudentStore((state) => state.students);

  // REMOVED: fetchStudents() on startup for staff.
  // We will load data only when drill-down is requested.

  const anomalies = useDashboardAnomalies(
    students,
    todayAttendanceRecords,
    isStaff && students.length > 0,
  );

  const studentAttendanceRate = useMemo(() => {
    if (studentAttendanceStats && studentAttendanceStats.total > 0) {
      const presentCount =
        studentAttendanceStats.hadir +
        studentAttendanceStats.terlambat +
        studentAttendanceStats.haid;
      return Math.min(100, Math.round((presentCount / studentAttendanceStats.total) * 100));
    }
    return isMockMode ? 98 : 0;
  }, [studentAttendanceStats]);

  const studentPerformanceLabel = useMemo(() => {
    if (studentAttendanceStats && studentAttendanceStats.total > 0) {
      const rate = Math.round(
        ((studentAttendanceStats.hadir +
          studentAttendanceStats.terlambat +
          studentAttendanceStats.haid) /
          studentAttendanceStats.total) *
          100,
      );
      if (rate >= 95) return 'Excellent';
      if (rate >= 85) return 'Good';
      if (rate >= 75) return 'Satisfactory';
      return 'Need Improvement';
    }
    return 'Excellent';
  }, [studentAttendanceStats]);

  const sessionSummary = useMemo(() => {
    let activeClass = 'Semua Kelas';
    if (userRole === UserRole.WALI_KELAS) {
      activeClass = user?.walasOfClass || 'Semua Kelas';
    }

    const filteredStudents = students.filter((s) => {
      if (activeClass === 'Semua Kelas') return true;
      const studentClass = s.tingkatRombel || '';
      return studentClass.toLowerCase() === activeClass.toLowerCase();
    });

    const attMap = new Map<string, any>(
      todayAttendanceRecords.map((r) => [String(r.studentsId || r.studentId || ''), r]),
    );

    return ['masuk', 'duha', 'zuhur', 'ashar', 'pulang'].map((sesi) => {
      let hadir = 0;
      let belumScan = 0;
      let haid = 0;
      let terlambat = 0;
      let pulangCepat = 0;
      let sakitIzin = 0;

      filteredStudents.forEach((student: any) => {
        const studentId = String(student.id || student.studentsId || '');
        const att = attMap.get(studentId);

        if (att?.status === 'Sakit' || att?.status === 'Izin') {
          sakitIzin++;
          return;
        }

        const rawTime = att?.[sesi] ? String(att[sesi]) : '';
        const { time, meta } = parseTimeWithMeta(rawTime);
        const isTimeEmpty = !time || time === '--:--' || time.toLowerCase() === 'ts';

        if (isTimeEmpty) {
          if (rawTime.toLowerCase().includes('haid') || att?.status === 'Haid') haid++;
          else belumScan++;
        } else {
          hadir++;
          if (meta === 'Haid' || rawTime.toLowerCase().includes('haid')) haid++;
          if (sesi === 'masuk' && (meta === 'Terlambat' || att?.status === 'Terlambat'))
            terlambat++;
          if (sesi === 'pulang' && (meta === 'Pulang Cepat' || att?.status === 'Pulang Cepat'))
            pulangCepat++;
        }
      });

      return {
        session: sesi,
        hadir,
        belumScan,
        haid,
        terlambat,
        pulangCepat,
        sakitIzin,
      };
    });
  }, [students, todayAttendanceRecords, userRole, user?.walasOfClass]);

  const sessionMonitoringStats = useMemo(() => {
    const masukData = sessionSummary.find((s) => s.session === 'masuk') || {
      hadir: 0,
      terlambat: 0,
    };
    const duhaData = sessionSummary.find((s) => s.session === 'duha') || { hadir: 0 };
    const zuhurData = sessionSummary.find((s) => s.session === 'zuhur') || { hadir: 0 };
    const asharData = sessionSummary.find((s) => s.session === 'ashar') || { hadir: 0 };
    const pulangData = sessionSummary.find((s) => s.session === 'pulang') || {
      hadir: 0,
      pulangCepat: 0,
    };

    return {
      masuk: { total: masukData.hadir, terlambat: masukData.terlambat },
      duha: { total: duhaData.hadir },
      zuhur: { total: zuhurData.hadir },
      ashar: { total: asharData.hadir },
      pulang: { total: pulangData.hadir, pc: pulangData.pulangCepat },
    };
  }, [sessionSummary]);

  const handleSessionCardClick = (session: string, type: string) => {
    let activeClass = 'Semua Kelas';
    if (userRole === UserRole.WALI_KELAS) {
      activeClass = user?.walasOfClass || 'Semua Kelas';
    }

    const filteredStudents = students.filter((s) => {
      if (activeClass === 'Semua Kelas') return true;
      const studentClass = s.tingkatRombel || '';
      return studentClass.toLowerCase() === activeClass.toLowerCase();
    });

    const attMap = new Map<string, any>(
      todayAttendanceRecords.map((r) => [String(r.studentsId || r.studentId || ''), r]),
    );
    const targetStudents: any[] = [];

    filteredStudents.forEach((student: any) => {
      const studentId = String(student.id || student.studentsId || '');
      const att = attMap.get(studentId);
      const rawTime = att?.[session] ? String(att[session]) : '';
      const { time, meta } = parseTimeWithMeta(rawTime);
      const isTimeEmpty = !time || time === '--:--';

      let matches = false;
      let reasonStr = '';

      if (
        type === 'belumScan' &&
        isTimeEmpty &&
        att?.status !== 'Sakit' &&
        att?.status !== 'Izin' &&
        !rawTime.toLowerCase().includes('haid')
      ) {
        matches = true;
        reasonStr = 'Belum Scan ' + session.toUpperCase();
      } else if (type === 'hadir' && !isTimeEmpty) {
        matches = true;
        reasonStr = `Hadir: ${time}`;
      } else if (
        type === 'terlambat' &&
        session === 'masuk' &&
        (meta === 'Terlambat' || att?.status === 'Terlambat')
      ) {
        matches = true;
        reasonStr = `Terlambat: ${time}`;
      } else if (
        type === 'haid' &&
        (rawTime.toLowerCase().includes('haid') || att?.status === 'Haid')
      ) {
        matches = true;
        reasonStr = 'Haid';
      } else if (type === 'sakitIzin' && (att?.status === 'Sakit' || att?.status === 'Izin')) {
        matches = true;
        reasonStr = `Izin: ${att.status}`;
      }

      if (matches) targetStudents.push({ ...student, reason: reasonStr, att: att || null });
    });

    setDrillDownData({
      title: `Sesi ${session.toUpperCase()} - ${type.toUpperCase()}`,
      students: targetStudents,
      type: type.toUpperCase(),
    });
  };

  const scrollDashboardNews = (direction: 'left' | 'right') => {
    if (dashboardNewsRef.current) {
      const scrollAmount = 360;
      dashboardNewsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleFetchBreakdown = async () => {
    setIsBreakdownOpen(true);
    setLoadingBreakdown(true);
    try {
      const data = await getStudentGenderBreakdown();
      setBreakdownData(data);
    } catch (err) {
      toast.error('Gagal memuat rincian siswa');
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const coreActions = useMemo(
    () => getCoreActions(roles as UserRole[], pendingApprovalCount, unreadChatCount),
    [roles, pendingApprovalCount, unreadChatCount],
  );

  const violatingStudentsCount = useMemo(() => {
    return students.filter((s) => (s.metadataAkademik?.totalPoinPelanggaran || 0) > 0).length;
  }, [students]);

  const handleTeacherCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      // In a real app, this would call a service to record teacher check-in
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasCheckedInToday(true);
      toast.success('Berhasil melakukan presensi GTK hari ini');
    } catch (err) {
      toast.error('Gagal melakukan presensi');
    } finally {
      setCheckingIn(false);
    }
  };

  useEffect(() => {
    getNews(true).then(setNews);
    if (isStaff) {
      fetchStudents();
    }
  }, [isStaff, fetchStudents]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden transition-colors">
      {syncStatus.isSyncing && (
        <div className="bg-indigo-600 px-6 py-2 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
            <span className="text-[10px] font-bold text-white tracking-wide uppercase">
              {syncStatus.message || 'Sinkronisasi Data Madrasah...'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-white font-bold text-[10px]">
            {Math.round(syncStatus.progress)}%
          </div>
        </div>
      )}

      <DashboardHeader
        userName={userName}
        userPhoto={userPhoto}
        userRole={userRole}
        roleLabels={roleLabels}
        onNavigate={onNavigate}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        unreadNotifCount={unreadNotifCount}
        unreadChatCount={unreadChatCount}
        pendingLetterCount={pendingLetterCount}
        tenantData={tenantData}
        referenceId={referenceId}
        onOpenSidebar={onOpenSidebar}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar">

        <div className="max-w-7xl mx-auto py-5 md:py-6 space-y-6">
          <DashboardCards
            isTeacher={isTeacher}
            isStudent={isStudent}
            isStaff={isStaff}
            userRole={userRole}
            hasCheckedInToday={hasCheckedInToday}
            checkingIn={checkingIn}
            onTeacherCheckIn={handleTeacherCheckIn}
            onNavigate={onNavigate}
            studentAttendanceRate={studentAttendanceRate}
            studentPerformanceLabel={studentPerformanceLabel}
            liveAttendance={liveAttendance}
            stats={stats}
            totalStudentsWithMisconduct={violatingStudentsCount}
            sessionMonitoringStats={sessionMonitoringStats}
            news={news}
            onSelectNews={setSelectedNews}
            onShowMonitoring={(tab) => {
              setSelectedMonitoringTab(tab as any);
              setMonitoringModalOpen(true);
            }}
            newsContainerRef={dashboardNewsRef}
            scrollCarousel={scrollDashboardNews}
            anomalies={anomalies}
            onSelectDrill={(data) => setDrillDownData(data)}
            sessionSummary={sessionSummary}
            onSelectSessionDrill={handleSessionCardClick}
            tenantData={tenantData}
            studentAttendanceRecords={studentAttendanceRecords}
          />

          {/* TABEL KEHADIRAN PRIBADI SISWA (HARI 1 - 31 SEMUA SESI) */}
          {isStudent && (
            <div className="px-4 sm:px-6 mt-4">
              <AttendanceDetailedFeed records={studentAttendanceRecords} />
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 space-y-6 pb-32">
          <section className="space-y-3">
            <h4 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
              Navigasi utama
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-y-4 gap-x-2">
              {coreActions.map((action) => (
                <ActionTile
                  key={action.label}
                  title={action.label}
                  icon={action.icon}
                  color={action.color}
                  bg={action.bg}
                  badge={(action as any).badge}
                  onClick={() => onNavigate(action.view)}
                />
              ))}
            </div>
          </section>

          {/* Simulation trigger removed on request */}
        </div>
      </main>

      <ModalsSection
        monitoringModalOpen={monitoringModalOpen}
        setMonitoringModalOpen={setMonitoringModalOpen}
        selectedMonitoringTab={selectedMonitoringTab}
        monitoringSearchQuery={monitoringSearchQuery}
        setMonitoringSearchQuery={setMonitoringSearchQuery}
        todayAttendanceRecords={todayAttendanceRecords}
        selectedStudentDetail={selectedStudentDetail}
        setSelectedStudentDetail={setSelectedStudentDetail}
        showScheduleReminder={showScheduleReminder}
        setShowScheduleReminder={setShowScheduleReminder}
        onNavigate={onNavigate}
        selectedNews={selectedNews}
        setSelectedNews={setSelectedNews}
        isBreakdownOpen={isBreakdownOpen}
        setIsBreakdownOpen={setIsBreakdownOpen}
        selectedBreakdownClass={selectedBreakdownClass}
        handleCloseClassView={() => setSelectedBreakdownClass(null)}
        loadingBreakdown={loadingBreakdown}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        breakdownData={breakdownData}
        handleSelectClassWrapper={(cls) => setSelectedBreakdownClass(cls)}
        selectedStudentDeepDive={selectedStudentDeepDive}
        setSelectedStudentDeepDive={setSelectedStudentDeepDive}
        stats={stats}
        liveAttendance={liveAttendance}
      />

      <DrillDownStudentListModal
        isOpen={!!drillDownData}
        drillDownData={drillDownData}
        onClose={() => setDrillDownData(null)}
        onSelectStudent={(s) => {
          setSelectedStudentDetail({ ...s, status: s.att?.status || 'Alpha' });
          setMonitoringModalOpen(true);
        }}
      />
    </div>
  );
};

export default Dashboard;
