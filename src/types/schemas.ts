import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AccountType, AsnStatus, EmploymentStatus, UserRole } from './roles';
import { SyncStatus } from '@/domain/entities/base';

// --- UTILITIES ---

/**
 * Helper to convert Zod Schema to JSON Schema for backend/Firestore validation
 */
export function toJsonSchema(schema: any, name: string) {
  return zodToJsonSchema(schema, name);
}

// --- SHARED COMPONENTS ---

const TimestampSchema = z
  .union([
    z.string().datetime(),
    z.number(),
    z.any(), // Firestore Timestamp placeholder
  ])
  .optional();

export const BaseEntitySchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  version: z.number(),
  schemaVersion: z.number(),
  syncStatus: z.nativeEnum(SyncStatus),
  deleted: z.boolean(),
  deletedAt: z.any().optional(),
  lastModifiedDevice: z.string().optional(),
});

// --- ENUM COLLECTIONS ---

export const RoleSchema = z.nativeEnum(UserRole);
const AttendanceStatusSchema = z.enum([
  'Hadir',
  'Sakit',
  'Izin',
  'Alpha',
  'Haid',
  'Terlambat',
  'TS',
  'PC',
]);
const LetterStatusSchema = z.enum([
  'Pending',
  'Verified',
  'Validated',
  'Signed',
  'Ditolak',
  'Proses',
  'pending',
  'approved',
  'rejected',
]).transform((val) => {
  if (val === 'pending') return 'Pending';
  if (val === 'approved') return 'Signed';
  if (val === 'rejected') return 'Ditolak';
  return val;
});

// --- DOMAIN SCHEMAS ---

export const UserAssignmentSchema = z.object({
  classId: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  scope: z.object({
    type: z.enum(['class', 'department', 'kanwil', 'kemenag', 'madrasah', 'all']),
    ids: z.array(z.string()),
  }).optional(),
}).nullable().optional();

// 1. User (Canonical User Final)
export const UserSchema = z.object({
  uid: z.string().min(1),
  tenantId: z.string().min(1),
  accountType: z.nativeEnum(AccountType),
  role: z.string(),
  roles: z.array(z.string()),
  assignment: UserAssignmentSchema,
  status: z.string(),
  approvalStatus: z.string(),
  version: z.number().default(1),
  schemaVersion: z.number().default(1),
  createdAt: z.number(),
  updatedAt: z.number(),
  deleted: z.boolean().default(false),
  // Legacy fields for backward compatibility during migration
  id: z.string().optional(),
  displayName: z.string().optional(),
  email: z.string().optional(),
  referenceId: z.string().nullish(),
  idUnik: z.string().nullish(),
  photoURL: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  permissionOverrides: z.array(z.string()).optional(),
  scope: z.any().optional(),
  adminNote: z.string().nullish(),
  lastSeen: z.number().nullish(),
});

// 2. Student
export const StudentSchema = BaseEntitySchema.extend({
  id: z.string(), // Dexie/Firestore compatibility
  idUnik: z.string().min(1),
  studentsId: z.string().optional(), // Added for compatibility
  studentId: z.string().optional(), // Alias for legacy
  namaLengkap: z.string().min(1),
  nisn: z
    .string()
    .nullish()
    .transform((v) => v || '')
    .default(''),
  nik: z.string().optional(),
  npsn: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: z.string().optional(),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
  noTelepon: z.string().optional(), // Added for compatibility
  email: z.string().email().or(z.literal('')).optional(),
  role: z.string().optional(),
  tingkat: z.string().optional(),
  className: z
    .string()
    .nullish()
    .transform((v) => v || 'Unassigned')
    .default('Unassigned'),
  classId: z.string().nullable().optional(),
  kelasId: z.string().optional(),
  rombel: z.string().optional(), // Legacy field
  tingkatRombel: z.string().optional(), // Legacy field
  statusAktif: z.boolean().default(true),
  poinAkumulasi: z.number().default(0),
  point: z.number().optional(), // Legacy point field
  photoURL: z.string().url().or(z.literal('')).optional(),
  userUid: z.string().nullable().optional(),
  sistemJangkar: z.any().optional(),
  isClaimed: z.boolean().optional(),
  linkedUserId: z.string().optional(),
  status: z.string().optional(),
  approvalStatus: z.string().optional(),
  pointSummary: z
    .object({
      totalPoint: z.number(),
      pelanggaran: z.number(),
      penghargaan: z.number(),
    })
    .optional(),
  attendanceSummary: z
    .object({
      hadir: z.number(),
      izin: z.number(),
      sakit: z.number(),
      alpa: z.number(),
    })
    .optional(),
  kontakDanWali: z.any().optional(),
  logPoinKedisiplinan: z.any().optional(),
  namaAyahKandung: z.string().optional(),
  namaIbuKandung: z.string().optional(),
  namaWali: z.string().optional(),
  namaAyah: z.string().optional(),
  namaIbu: z.string().optional(),
  kebutuhanKhusus: z.string().optional(),
  disabilitas: z.string().optional(),
  metadataAkademik: z.any().optional(),
  emailGoogleSSO: z.string().optional(),
  nomorKIPP_PIP: z.string().optional(),
  statusSinkronisasi: z.string().optional(),
  authUid: z.string().optional(),
});

