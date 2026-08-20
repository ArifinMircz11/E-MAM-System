import React, { Suspense } from 'react';
import { PendingActivationView } from '@/features/auth/PendingActivationView';
import { ViewState, UserRole, ROLE_GROUPS, STAFF_ABOVE, ADMIN_DEV_ONLY, getAllAuthenticated } from '@/types/roles';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { Loader2 } from '@/shared/Icons';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import { RouteGuard } from '@/core/authorization/route-guard';
import {
  Login,
  Dashboard,
  DataSubmissionForm,
  AllFeatures,
  ClassList,
  Schedule,
  Profile,
  Reports,
  Messages,
  Advisor,
  Settings,
  AttendanceHistory,
  PersonalAttendance,
  QRScanner,
  TeachingJournal,
  StudentData,
  AlumniData,
  MutationData,
  TeacherData,
  TeacherAttendanceView,
  IDCard,
  Letters,
  DeveloperConsole,
  About,
  MadrasahInfo,
  PointsView,
  Events,
  AcademicYear,
  Semester,
  ClassPromotion,
  News,
  GenericView,
  NotificationCenter,
  AccountApproval,
  ParentPortal,
  SystemDocumentation,
  DashboardBK,
  Archives,
  NotificationLogs,
  TeacherAccountManagement,
  PointCategorySettings,
  TenantSettings,
  StudentDashboardPage,
  UserManagement,
  OrganizationManagement,
  LoginHistory,
  SystemAuditMain,
  CollectionExplorerPage,
  SupportModule,
  MadrasahMaster,
  GuestDashboard,
  KanwilDashboardView,
  KanwilSatuanKerjaView,
  KanwilWorkspace,
  KemenagHub,
  DevTabOverview,
  DevTabBroadcast,
  DevTabFeatureToggles,
  DevTabMasterVersion,
  DevTabSchemaEngine,
  DevTabTenantManagement,
  DevTabIntegrationTest,
  DevTabUserControl,
  DevTabAttendanceControl,
  DevTabDummyEngine,
  DevTabPointEngine,
  DevTabAuditTest,
  DevTabFirestoreGov,
  DevTabManajemenMadrasah,
  DevTabManajemenOrganisasi,
  DevTabManajemenUser,
  DevTabArchitecture,
  DevFeatureGrid,
} from './ViewRegistry';

import { ViewLoader } from '@/components/ui/ViewLoader';
import { useRenderProfiler } from '@/core/monitoring';

interface ViewRendererProps {
  currentView: ViewState;
  handleBack: () => void;
  handleNavigate: (view: ViewState) => void;
  onOpenSidebar: () => void;
  handleLogout: () => Promise<void>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  unreadNotifCount: number;
  unreadChatCount: number;
  pendingLetterCount: number;
  pendingApprovalCount: number;
  handleLoginSuccess: (role: UserRole) => void;
  handleImpersonate: (role: UserRole, name: string, sid?: string) => void;
  user: CanonicalUser | null;
}

