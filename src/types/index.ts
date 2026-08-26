export * from './roles';
export * from './permissions';

export enum ViewState {
  HOME = 'home',
  DASHBOARD = 'dashboard',
  DASHBOARD_BK = 'dashboard_bk',
  STUDENTS = 'students',
  TEACHERS = 'teachers',
  CLASSES = 'classes',
  ATTENDANCE = 'attendance',
  ATTENDANCE_HISTORY = 'attendance_history',
  TEACHER_ATTENDANCE = 'teacher_attendance',
  SCANNER = 'scanner',
  POINTS = 'points',
  POINT_CATEGORIES = 'point_categories',
  LETTERS = 'letters',
  ACADEMIC_YEAR = 'academic_year',
  PROMOTION = 'promotion',
  USERS = 'users',
  ACCOUNT_APPROVAL = 'account_approval',
  DEVELOPER = 'developer',
  KANWIL_DASHBOARD = 'kanwil_dashboard',
  KANWIL_SATUAN_KERJA = 'kanwil_satuan_kerja',
  KEMENAG_HUB = 'kemenag_hub',
  SETTINGS = 'settings',
  MADRASAH_MASTER = 'madrasah_master',
  PROFILE = 'profile',
  ABOUT = 'about',
  EMERGENCY = 'emergency',
  REPORTS = 'reports',
  JOURNALS = 'journals',
  NOTIFICATIONS = 'notifications',
}

export const COMMON_SUBJECTS = [
  'Al-Qur\'an Hadits',
  'Akidah Akhlak',
  'Fikih',
  'Sejarah Kebudayaan Islam (SKI)',
  'Bahasa Arab',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Bahasa Inggris',
  'Seni Budaya',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan',
  'Prakarya',
  'Tik/Informatika',
  'Bimbingan Konseling'
];


export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  ERROR = 'error',
  LOCAL_ONLY = 'local_only',
}

export enum ServiceCategory {
  GTK = 'gtk',
  SISWA = 'siswa',
  ALUMNI = 'alumni',
  TAMU = 'tamu',
}

export enum NotificationType {
  INFO = 'info',
  TRANSAKSI = 'transaksi',
  CHAT = 'chat',
  SURAT = 'surat',
}

export enum EmploymentStatus {
  HONORER = 'HONORER',
  PNS = 'PNS',
  PPPK = 'PPPK',
  GTY = 'GTY',
  GTT = 'GTT',
  KONTRAK = 'KONTRAK',
}

export enum AsnStatus {
  ASN = 'ASN',
  NON_ASN = 'NON_ASN',
}

export interface AppEntity {
  id: string;
  tenantId: string;
  createdAt?: number | string;
  updatedAt?: number | string;
  syncStatus?: SyncStatus | 'synced' | 'pending' | 'error' | 'local_only';
  version?: number;
  deleted?: boolean;
}

export interface ExternalService {
  id: string;
  name: string;
  url: string;
  category: ServiceCategory;
  description?: string;
  icon?: string;
}

export interface Student extends AppEntity {
  idUnik?: string;
  name: string;
  nisn?: string;
  nis?: string;
  classId?: string;
  className?: string;
  gender?: 'L' | 'P';
  phone?: string;
  email?: string;
  status?: string;
}

export interface Teacher extends AppEntity {
  idUnik?: string;
  name: string;
  nip?: string;
  nik?: string;
  phone?: string;
  email?: string;
  subject?: string;
  status?: string;
}

export interface ClassData extends AppEntity {
  name: string;
  grade?: string | number;
  academicYear?: string;
  waliKelasId?: string;
  waliKelasName?: string;
  totalStudents?: number;
}

export interface AttendanceRecord extends AppEntity {
  studentId: string;
  studentName?: string;
  classId?: string;
  date: string;
  time?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'Terlambat';
  note?: string;
  method?: string;
}

export interface PointRecord extends AppEntity {
  studentId: string;
  categoryId?: string;
  categoryName?: string;
  points: number;
  type: 'Penghargaan' | 'Pelanggaran';
  date: string;
  description?: string;
}

export interface LetterRequest extends AppEntity {
  letterNumber?: string;
  type: string;
  studentId?: string;
  studentName?: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  category: ServiceCategory;
  purpose?: string;
}
