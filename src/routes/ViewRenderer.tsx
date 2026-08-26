import React from 'react';
import { ViewState, UserRole, STAFF_ABOVE, ADMIN_DEV_ONLY, ALL_ROLES } from '@/types';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { RouteGuard } from '@/core/authorization/route-guard';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import * as Views from './ViewRegistry';

export interface ViewRendererProps {
  currentView: ViewState;
  handleBack: () => void;
  handleNavigate: (view: ViewState) => void;
  onOpenSidebar: () => void;
  handleLogout: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  unreadNotifCount?: number;
  unreadChatCount?: number;
  pendingLetterCount?: number;
  pendingApprovalCount?: number;
  handleLoginSuccess?: (role: UserRole) => void;
  handleImpersonate?: (role: UserRole, name: string, sid?: string) => void;
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
  unreadNotifCount = 0,
  unreadChatCount = 0,
  pendingLetterCount = 0,
  pendingApprovalCount = 0,
  handleLoginSuccess,
  handleImpersonate,
  user,
}) => {
  const roles = useUserStore((state) => state.roles) || [];
  const primaryRole = useUserStore((state) => state.role) || roles[0] || UserRole.TAMU;
  const isDeveloper = roles.includes(UserRole.DEVELOPER);

  const renderCurrentView = () => {
    switch (currentView) {
      // 1. Auth & Public
      case ViewState.HOME:
      case ViewState.LOGIN:
        return (
          <Views.Login
            onLoginSuccess={handleLoginSuccess || (() => {})}
            onNavigate={handleNavigate}
          />
        );

      // 2. Dashboards (Role-based dispatch)
      case ViewState.DASHBOARD: {
        if (roles.includes(UserRole.SISWA) || roles.includes(UserRole.KETUA_KELAS)) {
          return (
            <Views.StudentDashboardPage
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
            />
          );
        }
        if (roles.includes(UserRole.ORANG_TUA)) {
          return (
            <Views.ParentPortal
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
            />
          );
        }
        if (roles.includes(UserRole.GURU_BK) || roles.includes(UserRole.BK)) {
          return (
            <Views.DashboardBK
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              userRole={UserRole.GURU_BK}
            />
          );
        }
        if (roles.includes(UserRole.TAMU) || roles.includes(UserRole.GUEST) || roles.includes(UserRole.ALUMNI)) {
          return (
            <Views.GuestDashboard
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
            />
          );
        }
        return (
          <Views.Dashboard
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            userRole={primaryRole}
          />
        );
      }

      case ViewState.DASHBOARD_BK:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={[UserRole.GURU_BK, UserRole.BK, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KEPALA_MADRASAH]}>
            <Views.DashboardBK
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              userRole={primaryRole}
            />
          </RouteGuard>
        );

      // 3. Presensi & Attendance
      case ViewState.ATTENDANCE:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ALL_ROLES}>
            <Views.AttendanceView
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.ATTENDANCE_HISTORY:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ALL_ROLES}>
            <Views.History
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.TEACHER_ATTENDANCE:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={STAFF_ABOVE}>
            <Views.TeacherAttendanceView
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.SCANNER:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={STAFF_ABOVE}>
            <Views.QRScanner
              onBack={handleBack}
              onOpenSidebar={onOpenSidebar}
            />
          </RouteGuard>
        );

      // 4. Data Siswa, GTK & Kelas
      case ViewState.STUDENTS:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={STAFF_ABOVE}>
            <Views.StudentDataMain
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
              userRole={primaryRole}
            />
          </RouteGuard>
        );

      case ViewState.TEACHERS:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={STAFF_ABOVE}>
            <Views.TeacherData
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
              userRole={primaryRole}
            />
          </RouteGuard>
        );

      case ViewState.CLASSES:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={STAFF_ABOVE}>
            <Views.ClassList
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
              userRole={primaryRole}
            />
          </RouteGuard>
        );

      case ViewState.PROMOTION:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ADMIN_DEV_ONLY}>
            <Views.ClassPromotion
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.JOURNALS:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={STAFF_ABOVE}>
            <Views.TeachingJournal
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      // 5. Points & Letters (BK / Pelanggaran)
      case ViewState.POINTS:
      case ViewState.POINT_CATEGORIES:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ALL_ROLES}>
            <Views.PointsView
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
              userRole={primaryRole}
            />
          </RouteGuard>
        );

      case ViewState.LETTERS:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ALL_ROLES}>
            <Views.Letters
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      // 6. User Management & Approval
      case ViewState.USERS:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ADMIN_DEV_ONLY}>
            <Views.UserManagement
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.ACCOUNT_APPROVAL:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ADMIN_DEV_ONLY}>
            <Views.AccountApproval
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      // 7. Developer & System Settings
      case ViewState.DEVELOPER:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={[UserRole.DEVELOPER]}>
            <Views.DeveloperConsole
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
              onLogout={handleLogout}
            />
          </RouteGuard>
        );

      case ViewState.SETTINGS:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ALL_ROLES}>
            <Views.Settings
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />
          </RouteGuard>
        );

      case ViewState.ACADEMIC_YEAR:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ADMIN_DEV_ONLY}>
            <Views.AcademicYear
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.MADRASAH_MASTER:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={ADMIN_DEV_ONLY}>
            <Views.MadrasahMasterView
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.PROFILE:
        return (
          <Views.Profile
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            onBack={handleBack}
            onLogout={handleLogout}
          />
        );

      case ViewState.ABOUT:
        return (
          <Views.About
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            onBack={handleBack}
          />
        );

      case ViewState.REPORTS:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={STAFF_ABOVE}>
            <Views.Reports
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.KANWIL_DASHBOARD:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={[UserRole.KANWIL, UserRole.DEVELOPER, UserRole.ADMIN]}>
            <Views.KanwilDashboardView
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.KANWIL_SATUAN_KERJA:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={[UserRole.KANWIL, UserRole.DEVELOPER, UserRole.ADMIN]}>
            <Views.KanwilSatuanKerjaView
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.KEMENAG_HUB:
        return (
          <RouteGuard view={currentView} legacyAllowedRoles={[UserRole.KEMENAG, UserRole.KANWIL, UserRole.DEVELOPER, UserRole.ADMIN]}>
            <Views.KemenagHub
              onNavigate={handleNavigate}
              onOpenSidebar={onOpenSidebar}
              onBack={handleBack}
            />
          </RouteGuard>
        );

      case ViewState.NOTIFICATIONS:
        return (
          <Views.NotificationCenter
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            onBack={handleBack}
          />
        );

      default:
        return (
          <Views.Dashboard
            onNavigate={handleNavigate}
            onOpenSidebar={onOpenSidebar}
            userRole={primaryRole}
          />
        );
    }
  };

  return <div className="w-full h-full flex flex-col">{renderCurrentView()}</div>;
};

export default ViewRenderer;
