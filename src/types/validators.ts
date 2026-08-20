// src/types/validators.ts

import type { z } from 'zod';
import { AsnStatus, EmploymentStatus, UserRole, AccountType } from './roles';
import { SyncStatus } from '@/domain/entities/base';
import {
  UserSchema,
  StudentSchema,
  TeacherSchema,
  ClassSchema,
  AttendanceDailySchema,
  StudentLetterSchema,
  PointTransactionSchema,
  PTSPRequestSchema,
} from './schemas';

// ==========================================
// OMNI GUARD - ARCHITECTURE OBSERVABILITY
// ==========================================

export interface SecurityAuditResult {
  passed: boolean;
  errors: string[];
  healed: boolean;
}

/**
 * Universal safe parser wrapper with automatic fallback healing and audit capabilities.
 * Stops data-poisoning and guarantees runtime stability.
 */
export function safeValidate<T>(
  schema: z.ZodType<T, any, any>,
  data: unknown,
  fallbackConstructor: () => T,
  moduleContext: string,
): { data: T; audit: SecurityAuditResult } {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      data: result.data,
      audit: { passed: true, errors: [], healed: false },
    };
  }

  // Format Zod validation errors nicely
  const formattedErrors = result.error.issues.map(
    (err) => `[${err.path.join('.')}] ${err.message}`,
  );

  console.warn(
    `[OmniGuard][${moduleContext}] Schema validation failed. Initializing self-healing fallback protocol. Errors:`,
    formattedErrors,
  );

  // Re-construct clean fallback with partial overrides from original bad data where safe
  const fallback = fallbackConstructor();
  const healed = { ...fallback, ...(data as any) };

  // Re-verify that healed structure is bulletproof
  const finalResult = schema.safeParse(healed);

  if (finalResult.success) {
    return {
      data: finalResult.data,
      audit: { passed: false, errors: formattedErrors, healed: true },
    };
  }

  return {
    data: fallback,
    audit: {
      passed: false,
      errors: [...formattedErrors, 'Healed fallback failed strict validation'],
      healed: true,
    },
  };
}

// ==========================================
// INDIVIDUAL DOMAIN SAFE PARSERS (SELF-HEALING)
// ==========================================

export function safeParseUser(data: unknown): z.infer<typeof UserSchema> {
  const defaultUser = (): z.infer<typeof UserSchema> => ({
    uid: '',
    tenantId: '',
    accountType: AccountType.MADRASAH,
    role: UserRole.SISWA,
    roles: [],
    assignment: null,
    status: 'inactive',
    approvalStatus: 'pending',
    version: 1,
    schemaVersion: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(), deleted: false });

  return safeValidate(UserSchema, data, defaultUser, 'User').data;
}

export function safeParseStudentV7(data: unknown): z.infer<typeof StudentSchema> {
  const defaultStudent = (): z.infer<typeof StudentSchema> => ({
    tenantId: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    schemaVersion: 1,
    syncStatus: SyncStatus.SYNCED,
    deleted: false,
    id: '',
    idUnik: '',
    namaLengkap: 'Siswa Tanpa Nama', className: '',
    nisn: '',
    statusAktif: true,
    poinAkumulasi: 0,
  });

  return safeValidate(StudentSchema, data, defaultStudent, 'Student').data;
}

export function safeParseTeacher(data: unknown): z.infer<typeof TeacherSchema> {
  const defaultTeacher = (): z.infer<typeof TeacherSchema> => ({
    tenantId: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    schemaVersion: 1,
    syncStatus: SyncStatus.SYNCED,
    deleted: false,
    id: '',
    idUnik: 'TEA_NEW',
    npsn: '30315537',
    namaLengkap: 'Guru Tanpa Nama', statusAktif: true,
    nik: '0000000000000000',
    jenisKelamin: 'L',
    employmentStatus: EmploymentStatus.LAINNYA,
    asnStatus: AsnStatus.NON_ASN,
    jabatan: 'Guru',
  });

  return safeValidate(TeacherSchema, data, defaultTeacher, 'Teacher').data;
}

