// src/utils/studentImportMapper.ts

import type { Student } from '@/types';
import { normalizeRombelName } from '@/utils/rombelHelpers';
import { UserRole } from '@/types'; // pastikan import

/**
 * Normalisasi role ke UserRole yang valid
 */
function normalizeRole(rawRole: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    siswa: UserRole.SISWA,
    student: UserRole.SISWA,
    murid: UserRole.SISWA,
    guru: UserRole.GURU,
    teacher: UserRole.GURU,
    wali_kelas: UserRole.WALI_KELAS,
    walikelas: UserRole.WALI_KELAS,
    staff: UserRole.STAF,
    staf: UserRole.STAF,
    admin: UserRole.ADMIN,
  };
  const normalized = rawRole.toLowerCase().trim();
  return roleMap[normalized] || UserRole.SISWA;
}

/**
 * Parsing tanggal dengan berbagai format
 */
function parseDate(raw: any): string {
  if (!raw) return '';
  const strRaw = String(raw).trim();

  // Cek apakah berupa angka serial Excel (misal 30000 s/d 60000)
  const num = Number(strRaw);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    // Excel base date: Dec 30 1899 (accounting for Excel 1900 leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().split('T')[0];
    }
  }

  // Coba format ISO
  const date = new Date(strRaw);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  // Coba format DD/MM/YYYY
  const parts = strRaw.split(/[\/\-.]/);
  if (parts.length === 3) {
    // Asumsi DD/MM/YYYY
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  console.warn(`[Import] Tanggal tidak dikenali: ${strRaw}`);
  return strRaw; // fallback
}

/**
 * Validasi ID Unik
 */
function validateIdUnik(value: string): { valid: boolean; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, error: 'ID Unik tidak boleh kosong' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'ID Unik minimal 3 karakter' };
  }
  return { valid: true };
}

/**
 * Mapping utama
 */
