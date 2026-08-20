/**
 * e-MAM System - Enterprise Business Hierarchy & Module Specification
 * Incorporating Developer -> Kanwil -> Kemenag Kabupaten/Kota -> Madrasah (NPSN)
 * and all operational sub-modules (Pengguna, Siswa, GTK, Akademik, Absensi, BK, Keuangan, Perpustakaan, PTSP, Sarpras, Alumni, Dashboard, Notifikasi, Sinkronisasi)
 */

export interface EnterpriseHierarchyNode {
  id: string;
  code: string;
  name: string;
  type: 'developer' | 'kanwil' | 'kemenag' | 'madrasah';
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface MadrasahContextNode {
  npsn: string;
  namaMadrasah: string;
  nsm?: string;
  kanwilId: string;
  kemenagId: string;
  statusOperasional: 'setup' | 'operasional' | 'maintenance' | 'suspended';
  tahunAjaranAktif: string;
  semesterAktif: 'Ganjil' | 'Genap';
  operatorId: string;
  kepalaMadrasahId: string;
}

export type ModuleCategory =
  | 'pengaturan'
  | 'pengguna'
  | 'ppdb'
  | 'siswa'
  | 'gtk'
  | 'akademik'
  | 'absensi'
  | 'bk'
  | 'keuangan'
  | 'perpustakaan'
  | 'ptsp'
  | 'sarana_prasarana'
  | 'alumni'
  | 'dashboard'
  | 'notifikasi'
  | 'sinkronisasi';

export interface AccountLifecycleState {
  userId: string;
  akunDibuatOleh: 'admin' | 'mandiri' | 'system';
  statusKlaim: 'belum_diklaim' | 'diklaim' | 'aktif' | 'nonaktif';
  perangkatTerdaftar: {
    deviceId: string;
    deviceName: string;
    platform: 'Android' | 'iPhone' | 'Laptop' | 'Tablet';
    ipAddress: string;
    lastLoginAt: number;
  }[];
  riwayatLogin: {
    timestamp: number;
    device: string;
    status: 'Success' | 'Failed';
  }[];
  hakAkses: string[];
  role: string;
}

export interface StudentLifecycleState {
  studentId: string;
  nisn: string;
  nama: string;
  status:
    | 'ppdb_calon'
    | 'ppdb_tidak_lulus'
    | 'daftar_ulang'
    | 'aktif'
    | 'pindahan'
    | 'mengundurkan_diri'
    | 'meninggal'
    | 'naik_kelas'
    | 'tinggal_kelas'
    | 'lulus'
    | 'alumni';
  riwayatKelas: {
    kelas: string;
    tahunAjaran: string;
    statusAkhir: 'naik' | 'tinggal' | 'lulus' | 'pindah';
  }[];
  tracerStudy?: {
    status: 'kuliah' | 'bekerja' | 'wirausaha' | 'pesantren' | 'belum_mengisi';
    institutionName?: string;
    graduationYear?: string;
  };
}

export interface GTKLifecycleState {
  gtkId: string;
  nip: string;
  nama: string;
  jenisGtk: 'guru' | 'pegawai';
  statusKepegawaian: 'honorer' | 'pppk' | 'asn';
  statusAktif: 'belum_klaim' | 'aktif' | 'wali_kelas' | 'wakil_kepala' | 'kepala_madrasah' | 'pensiun' | 'mutasi';
  riwayatMutasi: {
    fromMadrasah?: string;
    toMadrasah?: string;
    date: number;
    reason: string;
  }[];
}

export interface AttendanceLifecycleRecord {
  attendanceId: string;
  studentOrTeacherId: string;
  roleType: 'siswa' | 'guru';
  method: 'online_qr' | 'offline_dexie';
  status:
    | 'Hadir'
    | 'Terlambat'
    | 'Pulang Cepat'
    | 'Alfa'
    | 'Izin'
    | 'Sakit'
    | 'Dispensasi';
  attachmentUrl?: string; // Surat izin / dokter
  syncedToCloud: boolean;
  timestamp: number;
}