export const ViewRenderer: React.FC<ViewRendererProps> = ({
  currentView,
  handleBack,
  handleNavigate,
  onOpenSidebar,
  handleLogout,
  isDarkMode,
  toggleTheme,
  unreadNotifCount,
  unreadChatCount,
  pendingLetterCount,
  pendingApprovalCount,
  handleLoginSuccess,
  handleImpersonate,
  user,
}) => {
  // Performance Monitoring Profiler for ViewRenderer
  useRenderProfiler('ViewRenderer', { view: currentView });

  // Observability & RCA View Transition Logger
  React.useEffect(() => {
    /* 
    console.debug(`[ViewRenderer RCA] Transitioned to ViewState: ${currentView}`, {
      timestamp: new Date().toISOString(),
      userUid: user?.uid || 'guest',
    });
    */
  }, [currentView, user]);
  const roles = useUserStore((state) => state.roles);
  const isLoaded = useUserStore((state) => state.isLoaded);
  const currentCollection = useUIStore((state) => state.currentCollection);
  const assignment = useUserStore((state) => state.assignment);
  const role = useUserStore((state) => state.role);

  const metadata = {
    studentsId: user?.studentsId || null,
    teachersId: user?.teachersId || null,
    classId: assignment?.classId || null,
  };

  if (user && !isLoaded && currentView !== ViewState.LOGIN) {
    return <ViewLoader />;
  }

  const primaryRole = useUserStore.getState().role || role;
  const actualRole = (primaryRole as UserRole) || (roles.length > 0 ? (roles[0] as UserRole) : UserRole.TAMU);
  const isDeveloper = roles.includes(UserRole.DEVELOPER);
  const allAuthenticated = getAllAuthenticated(isDeveloper);
  const scannerAllowed = [...STAFF_ABOVE];

  const protectedView = (allowedRoles: UserRole[], component: React.ReactNode) => {
    const fallback = isLoaded ? (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-rose-500/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl font-extrabold">
            🚫
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Akses Fitur Ditolak</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Security Context menolak akses. Anda tidak memiliki izin untuk membuka halaman ini.
          </p>
          <button
            onClick={() => handleNavigate(ViewState.DASHBOARD)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    ) : null;

    return (
      <RouteGuard view={currentView} legacyAllowedRoles={allowedRoles as any[]} fallback={fallback}>
        <React.Fragment key={`protected-${currentView}`}>
          {component}
        </React.Fragment>
      </RouteGuard>
    );
  };

  switch (currentView) {
    case ViewState.LOGIN:
      return (
        <Suspense fallback={<ViewLoader />}>
          <Login
            onLogin={(role: any) => handleLoginSuccess(role)}
            onNavigate={handleNavigate}
          />
        </Suspense>
      );

    case ViewState.PUBLIC_SERVICES:
      return (
        <Suspense fallback={<ViewLoader />}>
          <Letters
            onBack={handleBack}
            userRole={UserRole.SISWA}
            isPublic={true}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>
      );

    case ViewState.DASHBOARD:
      if (roles.includes(UserRole.SISWA) || roles.includes(UserRole.KETUA_KELAS)) {
        return (
          <Suspense fallback={<ViewLoader />}>
            <StudentDashboardPage
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          </Suspense>
        );
      }
      if (roles.includes(UserRole.ORANG_TUA)) {
        return (
          <Suspense fallback={<ViewLoader />}>
            <ParentPortal
              onBack={handleBack}
              user={{
                uid: user?.uid || '',
                displayName: user?.displayName || user?.profile?.displayName || '',
                email: user?.email || user?.profile?.email || '',
                role: actualRole,
                studentsId: metadata.studentsId,
              }}
              onOpenSidebar={onOpenSidebar}
            />
          </Suspense>
        );
      }
      if (roles.includes(UserRole.GURU_BK)) {
        return (
          <Suspense fallback={<ViewLoader />}>
            <DashboardBK
              onNavigate={handleNavigate}
              onBack={handleBack}
              onOpenSidebar={onOpenSidebar}
            />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<ViewLoader />}>
          <Dashboard
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            userRole={actualRole}
            onLogout={handleLogout}
            unreadNotifCount={unreadNotifCount}
            unreadChatCount={unreadChatCount}
            pendingLetterCount={pendingLetterCount}
            pendingApprovalCount={pendingApprovalCount}
          />
        </Suspense>
      );

    case ViewState.ADVISOR:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <Advisor onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.MESSAGES:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <Messages onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.PROFILE:
      return (
        <Suspense fallback={<ViewLoader />}>
          <Profile
            onBack={handleBack}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>
      );

    case ViewState.SCHEDULE:
      return (
        <Suspense fallback={<ViewLoader />}>
          <Schedule
            onBack={handleBack}
            userRole={actualRole}
            studentsId={metadata.studentsId}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>
      );

    case ViewState.NEWS:
      return (
        <Suspense fallback={<ViewLoader />}>
          <News onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>
      );

    case ViewState.ABOUT:
      return (
        <Suspense fallback={<ViewLoader />}>
          <About
            onBack={handleBack}
            userRole={actualRole}
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>
      );

    case ViewState.ID_CARD:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <IDCard onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.MADRASAH_INFO:
      return (
        <Suspense fallback={<ViewLoader />}>
          <MadrasahInfo onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>
      );

    case ViewState.ACCOUNT_APPROVAL:
      return protectedView(
        ROLE_GROUPS.MANAGEMENT,
        <Suspense fallback={<ViewLoader />}>
          <AccountApproval
            onBack={handleBack}
            initialTab="Persetujuan Akun"
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.DATA_APPROVAL:
      return protectedView(
        ROLE_GROUPS.MANAGEMENT,
        <Suspense fallback={<ViewLoader />}>
          <AccountApproval
            onBack={handleBack}
            initialTab="Persetujuan Data"
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.DATA_SUBMISSION:
      return (
        <Suspense fallback={<ViewLoader />}>
          <DataSubmissionForm onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>
      );

    case ViewState.PARENT_PORTAL:
      return protectedView(
        [UserRole.ORANG_TUA, UserRole.ADMIN, UserRole.DEVELOPER],
        <Suspense fallback={<ViewLoader />}>
          <ParentPortal
            onBack={handleBack}
            user={{
              uid: user?.uid || '',
              displayName: user?.displayName || user?.profile?.displayName || '',
              email: user?.email || user?.profile?.email || '',
              role: actualRole,
              studentsId: metadata.studentsId,
            }}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.POINTS:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <PointsView
            onBack={handleBack}
            onNavigate={handleNavigate}
            userRole={actualRole}
            studentsId={metadata.studentsId}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.DASHBOARD_BK:
      return protectedView(
        [
          UserRole.GURU_BK,
          UserRole.ADMIN,
          UserRole.DEVELOPER,
          UserRole.WAKAMAD,
          UserRole.KEPALA_MADRASAH,
        ],
        <Suspense fallback={<ViewLoader />}>
          <DashboardBK
            onBack={handleBack}
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.NOTIFICATIONS:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <NotificationCenter
            onBack={handleBack}
            userRole={actualRole}
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.EVENTS:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <Events
            onBack={handleBack}
            userRole={actualRole}
            studentsId={metadata.studentsId}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.ARCHIVES:
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <Archives
            onBack={handleBack}
            userData={{
              uid: user?.uid || '',
              displayName: user?.displayName || user?.profile?.displayName || '',
              email: '',
              role: actualRole,
              teachersId: metadata.teachersId,
            }}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.LETTERS:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <Letters onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.ATTENDANCE_HISTORY:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <AttendanceHistory
            onBack={handleBack}
            onNavigate={handleNavigate}
            userRole={actualRole}
            studentsId={metadata.studentsId}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.PERSONAL_ATTENDANCE:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <PersonalAttendance
            onBack={handleBack}
            onNavigate={handleNavigate}
            userRole={actualRole}
            studentsId={metadata.studentsId}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.PUSAKA:
      return (
        <GenericView
          title="Pusaka Kemenag"
          onBack={handleBack}
          onOpenSidebar={onOpenSidebar}
          description="Integrasi resmi dengan Pusaka Super Apps RI."
        />
      );

    case ViewState.CLASSES:
      // console.log('[RCA Audit] ViewRenderer: Rendering ViewState.CLASSES, role:', actualRole);
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <ClassList
            onBack={handleBack}
            onNavigate={handleNavigate}
            userRole={actualRole}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.SCANNER:
      return protectedView(
        scannerAllowed,
        <Suspense fallback={<ViewLoader />}>
          <QRScanner onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.REPORTS:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <Reports
            onBack={handleBack}
            onNavigate={handleNavigate}
            userRole={actualRole}
            studentsId={metadata.studentsId}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.JOURNAL:
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <TeachingJournal onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.STUDENTS:
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <StudentData onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.ALUMNI:
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <AlumniData onBack={handleBack} userRole={UserRole.ADMIN} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.MUTATION:
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <MutationData onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.TEACHERS:
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <TeacherData onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.TEACHER_ATTENDANCE:
      return protectedView(
        STAFF_ABOVE,
        <Suspense fallback={<ViewLoader />}>
          <TeacherAttendanceView
            onBack={handleBack}
            userRole={actualRole}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.ACADEMIC_YEAR:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <AcademicYear onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.SEMESTER:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <Semester onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.PROMOTION:
      return protectedView(
        ADMIN_DEV_ONLY,
        <Suspense fallback={<ViewLoader />}>
          <ClassPromotion onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.DEV_DASHBOARD:
    case ViewState.DEVELOPER:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabOverview onNavigate={handleNavigate} />
        </DeveloperConsole>,
      );

    case ViewState.DEV_BROADCAST:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabBroadcast />
        </DeveloperConsole>,
      );

    case ViewState.DEV_FEATURES:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabFeatureToggles />
        </DeveloperConsole>,
      );

    case ViewState.DEV_SYNC:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabMasterVersion />
        </DeveloperConsole>,
      );

    case ViewState.DEV_SCHEMA_ENGINE:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabSchemaEngine />
        </DeveloperConsole>,
      );

    case ViewState.DEV_INTEGRATION_TEST:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabIntegrationTest />
        </DeveloperConsole>,
      );

    case ViewState.DEV_USERS:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabUserControl />
        </DeveloperConsole>,
      );

    case ViewState.DEV_ATTENDANCE_CONTROL:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabAttendanceControl />
        </DeveloperConsole>,
      );

    case ViewState.DEV_DUMMY_ENGINE:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabDummyEngine />
        </DeveloperConsole>,
      );

    case ViewState.DEV_POINT_ENGINE:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabPointEngine />
        </DeveloperConsole>,
      );

    case ViewState.DEV_AUDIT_LOG:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabAuditTest />
        </DeveloperConsole>,
      );

    case ViewState.DEV_FIRESTORE_GOV:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabFirestoreGov />
        </DeveloperConsole>,
      );

    case ViewState.DEV_MADRASAH:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabManajemenMadrasah />
        </DeveloperConsole>,
      );

    case ViewState.DEV_INSTITUTIONS:
    case ViewState.DEV_WORK_UNITS:
    case ViewState.DEV_EDUCATION_LEVELS:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabManajemenOrganisasi />
        </DeveloperConsole>,
      );

    case ViewState.DEV_ASSIGNMENTS:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabManajemenUser />
        </DeveloperConsole>,
      );

    case ViewState.DEV_ARCHITECTURE:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabArchitecture />
        </DeveloperConsole>,
      );

    case ViewState.DEV_GRID:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevFeatureGrid onNavigate={handleNavigate} />
        </DeveloperConsole>,
      );

    case ViewState.DEV_ROLES:
    case ViewState.DEV_PERMISSIONS:
    case ViewState.DEV_SECURITY:
    case ViewState.DEV_SYSTEM_SETTINGS:
      return protectedView(
        [UserRole.DEVELOPER],
        <DeveloperConsole currentView={currentView} onNavigate={handleNavigate} onBack={handleBack}>
          <DevTabFeatureToggles />
        </DeveloperConsole>,
      );

    case ViewState.TEACHER_MANAGEMENT:
      return protectedView(
        ADMIN_DEV_ONLY,
        <Suspense fallback={<ViewLoader />}>
          <TeacherAccountManagement onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.NOTIFICATION_LOGS:
      return protectedView(
        ADMIN_DEV_ONLY,
        <Suspense fallback={<ViewLoader />}>
          <NotificationLogs onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.SYSTEM_DOCUMENTATION:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <SystemDocumentation
            onBack={handleBack}
            userRole={actualRole}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>,
      );

    case ViewState.SETTINGS:
      return (
        <Suspense fallback={<ViewLoader />}>
          <Settings
            onBack={handleBack}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            userRole={actualRole}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>
      );

    case ViewState.POINT_CATEGORIES:
      return protectedView(
        [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KESISWAAN],
        <Suspense fallback={<ViewLoader />}>
          <PointCategorySettings onBack={handleBack} userRole={actualRole} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.TENANT_SETTINGS:
      return protectedView(
        ADMIN_DEV_ONLY,
        <Suspense fallback={<ViewLoader />}>
          <TenantSettings onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.USER_DATABASE:
    case ViewState.USERS:
      return protectedView(
        ADMIN_DEV_ONLY,
        <Suspense fallback={<ViewLoader />}>
          <UserManagement onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.MADRASAH_MASTER:
      return protectedView(
        ADMIN_DEV_ONLY,
        <Suspense fallback={<ViewLoader />}>
          <MadrasahMaster />
        </Suspense>,
      );

    case ViewState.PENDING_ACTIVATION:
      return <PendingActivationView user={user} />;

    case ViewState.TENANT_MANAGEMENT:
      return protectedView(
        [UserRole.DEVELOPER],
        <Suspense fallback={<ViewLoader />}>
          <OrganizationManagement onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.LOGIN_HISTORY:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <LoginHistory onBack={handleBack} />
        </Suspense>,
      );

    case ViewState.SYSTEM_AUDIT:
      return protectedView(
        ROLE_GROUPS.MANAGEMENT,
        <Suspense fallback={<ViewLoader />}>
          <SystemAuditMain onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.COLLECTION_EXPLORER:
      return (
        <Suspense fallback={<ViewLoader />}>
          <CollectionExplorerPage
            collectionName={currentCollection || ''}
            onBack={handleBack}
            onOpenSidebar={onOpenSidebar}
          />
        </Suspense>
      );

    case ViewState.SUPPORT:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <SupportModule />
        </Suspense>,
      );

    case ViewState.GUEST_DASHBOARD:
      return (
        <Suspense fallback={<ViewLoader />}>
          <GuestDashboard 
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );

    case ViewState.KANWIL_DASHBOARD:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <KanwilWorkspace
            activeTitle="Dashboard Overview"
            currentView={currentView}
            onNavigate={handleNavigate}
            userRole={actualRole}
            userName={user?.displayName || user?.email || undefined}
            userPhoto={user?.photoURL || undefined}
            unreadNotifCount={unreadNotifCount}
          >
            <KanwilDashboardView onNavigate={handleNavigate} />
          </KanwilWorkspace>
        </Suspense>,
      );

    case ViewState.KANWIL_SATUAN_KERJA:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <KanwilWorkspace
            activeTitle="Kemenag Kab/Kota"
            currentView={currentView}
            onNavigate={handleNavigate}
            userRole={actualRole}
            userName={user?.displayName || user?.email || undefined}
            userPhoto={user?.photoURL || undefined}
            unreadNotifCount={unreadNotifCount}
          >
            <KanwilSatuanKerjaView />
          </KanwilWorkspace>
        </Suspense>,
      );

    case ViewState.ORGANIZATION_MGMT:
      // If we are in Kanwil Context (derived from role or state, here we assume it for specific roles)
      const isKanwilContext = actualRole === UserRole.KANWIL || actualRole === UserRole.DEVELOPER;
      
      if (isKanwilContext) {
        return protectedView(
          allAuthenticated,
          <Suspense fallback={<ViewLoader />}>
            <KanwilWorkspace
              activeTitle="Monitoring Organisasi"
              currentView={currentView}
              onNavigate={handleNavigate}
              userRole={actualRole}
              userName={user?.displayName || user?.email || undefined}
              userPhoto={user?.photoURL || undefined}
              unreadNotifCount={unreadNotifCount}
            >
              <OrganizationManagement onBack={() => handleNavigate(ViewState.KANWIL_DASHBOARD)} userRole={actualRole} />
            </KanwilWorkspace>
          </Suspense>,
        );
      }

      return protectedView(
        [UserRole.DEVELOPER],
        <Suspense fallback={<ViewLoader />}>
          <OrganizationManagement onBack={handleBack} onOpenSidebar={onOpenSidebar} />
        </Suspense>,
      );

    case ViewState.KEMENAG_HUB:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <KemenagHub onBack={handleBack} onNavigate={handleNavigate} userRole={actualRole} />
        </Suspense>,
      );

    case ViewState.ALL_FEATURES:
      return protectedView(
        allAuthenticated,
        <Suspense fallback={<ViewLoader />}>
          <AllFeatures
            onBack={handleBack}
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            userRole={actualRole}
            onLogout={handleLogout}
            unreadNotifCount={unreadNotifCount}
            unreadChatCount={unreadChatCount}
            pendingLetterCount={pendingLetterCount}
            pendingApprovalCount={pendingApprovalCount}
          />
        </Suspense>,
      );

    default:
      return (
        <Suspense fallback={<ViewLoader />}>
          <Dashboard
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            userRole={actualRole}
            onLogout={handleLogout}
            unreadNotifCount={unreadNotifCount}
            unreadChatCount={unreadChatCount}
            pendingLetterCount={pendingLetterCount}
            pendingApprovalCount={pendingApprovalCount}
          />
        </Suspense>
      );
  }
};
