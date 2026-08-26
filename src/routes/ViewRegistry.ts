import { resilientLazy } from '@/utils/resilientLazy';

// Auth & Onboarding
export const Login = resilientLazy(() => import('@/features/auth/Login'));
export const Register = resilientLazy(() => import('@/features/auth/Register'));
export const PendingActivationView = resilientLazy(() => import('@/features/auth/PendingActivationView'));

// Dashboards
export const Dashboard = resilientLazy(() => import('@/features/dashboard/Dashboard'));
export const GuestDashboard = resilientLazy(() => import('@/features/dashboard/GuestDashboard'));
export const DashboardBK = resilientLazy(() => import('@/features/dashboard/DashboardBK'));
export const StudentDashboardPage = resilientLazy(() => import('@/features/students/dashboard/StudentDashboardPage'));
export const ParentPortal = resilientLazy(() => import('@/features/users/components/ParentPortal'));
export const KemenagHub = resilientLazy(() => import('@/features/dashboard/components/KemenagHub'));
export const AllFeatures = resilientLazy(() => import('@/features/dashboard/components/AllFeatures'));
export const News = resilientLazy(() => import('@/features/dashboard/components/News'));

// Presensi & Attendance
export const AttendanceView = resilientLazy(() => import('@/features/attendance/AttendanceView'));
export const PresensiView = resilientLazy(() => import('@/features/presensi/components/PresensiView'));
export const QRScanner = resilientLazy(() => import('@/features/attendance/components/QRScanner'));
export const TeacherAttendanceView = resilientLazy(() => import('@/features/teachers/TeacherAttendanceView'));
export const Schedule = resilientLazy(() => import('@/features/attendance/components/Schedule'));
export const History = resilientLazy(() => import('@/features/dashboard/components/History'));

// Master Data & Academic
export const StudentDataMain = resilientLazy(() => import('@/features/students/components/StudentDataMain'));
export const AlumniData = resilientLazy(() => import('@/features/students/components/AlumniData'));
export const MutationData = resilientLazy(() => import('@/features/students/components/MutationData'));
export const DuplicateStudentsDashboard = resilientLazy(() => import('@/features/students/components/DuplicateStudentsDashboard'));
export const InvalidStudentsList = resilientLazy(() => import('@/features/students/components/InvalidStudentsList'));
export const Assignments = resilientLazy(() => import('@/features/students/components/Assignments'));
export const Grades = resilientLazy(() => import('@/features/students/components/Grades'));
export const IDCard = resilientLazy(() => import('@/features/students/components/IDCard'));

export const TeacherData = resilientLazy(() => import('@/features/teachers/TeacherData'));
export const TeacherAccountManagement = resilientLazy(() => import('@/features/teachers/TeacherAccountManagement'));

export const ClassList = resilientLazy(() => import('@/features/classes/components/ClassList'));
export const ClassPromotion = resilientLazy(() => import('@/features/classes/components/ClassPromotion'));

export const TeachingJournal = resilientLazy(() => import('@/features/journals/TeachingJournal'));

// Points & Letters (BK / Kesiswaan)
export const PointsView = resilientLazy(() => import('@/features/points/PointsView'));
export const IndividuPoinView = resilientLazy(() => import('@/features/points/components/IndividuPoinView'));
export const DashboardRekapView = resilientLazy(() => import('@/features/points/components/DashboardRekapView'));
export const Letters = resilientLazy(() => import('@/features/letters/Letters'));

// Users & Roles
export const UserManagement = resilientLazy(() => import('@/features/users/components/UserManagement'));
export const AccountApproval = resilientLazy(() => import('@/features/users/components/AccountApproval'));
export const PendingActivationList = resilientLazy(() => import('@/features/users/components/PendingActivationList'));
export const ProfileApprovalPanel = resilientLazy(() => import('@/features/users/components/ProfileApprovalPanel'));

// Reports & Analytics
export const Reports = resilientLazy(() => import('@/features/reports/components/Reports'));

// Settings & Madrasah
export const Settings = resilientLazy(() => import('@/features/settings/components/Settings'));
export const AcademicYear = resilientLazy(() => import('@/features/settings/components/AcademicYear'));
export const Semester = resilientLazy(() => import('@/features/settings/components/Semester'));
export const MadrasahInfo = resilientLazy(() => import('@/features/settings/components/MadrasahInfo'));
export const MadrasahMasterView = resilientLazy(() => import('@/features/madrasah/components/MadrasahMasterView'));
export const Profile = resilientLazy(() => import('@/features/profile/components/Profile'));
export const About = resilientLazy(() => import('@/features/settings/components/About'));

// Communication & Support
export const Messages = resilientLazy(() => import('@/features/messages/components/Messages'));
export const SupportModuleView = resilientLazy(() => import('@/features/support/components/SupportModuleView'));
export const Events = resilientLazy(() => import('@/features/events/components/Events'));
export const EmergencyAlert = resilientLazy(() => import('@/features/emergency/components/EmergencyAlert'));
export const NotificationCenter = resilientLazy(() => import('@/features/notifications/components/NotificationCenter'));
export const NotificationLogs = resilientLazy(() => import('@/features/notifications/components/NotificationLogs'));

// Developer Console & Workspaces
export const DeveloperConsole = resilientLazy(() => import('@/features/developer/components/DeveloperConsole'));
export const SystemAuditMain = resilientLazy(() => import('@/features/audit/components/SystemAuditMain'));
export const KanwilWorkspace = resilientLazy(() => import('@/features/kanwil/KanwilWorkspace'));
export const KanwilDashboardView = resilientLazy(() => import('@/features/kanwil/components/KanwilDashboardView'));
export const KanwilSatuanKerjaView = resilientLazy(() => import('@/features/kanwil/components/KanwilSatuanKerjaView'));
export const Premium = resilientLazy(() => import('@/features/premium/components/Premium'));
export const TemplatePage = resilientLazy(() => import('@/features/template/pages/TemplatePage'));
