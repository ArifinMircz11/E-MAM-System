/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Core enums/constants shared by the canonical identity contract.
 */

export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write',
}

export enum AccountType {
  DEVELOPER = 'developer', KANWIL = 'kanwil', KEMENAG = 'kemenag', MADRASAH = 'madrasah',
}

export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export enum UserRole {
  DEVELOPER = 'developer', KANWIL = 'kanwil', KANKEMENAG = 'kankemenag', ADMIN = 'admin', ADMIN_MADRASAH = 'admin_madrasah',
  KEPALA_MADRASAH = 'kepala_madrasah', KEPALA_TU = 'kepala_tu', GURU = 'guru', STAF = 'staf', SISWA = 'siswa',
  ORANG_TUA = 'orangtua', WALI_KELAS = 'wali_kelas', WAKAMAD = 'wakamad', KESISWAAN = 'kesiswaan', KURIKULUM = 'kurikulum',
  GTK = 'gtk', GURU_BK = 'guru_bk', KETUA_KELAS = 'ketua_kelas', SUPER_ADMIN = 'super_admin', ADMIN_OPERASIONAL = 'admin_operasional',
  PUSTAKAWAN = 'pustakawan', LABORAN = 'laboran', PEMBINA_EKSKUL = 'pembina_ekskul', HUMAS = 'humas', PIKET = 'piket',
  KOMITE = 'komite', ALUMNI = 'alumni', BK = 'bk', PENGURUS_ASRAMA = 'pengurus_asrama', BENDAHARA = 'bendahara',
  SARPRAS = 'sarpras', SATPAM = 'satpam', PEMBINA_OSIS = 'pembina_osis',
  /** Guest presentation state only; never a default persisted identity. */
  TAMU = 'tamu', STAF_TU = 'staf_tu',
}

export enum EmploymentStatus {
  PNS = 'PNS', PPPK = 'PPPK', GTY = 'GTY', GTT = 'GTT', HONORER = 'Honorer', KONTRAK = 'Kontrak', PPNPN = 'PPNPN', LAINNYA = 'Lainnya',
}

export enum AsnStatus { ASN = 'ASN', NON_ASN = 'NON_ASN' }

/** Role collections used for authorization, not identity discovery. */
export const ROLE_GROUPS: Record<string, UserRole[]> = {
  ALL: Object.values(UserRole),
  GUEST_ACCESS: [UserRole.TAMU],
  MANAGEMENT: [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.ADMIN_MADRASAH, UserRole.KEPALA_MADRASAH, UserRole.KEPALA_TU, UserRole.WAKAMAD, UserRole.KESISWAAN, UserRole.KURIKULUM],
  ACADEMIC_STAFF: [UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK, UserRole.GTK],
  OFFICE_STAFF: [UserRole.KEPALA_TU, UserRole.STAF, UserRole.ADMIN_OPERASIONAL],
  STUDENT_FAMILY: [UserRole.SISWA, UserRole.ORANG_TUA, UserRole.KETUA_KELAS],
  ADMIN_LEVEL: [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.ADMIN_MADRASAH],
  ALL_GTK: [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.ADMIN_MADRASAH, UserRole.KEPALA_MADRASAH, UserRole.KEPALA_TU, UserRole.WAKAMAD, UserRole.KESISWAAN, UserRole.KURIKULUM, UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK, UserRole.GTK, UserRole.STAF],
  STAFF_AND_GTK: [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.ADMIN_MADRASAH, UserRole.KEPALA_MADRASAH, UserRole.KEPALA_TU, UserRole.WAKAMAD, UserRole.STAF, UserRole.GTK, UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK],
};

export const STAFF_ABOVE = [UserRole.ADMIN, UserRole.ADMIN_MADRASAH, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF, UserRole.WALI_KELAS, UserRole.KEPALA_MADRASAH, UserRole.WAKAMAD, UserRole.KEPALA_TU, UserRole.GURU_BK, UserRole.PUSTAKAWAN, UserRole.LABORAN, UserRole.PEMBINA_EKSKUL, UserRole.GTK, UserRole.SUPER_ADMIN, UserRole.ADMIN_OPERASIONAL, UserRole.PIKET];
export const ADMIN_DEV_ONLY = [UserRole.ADMIN, UserRole.ADMIN_MADRASAH, UserRole.DEVELOPER];

export const getAllAuthenticated = (isDeveloper: boolean) => {
  const list = [...STAFF_ABOVE, UserRole.SISWA, UserRole.ORANG_TUA, UserRole.KETUA_KELAS];
  if (isDeveloper && !list.includes(UserRole.DEVELOPER)) list.push(UserRole.DEVELOPER);
  return list;
};