// 3. Teacher
export const TeacherSchema = BaseEntitySchema.extend({
  id: z.string(),
  idUnik: z.string().min(1),
  uid: z.string().optional(),
  npsn: z.string().min(1),
  
  namaLengkap: z.string().min(1),
  gelarDepan: z.string().optional(),
  gelarBelakang: z.string().optional(),
  nik: z.string().min(16),
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  jenisKelamin: z.string().min(1),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  agama: z.string().optional(),
  
  email: z.string().email().or(z.literal('')).optional(),
  telepon: z.string().optional(),
  alamat: z.string().optional(),
  photoURL: z.string().url().or(z.literal('')).optional(),
  
  employmentStatus: z.nativeEnum(EmploymentStatus),
  asnStatus: z.nativeEnum(AsnStatus),
  jabatan: z.string().min(1),
  unitKerja: z.string().optional(),
  tanggalMasuk: z.string().optional(),
  statusAktif: z.boolean().default(true),

  // Legacy & Compatibility
  teachersId: z.string().optional(),
  userUid: z.string().optional(),
  active: z.boolean().optional(),
  status: z.string().optional(),
  teacherType: z.string().optional(),
  position: z.string().optional(),
  name: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  sistemJangkar: z.any().optional(),
  jabatanDanStatus: z.any().optional(),
  penugasanAkademik: z.any().optional(),
  kontak: z.any().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.string().optional(),
  tugas: z.string().optional(),
  mapel: z.string().optional(),
  subject: z.string().optional(),
  totalJTM: z.union([z.string(), z.number()]).optional(),
  accountStatus: z.string().optional(),
  isClaimed: z.boolean().optional(),
  tingkatRombel: z.string().optional(),
  linkedUserId: z.string().optional(),
  archives: z.array(z.object({
    name: z.string(),
    url: z.string(),
    date: z.string(),
  })).optional(),
});

// 4. Classes
export const ClassSchema = BaseEntitySchema.extend({
  id: z.string(),
  classId: z.string().min(1),
  name: z.string().min(1),
  level: z.string().min(1),
  teacherId: z.string().nullable().optional(),
  teacherName: z.string().optional(),
  academicYear: z.string().min(1),
  studentCount: z.number().optional(),
  waliKelasId: z.string().nullable().optional(),
  walikelasId: z.string().nullable().optional(), // Legacy lowercase k
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().optional(),
  archives: z.any().optional(),
  captainName: z.string().optional(),
  ketuaKelasId: z.string().optional(),
});

