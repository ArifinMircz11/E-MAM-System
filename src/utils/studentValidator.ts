import { z } from 'zod';
import type { Student } from '../types';
import { normalizeRombelName } from './rombelHelpers';

// ==========================================
// ZOD SUB-SCHEMAS FOR NESTED STRUCTURES
// ==========================================

export const StudentMetadataAkademikSchema = z
  .object({
    kelasId: z.string().default(''),
    targetRombel: z.string().default(''),
    tahunAngkatan: z.string().default(''),
    tanggalDiterima: z.string().default(''),
  })
  .default({
    kelasId: '',
    targetRombel: '',
    tahunAngkatan: '',
    tanggalDiterima: '',
  });

export const StudentKontakDanWaliSchema = z
  .object({
    nomorHpSiswa: z.string().default(''),
    namaWali: z.string().default(''),
    hubunganWali: z.string().default(''),
    nomorHpWaliWhatsApp: z.string().default(''),
    alamatRumah: z.string().default(''),
  })
  .default({
    nomorHpSiswa: '',
    namaWali: '',
    hubunganWali: '',
    nomorHpWaliWhatsApp: '',
    alamatRumah: '',
  });

export const StudentLogPoinKedisiplinanSchema = z
  .object({
    poinSanksiKumulatif: z.number().default(0),
    totalPelanggaranSesiTs: z.number().default(0),
    totalTerlambat: z.number().default(0),
    totalPulangCepat: z.number().default(0),
    levelTeguranSaatIni: z.string().default('Aman'),
  })
  .default({
    poinSanksiKumulatif: 0,
    totalPelanggaranSesiTs: 0,
    totalTerlambat: 0,
    totalPulangCepat: 0,
    levelTeguranSaatIni: 'Aman',
  });

export const StudentSistemJangkarSchema = z
  .object({
    tenantId: z.string().default(''),
    userId: z.string().default(''),
    thUid: z.string().default(''),
    classRef: z.string().default(''),
    teachersId: z.string().nullable().default(null),
    coverURL: z.string().nullable().default(null),
    diperbaruiPada: z.string().default(''),
    diperbaruiOleh: z.string().default(''),
  })
  .default({
    tenantId: '',
    userId: '',
    thUid: '',
    classRef: '',
    teachersId: null,
    coverURL: null,
    diperbaruiPada: '',
    diperbaruiOleh: '',
  });

// ==========================================
// CORE STUDENT ZOD SCHEMA (SELF-HEALING)
// ==========================================

export const StudentSchema = z.object({
  studentsId: z.string(),
  id: z.string().optional(),
  idUnik: z.string().optional(),
  namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  photoURL: z.string().optional(),
  nisn: z
    .string()
    .nullable()
    .transform((v) => v || '')
    .default(''),
  nik: z
    .string()
    .nullable()
    .transform((v) => v || '')
    .default(''),
  email: z.preprocess((val) => {
    if (typeof val !== 'string') return '';
    const s = val.trim();
    if (s === '' || !s.includes('@')) return '';
    return s;
  }, z.string().default('')),
  emailGoogleSSO: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || ''),
  role: z
    .string()
    .nullable()
    .transform((v) => v || 'siswa')
    .default('siswa'),
  userlogin: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || ''),
  tingkatRombel: z
    .string()
    .nullable()
    .transform((v) => v || '')
    .default(''),
  className: z
    .string()
    .nullable()
    .transform((v) => v || '')
    .default(''),
  classId: z
    .string()
    .nullable()
    .transform((v) => v || '')
    .default(''),
  classRef: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || ''),
  status: z.preprocess(
    (val) => {
      const valid = ['Aktif', 'Lulus', 'Mutasi', 'Keluar', 'Nonaktif'];
      if (typeof val === 'string' && valid.includes(val)) return val;
      return 'Aktif'; // Fallback for invalid or missing status
    },
    z.enum(['Aktif', 'Lulus', 'Mutasi', 'Keluar', 'Nonaktif']).default('Aktif'),
  ),
  statusAktif: z.boolean().default(true),
  statusSinkronisasi: z.string().default('Synced'),
  jenisKelamin: z.preprocess(
    (val) => {
      if (!val || typeof val !== 'string') return 'Laki-laki';
      const s = val.trim().toLowerCase();
      if (
        s === 'l' ||
        s === 'laki-laki' ||
        s === 'laki - laki' ||
        s === 'laki_laki' ||
        s === 'male'
      ) {
        return 'Laki-laki';
      }
      if (s === 'p' || s === 'perempuan' || s === 'female') {
        return 'Perempuan';
      }
      return 'Laki-laki';
    },
    z.enum(['Laki-laki', 'Perempuan']).default('Laki-laki'),
  ),
  noTelepon: z.string().default(''),
  noHp: z.string().default(''),
  alamat: z.string().default(''),
  tempatLahir: z.string().default(''),
  tanggalLahir: z.string().default(''),
  tingkat: z.string().default(''),
  kelas: z.string().default(''),
  rombel: z.string().default(''),
  namaAyah: z.string().default(''),
  namaIbu: z.string().default(''),
  namaAyahKandung: z.string().default(''),
  namaIbuKandung: z.string().default(''),
  namaWali: z.string().default(''),
  penghasilanAyahNominal: z.number().default(0),
  penghasilanIbuNominal: z.number().default(0),
  nomorKIPP_PIP: z.string().default(''),
  kebutuhanKhusus: z.string().default('Tidak Ada'),
  disabilitas: z.string().default('Tidak Ada'),
  poinAkumulasi: z.number().default(0),
  tenantId: z.string().default(''),
  isClaimed: z.boolean().default(false),
  linkedUserId: z.string().optional(),
  authUid: z.string().optional(),
  accountStatus: z.enum(['Active', 'Suspended']).default('Active'),

  metadataAkademik: StudentMetadataAkademikSchema,
  kontakDanWali: StudentKontakDanWaliSchema,
  logPoinKedisiplinan: StudentLogPoinKedisiplinanSchema,
  sistemJangkar: StudentSistemJangkarSchema,
  version: z.number().optional().default(1),
  schemaVersion: z.number().optional().default(1),
  syncStatus: z.enum(['pending', 'synced', 'error', 'local_only']).optional().default('synced'),
  deleted: z.boolean().optional().default(false),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// ==========================================
