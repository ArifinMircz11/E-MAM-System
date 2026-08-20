import React from 'react';
import { resilientLazy } from '@/utils/resilientLazy';

// Lazy Loaded Components
export const Login = resilientLazy(() => import('@/features/auth/Login'));
export const Dashboard = resilientLazy(() => import('@/features/dashboard/Dashboard'));
export const DataSubmissionForm = resilientLazy(() => import('@/features/developer/components/DataSubmissionForm'));
export const AllFeatures = resilientLazy(() => import('@/features/dashboard/components/AllFeatures'));
export const ClassList = resilientLazy(() =>
  import('@/features/classes').then((m) => ({ default: m.ClassListPage })),
);
export const Schedule = resilientLazy(() => import('@/features/attendance/components/Schedule'));
export const Profile = resilientLazy(() => import('@/features/profile/components/Profile'));
export const Reports = resilientLazy(() => import('@/features/reports/components/Reports'));
export const Messages = resilientLazy(() => import('@/features/messages/components/Messages'));
export const Advisor = resilientLazy(() => import('@/services/realtime/Advisor'));
export const Settings = resilientLazy(() => import('@/features/settings/components/Settings'));
export const AttendanceHistory = resilientLazy(() => import('@/features/attendance/AttendanceView'));
export const PersonalAttendance = resilientLazy(() => import('@/features/attendance/AttendanceView'));
export const QRScanner = resilientLazy(() => import('../features/attendance/components/QRScanner'));
export const TeachingJournal = resilientLazy(() => import('@/features/journals/TeachingJournal'));
export const StudentData = resilientLazy(() => import('@/features/students/components/StudentDataMain'));
export const AlumniData = resilientLazy(() => import('@/features/students/components/AlumniData'));
export const MutationData = resilientLazy(() => import('@/features/students/components/MutationData'));
export const TeacherData = resilientLazy(() => import('@/features/teachers/TeacherData'));
export const TeacherAttendanceView = resilientLazy(() => import('@/features/teachers/TeacherAttendanceView'));
export const IDCard = resilientLazy(() => import('@/features/students/components/IDCard'));
export const Letters = resilientLazy(() => import('@/features/letters/Letters'));
export const DeveloperConsole = resilientLazy(() => import('@/features/developer/components/DeveloperConsole'));
export const About = resilientLazy(() => import('@/features/settings/components/About'));
export const MadrasahInfo = resilientLazy(() => import('@/features/settings/components/MadrasahInfo'));
export const PointsView = resilientLazy(() => import('@/features/points/PointsView'));
export const Events = resilientLazy(() => import('@/features/events/components/Events'));
export const AcademicYear = resilientLazy(() => import('@/features/settings/components/AcademicYear'));
export const Semester = resilientLazy(() => import('@/features/settings/components/Semester'));
export const ClassPromotion = resilientLazy(() => import('@/features/classes/components/ClassPromotion'));
export const News = resilientLazy(() => import('@/features/dashboard/components/News'));
export const GenericView = resilientLazy(() => import('@/features/developer/components/GenericView'));
export const NotificationCenter = resilientLazy(() => import('@/features/notifications/components/NotificationCenter'));
export const AccountApproval = resilientLazy(() => import('@/features/users/components/AccountApproval'));
export const ParentPortal = resilientLazy(() => import('@/features/users/components/ParentPortal'));
export const SystemDocumentation = resilientLazy(() => import('@/features/developer/components/SystemDocumentation'));
export const DashboardBK = resilientLazy(() => import('@/features/dashboard/DashboardBK'));
export const Archives = resilientLazy(() => import('@/features/letters/Archives'));
export const NotificationLogs = resilientLazy(() => import('@/features/notifications/components/NotificationLogs'));
export const TeacherAccountManagement = resilientLazy(
  () => import('@/features/teachers/TeacherAccountManagement'),
);
export const PointCategorySettings = resilientLazy(() => import('@/features/points/PointCategorySettings'));
export const TenantSettings = resilientLazy(() => import('@/modules/settings/TenantSettings'));
export const StudentDashboardPage = resilientLazy(
  () => import('@/features/students/dashboard/StudentDashboardPage'),
);
export const UserManagement = resilientLazy(() =>
  import('@/features/users/components/UserManagement').then((m) => ({ default: m.UserManagement })),
);
export const OrganizationManagement = resilientLazy(
  () => import('@/features/developer/TenantManagement/TenantList'),
);
export const LoginHistory = resilientLazy(() => import('@/features/auth/components/LoginHistory'));
export const SystemAuditMain = resilientLazy(() => import('@/features/audit/components/SystemAuditMain'));
export const CollectionExplorerPage = resilientLazy(
  () => import('@/pages/Generic/CollectionExplorerPage'),
);
export const MadrasahMaster = resilientLazy(() =>
  import('@/features/madrasah/components/MadrasahMasterView').then((m) => ({ default: m.MadrasahMasterView })),
);
export const SupportModule = resilientLazy(() => import('@/features/support/components/SupportModuleView'));
export const GuestDashboard = resilientLazy(() => import('@/features/dashboard/GuestDashboard'));
export const KanwilDashboardView = resilientLazy(() => import('@/features/kanwil/components/KanwilDashboardView'));
export const KanwilSatuanKerjaView = resilientLazy(() => import('@/features/kanwil/components/KanwilSatuanKerjaView'));
export const KanwilWorkspace = resilientLazy(() => import('@/features/kanwil/KanwilWorkspace'));
export const KemenagHub = resilientLazy(() => import('@/features/dashboard/components/KemenagHub'));