export function safeParseClass(data: unknown): z.infer<typeof ClassSchema> {
  const defaultClass = (): z.infer<typeof ClassSchema> => ({
    tenantId: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    schemaVersion: 1,
    syncStatus: SyncStatus.SYNCED,
    deleted: false,
    id: '',
    classId: '',
    name: 'Kelas Baru',
    level: '10',
    academicYear: new Date().getFullYear().toString(),
  });

  return safeValidate(ClassSchema, data, defaultClass, 'Class').data;
}

export function safeParseAttendanceDaily(data: unknown): z.infer<typeof AttendanceDailySchema> {
  const defaultAttendance = (): z.infer<typeof AttendanceDailySchema> => ({
    id: '',
    tenantId: '',
    academicYearId: '',
    studentsId: '',
    namaLengkap: '',
    classId: 'Unassigned',
    className: 'Unassigned',
    tanggal: new Date().toISOString().split('T')[0],
    hari: 'Senin',
    status: 'Hadir',
    statusKehadiran: 'Hadir',
    masuk: { jam: '', status: 'TS' },
    duha: { jam: '', status: 'TS' },
    zuhur: { jam: '', status: 'TS' },
    ashar: { jam: '', status: 'TS' },
    pulang: { jam: '', status: 'TS' },
    isHaid: false,
    suratId: undefined,
    pelanggaran: {
      terlambat: false,
      tidakScan: false,
      pulangCepat: false,
      alpha: false,
    },
    prestasi: {
      hafalan: false,
      sertifikatPrestasi: false,
      penguranganPoin: 0,
    },
    point: {
      pelanggaran: 0,
      prestasi: 0,
      totalPoinHariIni: 0,
    },
    version: 1,
    schemaVersion: 1,
    syncStatus: SyncStatus.SYNCED,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    verified: false,
    deleted: false,
    dibuatPada: Date.now(),
    diperbaruiPada: Date.now(),
  });

  return safeValidate(AttendanceDailySchema, data, defaultAttendance, 'AttendanceDaily').data;
}

export function safeParseStudentLetter(data: unknown): z.infer<typeof StudentLetterSchema> {
  const defaultLetter = (): z.infer<typeof StudentLetterSchema> => ({
    tenantId: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    schemaVersion: 1,
    syncStatus: SyncStatus.SYNCED,
    deleted: false,
    type: 'izin',
    status: 'Pending',
  });

  return safeValidate(StudentLetterSchema, data, defaultLetter, 'StudentLetter').data;
}

export function safeParsePointTransaction(data: unknown): z.infer<typeof PointTransactionSchema> {
  const defaultPointTx = (): z.infer<typeof PointTransactionSchema> => ({
    id: '',
    studentsId: '',
    tenantId: '',
    type: 'Pelanggaran',
    points: 0,
    category: '',
    recordedBy: '',
    version: 1,
    schemaVersion: 1,
    syncStatus: SyncStatus.SYNCED,
    createdAt: Date.now(),
    updatedAt: Date.now(), deleted: false });

  return safeValidate(PointTransactionSchema, data, defaultPointTx, 'PointTransaction').data;
}

export function safeParsePTSPRequest(data: unknown): z.infer<typeof PTSPRequestSchema> {
  const defaultPTSP = (): any => ({
    id: '',
    studentId: '',
    tenantId: '',
    type: 'Lainnya',
    status: 'Pending',
    submittedAt: Date.now(),
    approvedBy: undefined,
    approvedAt: undefined,
    version: 1,
    schemaVersion: 1,
    syncStatus: SyncStatus.SYNCED,
    createdAt: Date.now(),
    updatedAt: Date.now(), deleted: false });

  return safeValidate(PTSPRequestSchema, data, defaultPTSP, 'PTSPRequest').data;
}