// SELF-HEALING & PARSING UTILITIES
// ==========================================

/**
 * Sanitizes student data before it enters the parsing/healing process.
 * This prevents common data integrity issues from triggering complex recovery loops.
 */
export const sanitizeStudentData = (data: Record<string, unknown>) => ({
  ...data,
  email:
    data.email && typeof data.email === 'string' && data.email.trim() !== '' ? data.email : null,
});

/**
 * Validates and heals student data. If optional fields are missing, Zod's defaults
 * will automatically populate them to protect the UI and services from crashes (e.g. F4/F5 errors).
 */
export const safeParseStudent = (data: unknown, customId?: string): Student => {
  if (!data || typeof data !== 'object') {
    throw new Error('Siswa tidak memiliki data object yang valid.');
  }

  const rawData: any = sanitizeStudentData(data as Record<string, unknown>);
  const parsedId = (rawData.studentsId as string) || (rawData.idUnik as string) || (rawData.id as string) || customId || '';

  const cleanData: any = {
    ...rawData,
    studentsId: parsedId,
    id: rawData.id || parsedId,
    idUnik: rawData.idUnik || parsedId,
    // Fix dirty names like "undefined" or "null" string
    namaLengkap:
      rawData.namaLengkap &&
      typeof rawData.namaLengkap === 'string' &&
      !['undefined', 'null', 'nan'].includes(rawData.namaLengkap.toLowerCase())
        ? rawData.namaLengkap
        : rawData.name || 'Siswa Tanpa Nama',
  };

  const result = StudentSchema.safeParse(cleanData);

  if (result.success) {
    return result.data as Student;
  }

  console.warn('Student parse warning, healing with fallback values:', result.error.format());

  // Return a safe healed student object using fallback defaults manually if needed
  return {
    studentsId: parsedId,
    id: cleanData.id,
    idUnik: cleanData.idUnik,
    namaLengkap:
      cleanData.namaLengkap &&
      typeof cleanData.namaLengkap === 'string' &&
      !['undefined', 'null', 'nan'].includes(cleanData.namaLengkap.toLowerCase())
        ? cleanData.namaLengkap
        : 'Siswa Tanpa Nama',
    photoURL: cleanData.photoURL || '',
    nisn: cleanData.nisn || '',
    nik: cleanData.nik || '',
    email: cleanData.email || '',
    emailGoogleSSO: cleanData.emailGoogleSSO || '',
    role: cleanData.role || 'siswa',
    className: normalizeRombelName(
      cleanData.className || cleanData.rombel || cleanData.kelas || cleanData.tingkatRombel,
    ),
    classId: cleanData.classId || '',
    rombel: normalizeRombelName(
      cleanData.rombel || cleanData.className || cleanData.tingkatRombel || cleanData.kelas,
    ),
    tingkatRombel: normalizeRombelName(
      cleanData.tingkatRombel || cleanData.className || cleanData.rombel || cleanData.kelas,
    ),
    status: cleanData.status || 'Aktif',
    statusAktif: cleanData.statusAktif !== undefined ? cleanData.statusAktif : true,
    statusSinkronisasi: cleanData.statusSinkronisasi || 'Synced',
    jenisKelamin: cleanData.jenisKelamin || 'Laki-laki',
    alamat: cleanData.alamat || '',
    noTelepon: cleanData.noTelepon || '',
    noHp: cleanData.noHp || cleanData.noTelepon || '',
    tempatLahir: cleanData.tempatLahir || '',
    tanggalLahir: cleanData.tanggalLahir || '',
    tingkat:
      cleanData.tingkat ||
      normalizeRombelName(cleanData.tingkatRombel || cleanData.rombel || cleanData.className).split(
        ' ',
      )[0] ||
      '',
    namaAyah: cleanData.namaAyah || cleanData.namaAyahKandung || '',
    namaIbu: cleanData.namaIbu || cleanData.namaIbuKandung || '',
    namaAyahKandung: cleanData.namaAyahKandung || '',
    namaIbuKandung: cleanData.namaIbuKandung || '',
    namaWali: cleanData.namaWali || '',
    penghasilanAyahNominal: cleanData.penghasilanAyahNominal || 0,
    penghasilanIbuNominal: cleanData.penghasilanIbuNominal || 0,
    nomorKIPP_PIP: cleanData.nomorKIPP_PIP || '',
    kebutuhanKhusus: cleanData.kebutuhanKhusus || 'Tidak Ada',
    disabilitas: cleanData.disabilitas || 'Tidak Ada',
    poinAkumulasi: cleanData.poinAkumulasi || 0,
    tenantId: cleanData.tenantId || '',
    isClaimed: cleanData.isClaimed || false,
    accountStatus: cleanData.accountStatus || 'Active',
    metadataAkademik: {
      kelasId: cleanData.metadataAkademik?.kelasId || '',
      targetRombel: cleanData.metadataAkademik?.targetRombel || '',
      tahunAngkatan: cleanData.metadataAkademik?.tahunAngkatan || '',
      tanggalDiterima: cleanData.metadataAkademik?.tanggalDiterima || '',
    },
    kontakDanWali: {
      nomorHpSiswa: cleanData.kontakDanWali?.nomorHpSiswa || '',
      namaWali: cleanData.kontakDanWali?.namaWali || '',
      hubunganWali: cleanData.kontakDanWali?.hubunganWali || '',
      nomorHpWaliWhatsApp: cleanData.kontakDanWali?.nomorHpWaliWhatsApp || '',
      alamatRumah: cleanData.kontakDanWali?.alamatRumah || '',
    },
    logPoinKedisiplinan: {
      poinSanksiKumulatif: cleanData.logPoinKedisiplinan?.poinSanksiKumulatif || 0,
      totalPelanggaranSesiTs: cleanData.logPoinKedisiplinan?.totalPelanggaranSesiTs || 0,
      totalTerlambat: cleanData.logPoinKedisiplinan?.totalTerlambat || 0,
      totalPulangCepat: cleanData.logPoinKedisiplinan?.totalPulangCepat || 0,
      levelTeguranSaatIni: cleanData.logPoinKedisiplinan?.levelTeguranSaatIni || 'Aman',
    },
    sistemJangkar: {
      tenantId: cleanData.sistemJangkar?.tenantId || '',
      userId: cleanData.sistemJangkar?.userId || '',
      thUid: cleanData.sistemJangkar?.thUid || '',
      classRef: cleanData.sistemJangkar?.classRef || '',
      teachersId: cleanData.sistemJangkar?.teachersId || null,
      coverURL: cleanData.sistemJangkar?.coverURL || null,
      diperbaruiPada: cleanData.sistemJangkar?.diperbaruiPada || '',
      diperbaruiOleh: cleanData.sistemJangkar?.diperbaruiOleh || '',
    },
    version: cleanData.version || 1,
    schemaVersion: cleanData.schemaVersion || 1,
    syncStatus: cleanData.syncStatus || 'synced',
    deleted: cleanData.deleted || false,
    createdAt: cleanData.createdAt || new Date().toISOString(),
    updatedAt: cleanData.updatedAt || new Date().toISOString(),
  } as Student;
};

/**
 * Checks if a student profile is complete based on mandatory enterprise fields (V8.0)
 * Mandatory: namaLengkap, nisn, tempatLahir, tanggalLahir, jenisKelamin, alamat, noHp, tingkat, kelas, rombel
 */
export const isStudentProfileComplete = (student: Student): boolean => {
  if (!student) return false;

  const mandatoryFields = [
    student.namaLengkap,
    student.nisn,
    student.tempatLahir,
    student.tanggalLahir,
    student.jenisKelamin,
    student.alamat,
    student.noHp,
    student.tingkat,
    student.className,
    student.rombel,
  ];

  return mandatoryFields.every((field) => field && String(field).trim().length > 0);
};