// 5. Attendance
export const AttendanceDailySchema = BaseEntitySchema.extend({
  id: z.string(), // PK studentsId_tanggal
  academicYearId: z.string().optional(),
  studentsId: z.string().optional(),
  namaLengkap: z.string().optional(),
  classId: z.string().optional(),
  className: z.string().optional(),
  tanggal: z.string().optional(), // YYYY-MM-DD
  hari: z.string().optional(),
  status: z.string().optional(), // H, T, I, S, A
  statusKehadiran: z.string().optional(),
  masuk: z.any().optional(),
  duha: z.any().optional(),
  zuhur: z.any().optional(),
  ashar: z.any().optional(),
  pulang: z.any().optional(),
  isHaid: z.boolean().default(false).optional(),
  suratId: z.string().nullable().optional(),
  pelanggaran: z.any().optional(),
  prestasi: z.any().optional(),
  point: z.any().optional(),
  keterangan: z.string().optional(),
  verified: z.boolean().default(false).optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.any().nullable().optional(),
  dibuatPada: z.any().optional(),
  diperbaruiPada: z.any().optional(),
  dibuatOleh: z.string().optional(),
  diperbaruiOleh: z.string().optional(),
});

// 6. Points
export const PointTransactionSchema = BaseEntitySchema.extend({
  id: z.string().min(1),
  studentsId: z.string().min(1),
  studentId: z.string().optional(), // Legacy compatibility
  studentName: z.string().optional(),
  className: z.string().optional(),
  classId: z.string().optional(),
  class: z.string().optional(), // Added for compatibility
  type: z
    .enum(['Pelanggaran', 'Prestasi', 'pelanggaran', 'prestasi'])
    .transform((val) => val.toLowerCase() as any),
  points: z.number().optional(),
  point: z.number().optional(), // Legacy field
  category: z.string().optional(),
  categoryId: z.string().optional(), // Added for compatibility
  description: z.string().optional(),
  recordedBy: z.string().optional(),
  createdBy: z.string().optional(), // Legacy
  date: z.string().optional(), // Added for compatibility
  idPetugas: z.string().optional(),
});

// 7. News
export const NewsItemSchema = BaseEntitySchema.extend({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  author: z.string().min(1),
  date: z.string().min(1),
  summary: z.string().optional(),
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
  image: z.string().optional(),
  authorUid: z.string().optional(),
});

// 8. Letters (PTSP)
export const StudentLetterSchema = BaseEntitySchema.extend({
  id: z.string().optional(),
  studentsId: z.string().optional(),
  studentId: z.string().optional(),
  userId: z.string().optional(),
  classId: z.string().nullable().optional(),
  userName: z.string().optional(),
  type: z.string().min(1),
  reason: z.string().optional(),
  description: z.string().optional(), // Added for compatibility
  status: LetterStatusSchema,
  attachmentUrl: z.string().nullable().optional(),
  attachments: z.any().optional(), // Added for compatibility
  submittedAt: z.string().optional(),
  approvedBy: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  userRole: z.string().optional(),
  digitalSignatureHash: z.string().optional(),
  verifiedAt: z.string().optional(),
  verifiedBy: z.string().optional(),
  validatedAt: z.string().optional(),
  validatedBy: z.string().optional(),
  signedAt: z.string().optional(),
  signedBy: z.string().optional(),
  waliKelas: z.string().optional(),
  letterNumber: z.string().optional(),
  is_read: z.boolean().optional(),
  adminNote: z.string().optional(),
  contactInfo: z.any().optional(),
  className: z.string().optional(),
  formData: z.any().optional(),
});

export const PTSPRequestSchema = StudentLetterSchema;

// --- INFERRED TYPES ---

import type { CanonicalUser } from "@/identity/domain/CanonicalUser";
export type User = CanonicalUser;
export type UserData = CanonicalUser;
export type Student = z.infer<typeof StudentSchema> & import("@/domain/entities/base").AppEntity;
export type Teacher = z.infer<typeof TeacherSchema> & import("@/domain/entities/base").AppEntity;
export type ClassData = z.infer<typeof ClassSchema> & import("@/domain/entities/base").AppEntity;
export type AttendanceRecord = z.infer<typeof AttendanceDailySchema> & import("@/domain/entities/base").AppEntity;
export type PointRecord = z.infer<typeof PointTransactionSchema> & import("@/domain/entities/base").AppEntity;
export type NewsItem = z.infer<typeof NewsItemSchema> & import("@/domain/entities/base").AppEntity;
export type LetterRequest = z.infer<typeof StudentLetterSchema> & import("@/domain/entities/base").AppEntity;
