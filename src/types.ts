export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GUEST_DASHBOARD = 'GUEST_DASHBOARD',
  LOGIN = 'LOGIN',
  PUBLIC_SERVICES = 'PUBLIC_SERVICES',
  SCANNER = 'SCANNER',
  NEWS = 'NEWS',
  PROFILE = 'PROFILE',
  DEVELOPER = 'DEVELOPER',
  KANWIL_DASHBOARD = 'KANWIL_DASHBOARD',
  KANWIL_SATUAN_KERJA = 'KANWIL_SATUAN_KERJA',
  DEV_ASSIGNMENTS = 'DEV_ASSIGNMENTS',
  DEV_ROLES = 'DEV_ROLES',
  DEV_PERMISSIONS = 'DEV_PERMISSIONS',
  DEV_SYNC = 'DEV_SYNC',
  DEV_AUDIT_LOG = 'DEV_AUDIT_LOG',
  DEV_SECURITY = 'DEV_SECURITY',
  DEV_SYSTEM_SETTINGS = 'DEV_SYSTEM_SETTINGS',
}

export enum UserRole {
  DEVELOPER = 'DEVELOPER',
  ADMIN = 'ADMIN',
  KEPALA_MADRASAH = 'KEPALA_MADRASAH',
  KEPALA_TU = 'KEPALA_TU',
  GURU = 'GURU',
  GURU_BK = 'GURU_BK',
  WALI_KELAS = 'WALI_KELAS',
  STAF = 'STAF',
  SISWA = 'SISWA',
  KETUA_KELAS = 'KETUA_KELAS',
  ORANG_TUA = 'ORANG_TUA',
  TAMU = 'TAMU',
  GTK = 'GTK',
}

export enum AccountType {
  DEVELOPER = 'DEVELOPER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  USER = 'USER'
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum AsnStatus {
  ASN = 'ASN',
  NON_ASN = 'NON_ASN'
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export const ROLE_GROUPS = {
  ADMIN: [UserRole.ADMIN, UserRole.DEVELOPER],
  STAFF: [UserRole.GURU, UserRole.GURU_BK, UserRole.WALI_KELAS, UserRole.STAF],
  STUDENT: [UserRole.SISWA, UserRole.KETUA_KELAS],
};

export const COMMON_SUBJECTS = {};

export type TickerItem = any;
export type AttendanceRecord = any;
export type Student = any;
export type ChatTemplate = any;
export type ClassData = any;
export type Teacher = any;
export type ScheduleItem = any;
export type UserData = any;
export type SyncStatus = any;
export type AcademicYear = any;
export type AcademicYearData = any;
export type Semester = any;
export type SemesterData = any;
export type AboutContent = any;
export type FAQItemData = any;
export type MadrasahData = any;
export type AppNotification = any;
export type JournalEntry = any;
export type PointRecord = any;
export type StudentPointRecord = any;
export type TenantData = any;
export type PointCategory = any;
export type Assignment = any;
export type LetterRequest = any;
export type BaseEntity = any;
