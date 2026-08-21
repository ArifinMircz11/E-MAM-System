/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 */

export * from './roles';
export * from './permissions';
export * from './schemas';
export * from './firestore';
export * from './collections';
export * from './validators';
export * from './enterpriseHierarchy';
export * from './survey';
export * from './syncQueue';
export * from '@/identity/domain/CanonicalUser';

import type { z } from 'zod';
import type { AppEntity } from '@/domain/entities/base';
import { SyncStatus } from '@/domain/entities/base';
import type { UserRole } from './roles';
import type {
  UserAssignmentSchema,
  StudentSchema,
  TeacherSchema,
  ClassSchema,
  AttendanceDailySchema,
  PointTransactionSchema,
  NewsItemSchema,
  StudentLetterSchema,
  BaseEntitySchema,
} from './schemas';

export interface ChatTemplate {
  id: string;
  label: string;
  message: string;
  category: 'Akademik' | 'Teknis' | 'Lainnya';
}

import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
export type User = CanonicalUser;
export type UserData = CanonicalUser;
export type UserAssignment = z.infer<typeof UserAssignmentSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type Teacher = z.infer<typeof TeacherSchema>;
export type ClassData = z.infer<typeof ClassSchema>;
export type AttendanceRecord = z.infer<typeof AttendanceDailySchema>;
export type PointRecord = z.infer<typeof PointTransactionSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;
export type LetterRequest = z.infer<typeof StudentLetterSchema>;

export { SyncStatus };
export type AcademicYear = z.infer<typeof BaseEntitySchema> & {
  id: string;
  name: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  config?: any;
};

export type Semester = z.infer<typeof BaseEntitySchema> & {
  id: string;
  academicYearId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export interface TenantData {
  id: string;
  identitas: {
    namaMadrasah: string;
    npsn?: string;
    alamat?: string;
  };
  branding?: {
    logoAppUrl?: string;
    logoKemenagUrl?: string;
    warnaUtama?: string;
    warnaSekunder?: string;
  };
  konfigurasiSistem: {
    tahunAjaranAktif: string;
    semesterAktif: string;
    isMaintenance: boolean;
  };
  konfigurasiSesi?: {
    toleransiKeterlambatan?: number;
    jadwal?: {
      masuk?: string;
      pulang?: string;
      jumat?: string;
    };
  };
  status: 'Active' | 'Inactive' | 'Suspended';
  updatedAt: any;
}

export type AttendanceStatus =
  | 'Hadir'
  | 'Sakit'
  | 'Izin'
  | 'Alpha'
  | 'Haid'
  | 'Terlambat'
  | 'TS'
  | 'PC';

export interface AttendanceSession {
  time: string;
  status: AttendanceStatus | 'haid';
}

export interface TeacherAttendanceRecord extends AppEntity {
  teachersId: string;
  teacherName: string;
  date: string;
  statusGlobal: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Terlambat';
  sessions: {
    masuk?: AttendanceSession;
    pulang?: AttendanceSession;
  };
  location?: {
    lat: number;
    lng: number;
    distance: number;
  };
  qrToken?: string;
  timestamp: string;
  deviceInfo?: string;
}

export interface ExternalService {
  name: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AboutContent {
  engineVersion: string;
  brandingText: string;
  devName: string;
  devNip: string;
  devQuote: string;
  faqs: FAQItemData[];
}

export interface FAQItemData {
  iconName: string;
  question: string;
  answer: string;
}

export enum ServiceCategory {
  GTK = 'GTK',
  SISWA = 'SISWA',
  ALUMNI = 'ALUMNI',
  TAMU = 'TAMU',
}

export interface FAQItemDataPlaceholder {
  iconName: string;
  question: string;
  answer: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  subject: string;
  classes?: string;
  class?: string;
  room: string;
  teacherName?: string;
  isLocked?: boolean;
}

export type LetterStatus = 'Pending' | 'Verified' | 'Validated' | 'Signed' | 'Ditolak' | 'Proses';

export interface ProfileUpdateApproval {
  id: string;
  requestId: string;
  tenantId: string;
  userId: string;
  studentsId?: string;
  studentId?: string;
  entityType: 'student' | 'teacher' | 'user';
  targetCollection: 'users' | 'students' | 'teachers';
  referenceId: string;
  status: 'pending' | 'approved' | 'rejected';
  oldData: any;
  newData: any;
  submittedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  reviewedBy: string | null;
  reviewNotes: string;
  createdAt?: string;
  displayName?: string;
  nisn?: string;
  requestedChanges?: any;
}

export interface ClassApprovalRequest {
  id: string;
  classId: string;
  userId: string;
  requestedChanges: {
    waliKelasId?: string;
    ketuaKelasId?: string;
    name?: string;
    level?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  tenantId: string;
}

export interface StudentGrade extends AppEntity {
  subjectId: string;
  studentId: string;
  nilaiHarian: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir: number;
}

export interface JournalEntry extends AppEntity {
  teacherId: string;
  teacherName: string;
  className: string;
  subject: string;
  date: string;
  jamKe: string;
  materi: string;
  catatan: string;
  version: number;
}

export interface Assignment extends AppEntity {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  teacherId: string;
  teacherName: string;
  dueDate: string;
  status: 'Open' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  tenantId: string;
}

export interface Submission extends AppEntity {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'Submitted' | 'Graded';
  tenantId: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  device: string;
  ip: string;
  status: 'Success' | 'Failed';
  tenantId: string;
}

export interface MadrasahData {
  nama: string;
  nsm: string;
  npsn: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kepalaNama: string;
  kepalaNip: string;
  akreditasi: string;
  visi: string;
  misi: string[];
  photo: string;
  logoApp?: string;
  logoSurat?: string;
  logoLayanan?: string;
  logoFull?: string;
  motto?: string;
  whatsappEnabled?: boolean;
  whatsappGateway?: 'fonnte' | 'getway';
  whatsappToken?: string;
  whatsappGetwayToken?: string;
}

export enum NotificationType {
  INFO = 'info',
  TRANSAKSI = 'transaksi',
  CHAT = 'chat',
  SURAT = 'surat',
}

export interface AppNotification extends AppEntity {
  type: 'info' | 'transaksi' | 'chat' | 'surat';
  title: string;
  message: string;
  targetRole: UserRole | 'semua' | string;
  targetClass?: string;
  userId?: string;
  chatId?: string;
  isRead: boolean;
}

export interface PointCategory extends AppEntity {
  name: string;
  points: number;
  type: 'Pelanggaran' | 'Prestasi';
  description: string;
  isActive: boolean;
  linkedToAttendance?: boolean;
  linkedSession?: 'masuk' | 'duha' | 'zuhur' | 'ashar' | 'pulang' | null;
}

export interface TickerItem extends AppEntity {
  message: string;
  category: 'breaking' | 'info' | 'academic';
  isActive: boolean;
  date: string;
}

export interface SystemDocumentation extends AppEntity {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUpdated: string;
  updatedBy: string;
  tenantId: string;
}