export const COMMON_SUBJECTS = ['PAI', 'PKn', 'Matematika', 'B. Indonesia', 'B. Inggris', 'Sains', 'IPS', 'Penjas', 'SBK', 'TIK'];

export enum ViewState {
  GRID = 'grid', LIST = 'list', TABLE = 'table', ACCOUNT_APPROVAL = 'account_approval', DATA_APPROVAL = 'data_approval', DATA_SUBMISSION = 'data_submission',
  NEWS = 'news', NOTIFICATIONS = 'notifications', MADRASAH_INFO = 'madrasah_info', EVENTS = 'events', ABOUT = 'about', LOGIN_HISTORY = 'login_history',
  SCHEDULE = 'schedule', JOURNAL = 'journal', ACADEMIC_YEAR = 'academic_year', SEMESTER = 'semester', PROMOTION = 'promotion', REPORTS = 'reports', SCANNER = 'scanner',
  TEACHER_ATTENDANCE = 'teacher_attendance', POINTS = 'points', STUDENTS = 'students', ALUMNI = 'alumni', MUTATION = 'mutation', TEACHERS = 'teachers', CLASSES = 'classes', LETTERS = 'letters',
  ADVISOR = 'advisor', MESSAGES = 'messages', PARENT_PORTAL = 'parent_portal', PROFILE = 'profile', CREATE_ACCOUNT = 'create_account', USER_DATABASE = 'user_database',
  DEVELOPER = 'developer', DEVELOPER_CONSOLE = 'developer_console', ATTENDANCE_DASHBOARD = 'attendance_dashboard', SETTINGS = 'settings', SYSTEM_DOCUMENTATION = 'system_documentation', LOGIN = 'login', DASHBOARD = 'dashboard', PREMIUM = 'premium',
  PUBLIC_SERVICES = 'public_services', DASHBOARD_BK = 'dashboard_bk', ARCHIVES = 'archives', ATTENDANCE_HISTORY = 'attendance_history', PERSONAL_ATTENDANCE = 'personal_attendance', PUSAKA = 'pusaka', TEACHER_MANAGEMENT = 'teacher_management', NOTIFICATION_LOGS = 'notification_logs',
  POINT_CATEGORIES = 'point_categories', ID_CARD = 'id_card', USERS = 'users', MADRASAH_MASTER = 'madrasah_master', ALL_FEATURES = 'all_features', HISTORY = 'history', SUPPORT = 'support', KEMENAG_HUB = 'kemenag_hub', CACHE_DIAGNOSTIC = 'cache_diagnostic', TENANT_SETTINGS = 'tenant_settings',
  TENANT_MANAGEMENT = 'tenant_management', MONTHLY_MONITORING = 'monthly_monitoring', SYSTEM_AUDIT = 'system_audit', COLLECTION_EXPLORER = 'collection_explorer', PENDING_ACTIVATION = 'pending_activation', GUEST_DASHBOARD = 'guest_dashboard', KANWIL_DASHBOARD = 'kanwil_dashboard', KANWIL_SATUAN_KERJA = 'kanwil_satuan_kerja',
  ORGANIZATION_MGMT = 'organization_mgmt', DEV_DASHBOARD = 'dev_dashboard', DEV_BROADCAST = 'dev_broadcast', DEV_FEATURES = 'dev_features', DEV_INSTITUTIONS = 'dev_institutions', DEV_WORK_UNITS = 'dev_work_units', DEV_EDUCATION_LEVELS = 'dev_education_levels', DEV_MADRASAH = 'dev_madrasah',
  DEV_USERS = 'dev_users', DEV_ASSIGNMENTS = 'dev_assignments', DEV_ROLES = 'dev_roles', DEV_PERMISSIONS = 'dev_permissions', DEV_SYNC = 'dev_sync', DEV_AUDIT_LOG = 'dev_audit_log', DEV_SECURITY = 'dev_security', DEV_SYSTEM_SETTINGS = 'dev_system_settings', DEV_SCHEMA_ENGINE = 'dev_schema_engine',
  DEV_INTEGRATION_TEST = 'dev_integration_test', DEV_ATTENDANCE_CONTROL = 'dev_attendance_control', DEV_DUMMY_ENGINE = 'dev_dummy_engine', DEV_POINT_ENGINE = 'dev_point_engine', DEV_FIRESTORE_GOV = 'dev_firestore_gov', DEV_ARCHITECTURE = 'dev_architecture', DEV_GRID = 'dev_grid',
}

/**
 * Legacy compatibility export intentionally empty.
 * Developer authority MUST come from the canonical SecurityContext, never email.
 */
export const DEVELOPER_EMAILS: readonly string[] = [];