// Developer Console Tabs
export const DevTabOverview = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabOverview').then(m => ({ default: m.DevTabOverview })));
export const DevTabBroadcast = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabBroadcast').then(m => ({ default: m.DevTabBroadcast })));
export const DevTabFeatureToggles = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabFeatureToggles').then(m => ({ default: m.DevTabFeatureToggles })));
export const DevTabMasterVersion = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabMasterVersion').then(m => ({ default: m.DevTabMasterVersion })));
export const DevTabSchemaEngine = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabSchemaEngine').then(m => ({ default: m.DevTabSchemaEngine })));
export const DevTabTenantManagement = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabTenantManagement').then(m => ({ default: m.DevTabTenantManagement })));
export const DevTabIntegrationTest = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabIntegrationTest').then(m => ({ default: m.DevTabIntegrationTest })));
export const DevTabUserControl = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabUserControl').then(m => ({ default: m.DevTabUserControl })));
export const DevTabAttendanceControl = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabAttendanceControl').then(m => ({ default: m.DevTabAttendanceControl })));
export const DevTabDummyEngine = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabDummyEngine').then(m => ({ default: m.DevTabDummyEngine })));
export const DevTabPointEngine = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabPointEngine').then(m => ({ default: m.DevTabPointEngine })));
export const DevTabAuditTest = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabAuditTest').then(m => ({ default: m.DevTabAuditTest })));
export const DevTabFirestoreGov = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabFirestoreGov').then(m => ({ default: m.DevTabFirestoreGov })));
export const DevTabManajemenMadrasah = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabManajemenMadrasah').then(m => ({ default: m.DevTabManajemenMadrasah })));
export const DevTabManajemenOrganisasi = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabManajemenOrganisasi').then(m => ({ default: m.DevTabManajemenOrganisasi })));
export const DevTabManajemenUser = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabManajemenUser').then(m => ({ default: m.DevTabManajemenUser })));
export const DevTabArchitecture = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevTabArchitecture').then(m => ({ default: m.DevTabArchitecture })));
export const DevFeatureGrid = resilientLazy(() => import('@/features/developer/components/DeveloperConsole/DevFeatureGrid').then(m => ({ default: m.DevFeatureGrid })));
