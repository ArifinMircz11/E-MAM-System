import React from 'react';
import { ViewState, UserRole, STAFF_ABOVE, ADMIN_DEV_ONLY, ALL_ROLES } from '@/types';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { RouteGuard } from '@/core/authorization/route-guard';
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
  handleLoginSuccess,
}) => {
  const canonicalUser = useAuthStore((state) => state.user);
  const roles = canonicalUser?.roles?.length ? canonicalUser.roles : canonicalUser?.role ? [canonicalUser.role] : [];
  const primaryRole = canonicalUser?.role || roles[0] || UserRole.TAMU;

  const guarded = (children: React.ReactNode, legacyAllowedRoles?: string[]) => (
    <RouteGuard view={currentView} legacyAllowedRoles={legacyAllowedRoles}>
      {children}
    </RouteGuard>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case ViewState.HOME:
      case ViewState.LOGIN:
        return <Views.Login onLoginSuccess={handleLoginSuccess || (() => {})} onNavigate={handleNavigate} />;
      case ViewState.DASHBOARD:
        if (roles.includes(UserRole.SISWA) || roles.includes(UserRole.KETUA_KELAS)) return <Views.StudentDashboardPage onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} />;
        if (roles.includes(UserRole.ORANG_TUA)) return <Views.ParentPortal onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} />;
        if (roles.includes(UserRole.GURU_BK) || roles.includes(UserRole.BK)) return <Views.DashboardBK onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} userRole={UserRole.GURU_BK} />;
        if (roles.includes(UserRole.TAMU) || roles.includes(UserRole.GUEST) || roles.includes(UserRole.ALUMNI)) return <Views.GuestDashboard onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} />;
        return <Views.Dashboard onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} userRole={primaryRole} />;
      case ViewState.DASHBOARD_BK:
        return guarded(<Views.DashboardBK onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} userRole={primaryRole} />, [UserRole.GURU_BK, UserRole.BK, UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KEPALA_MADRASAH]);
      case ViewState.ATTENDANCE:
        return guarded(<Views.AttendanceView onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, ALL_ROLES);
      case ViewState.ATTENDANCE_HISTORY:
        return guarded(<Views.History onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, ALL_ROLES);
      case ViewState.TEACHER_ATTENDANCE:
        return guarded(<Views.TeacherAttendanceView onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, STAFF_ABOVE);
      case ViewState.SCANNER:
        return guarded(<Views.QRScanner onBack={handleBack} onOpenSidebar={onOpenSidebar} />, STAFF_ABOVE);
      case ViewState.STUDENTS:
        return guarded(<Views.StudentDataMain onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} userRole={primaryRole} />, STAFF_ABOVE);
      case ViewState.TEACHERS:
        return guarded(<Views.TeacherData onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} userRole={primaryRole} />, STAFF_ABOVE);
      case ViewState.CLASSES:
        return guarded(<Views.ClassList onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} userRole={primaryRole} />, STAFF_ABOVE);
      case ViewState.PROMOTION:
        return guarded(<Views.ClassPromotion onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, ADMIN_DEV_ONLY);
      case ViewState.JOURNALS:
        return guarded(<Views.TeachingJournal onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, STAFF_ABOVE);
      case ViewState.POINTS:
      case ViewState.POINT_CATEGORIES:
        return guarded(<Views.PointsView onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} userRole={primaryRole} />, ALL_ROLES);
      case ViewState.LETTERS:
        return guarded(<Views.Letters onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, ALL_ROLES);
      case ViewState.USERS:
        return guarded(<Views.UserManagement onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, [UserRole.DEVELOPER]);
      case ViewState.ACCOUNT_APPROVAL:
        return guarded(<Views.AccountApproval onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, [UserRole.DEVELOPER]);
      case ViewState.DEVELOPER:
        return guarded(<Views.DeveloperConsole onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} onLogout={handleLogout} />, [UserRole.DEVELOPER]);
      case ViewState.SETTINGS:
        return guarded(<Views.Settings onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />, ALL_ROLES);
      case ViewState.ACADEMIC_YEAR:
        return guarded(<Views.AcademicYear onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, ADMIN_DEV_ONLY);
      case ViewState.MADRASAH_MASTER:
        return guarded(<Views.MadrasahMasterView onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, ADMIN_DEV_ONLY);
      case ViewState.PROFILE:
        return <Views.Profile onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} onLogout={handleLogout} />;
      case ViewState.ABOUT:
        return <Views.About onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />;
      case ViewState.REPORTS:
        return guarded(<Views.Reports onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, STAFF_ABOVE);
      case ViewState.KANWIL_DASHBOARD:
        return guarded(<Views.KanwilDashboardView onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, [UserRole.KANWIL, UserRole.DEVELOPER, UserRole.ADMIN]);
      case ViewState.KANWIL_SATUAN_KERJA:
        return guarded(<Views.KanwilSatuanKerjaView onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, [UserRole.KANWIL, UserRole.DEVELOPER, UserRole.ADMIN]);
      case ViewState.KEMENAG_HUB:
        return guarded(<Views.KemenagHub onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />, [UserRole.KEMENAG, UserRole.KANWIL, UserRole.DEVELOPER, UserRole.ADMIN]);
      case ViewState.NOTIFICATIONS:
        return <Views.NotificationCenter onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} onBack={handleBack} />;
      default:
        return <Views.Dashboard onNavigate={handleNavigate} onOpenSidebar={onOpenSidebar} userRole={primaryRole} />;
    }
  };

  return <div className="w-full h-full flex flex-col">{renderCurrentView()}</div>;
};

export default ViewRenderer;