export const mapRawDataToStudent = (item: any): Partial<Student> => {
  // Normalisasi key (upper case, trim)
  const normalizedItem: Record<string, any> = {};
  for (const key in item) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      normalizedItem[key.trim().toUpperCase()] = item[key];
    }
  }

  const val = (keys: string[]) => {
    for (const k of keys) {
      const key = k.toUpperCase();
      if (
        normalizedItem[key] !== undefined &&
        normalizedItem[key] !== null &&
        normalizedItem[key] !== ''
      ) {
        return normalizedItem[key];
      }
    }
    return '';
  };

  // 1. ID Unik (WAJIB)
  const idUnikRaw = String(val(['ID UNIK', 'ID', 'NIS', 'NO INDUK', 'ID UNIK *'])).trim();
  const idUnikValidation = validateIdUnik(idUnikRaw);
  if (!idUnikValidation.valid) {
    throw new Error(`ID Unik tidak valid: ${idUnikValidation.error}`);
  }
  const idUnik = idUnikRaw;

  // 2. Field Wajib Lainnya
  const namaLengkap = String(
    val(['NAMA LENGKAP', 'NAMA', 'STUDENT NAME', 'NAMA LENGKAP SESUAI IJAZAH']),
  )
    .trim()
    .toUpperCase();
  if (!namaLengkap) {
    throw new Error('Nama Lengkap wajib diisi');
  }

  const rawGender = String(val(['JENIS KELAMIN', 'JK', 'L/P', 'JENIS KELAMIN (L/P)']))
    .trim()
    .toUpperCase();
  const gender =
    rawGender === 'L' ||
    rawGender === 'LAKI-LAKI' ||
    rawGender === 'LAKI - LAKI' ||
    rawGender === 'MALE'
      ? 'Laki-laki'
      : 'Perempuan';

  // 3. Rombel & Class ID (dinamis)
  const rawRombel = String(val(['ROMBEL', 'KELAS', 'TINGKAT ROMBEL', 'ROMBONGAN BELAJAR'])).trim();
  const normalizedClass = normalizeRombelName(rawRombel);
  // classId dinamis: berdasarkan tahun ajaran dari sistem (misal: ambil dari store atau context)
  // Untuk sementara, kita ambil dari field 'TAHUN AJARAN' atau default
  const tahunAjaran = String(val(['TAHUN AJARAN', 'TAHUN_AJARAN', 'TAHUN'])).trim() || '2025';
  const classId = normalizedClass ? normalizedClass.replace(/\s+/g, '_') + `_${tahunAjaran}` : '';

  // 4. Role
  const rawRole = String(
    val(['JABATAN', 'ROLE', 'JABATAN (ROLE)', 'JABATAN_ROLE', 'JABATAN / ROLE']),
  ).trim();
  const role = normalizeRole(rawRole);

  // 5. Status
  const rawStatus = String(val(['STATUS'])).trim();
  const validStatuses = ['Aktif', 'Lulus', 'Mutasi', 'Keluar', 'Nonaktif'];
  const status = validStatuses.includes(rawStatus) ? (rawStatus as any) : 'Aktif';

  // 6. Tanggal
  const tanggalLahirRaw = String(val(['TANGGAL LAHIR', 'TG LAHIR', 'TGL LAHIR']));
  const tanggalLahir = parseDate(tanggalLahirRaw);

  const tglDiterimaRaw = String(val(['TANGGAL DITERIMA', 'TGL DITERIMA']));
  const tglDiterima = parseDate(tglDiterimaRaw) || '2025-07-15';

  // 7. Kontak
  const phone = String(
    val(['WA/TELEPON', 'NO TELEPON', 'NO HP', 'WA', 'HP', 'NO. WHATSAPP / HP']),
  ).trim();
  const waliPhone = String(val(['NOMOR HP WALI (WA)', 'NO HP WALI', 'HP WALI'])).trim();
  const alamat = String(val(['ALAMAT', 'ADDRESS', 'ALAMAT DOMISILI', 'ALAMAT DOMISILI LENGKAP']));
  const alamatWali = String(val(['ALAMAT WALI', 'ALAMAT RUMAH WALI', 'ALAMAT RUMAH']));

  // 8. Nama Orang Tua
  const ayah = String(val(['AYAH', 'NAMA AYAH', 'AYAH KANDUNG', 'NAMA AYAH KANDUNG']))
    .toUpperCase()
    .trim();
  const ibu = String(val(['IBU', 'NAMA IBU', 'IBU KANDUNG', 'NAMA IBU KANDUNG']))
    .toUpperCase()
    .trim();
  const waliName = String(val(['WALI', 'NAMA WALI', 'NAMA WALI (JIKA TIDAK BERSAMA ORANG TUA)']));

  // 9. Lain-lain
  const tahunAngkatan = String(val(['TAHUN ANGKATAN', 'ANGKATAN'])).trim() || '2025';
  const nisn = String(val(['NISN'])).trim();
  const nik = String(val(['NIK'])).trim();
  const email = String(val(['EMAIL', 'EMAIL SISWA'])).trim();
  const tempatLahir = String(val(['TEMPAT LAHIR', 'TEMPAT']));

  // 10. Field Kebutuhan Khusus
  const kebutuhanKhusus =
    String(val(['KEBUTUHAN_KHUSUS', 'KEBUTUHAN KHUSUS', 'KEBUTUHAN'])).trim() || 'Tidak Ada';
  const disabilitas = String(val(['DISABILITAS'])).trim() || 'Tidak Ada';

  // 11. KIP/PIP
  const nomorKIPP_PIP = String(val(['KIP_PIP', 'PIP', 'KIP', 'NOMOR KIP/PIP'])).trim();

  // Return objek Student yang sudah lengkap
  return {
    idUnik,
    studentsId: idUnik,
    namaLengkap,
    nisn,
    nik,
    tingkatRombel: normalizedClass,
    className: normalizedClass,
    rombel: normalizedClass,
    tingkat: normalizedClass.split(' ')[0] || '',
    jenisKelamin: gender,
    noTelepon: phone,
    noHp: phone,
    alamat,
    tempatLahir,
    tanggalLahir,
    email,
    namaAyah: ayah,
    namaAyahKandung: ayah,
    namaIbu: ibu,
    namaIbuKandung: ibu,
    namaWali: waliName,
    nomorKIPP_PIP,
    kebutuhanKhusus,
    disabilitas,
    status,
    role,
    isClaimed: false,
    statusAktif: status === 'Aktif',
    statusSinkronisasi: 'online',

    // Metadata Akademik
    metadataAkademik: {
      kelasId: classId,
      targetRombel: normalizedClass ? 'All' : '',
      tahunAngkatan,
      tanggalDiterima: tglDiterima,
    },

    // Kontak & Wali
    kontakDanWali: {
      nomorHpSiswa: phone,
      namaWali: waliName,
      hubunganWali: waliName ? 'Wali' : '',
      nomorHpWaliWhatsApp: waliPhone || phone,
      alamatRumah: alamatWali || alamat,
    },

    // Log Poin (default)
    logPoinKedisiplinan: {
      poinSanksiKumulatif: 0,
      totalPelanggaranSesiTs: 0,
      totalTerlambat: 0,
      totalPulangCepat: 0,
      levelTeguranSaatIni: 'Aman',
    },

    // Sistem Jangkar
    sistemJangkar: {
      tenantId: '', // akan diisi oleh service
      userId: '',
      thUid: '',
      classRef: classId ? `classes/${classId}` : '',
      teachersId: null,
      coverURL: null,
      diperbaruiPada: new Date().toISOString(),
      diperbaruiOleh: 'Excel Import',
    },
  };
};
