import { describe, it, expect } from 'vitest';
import {
  transformDocData,
  transformStudentToV2,
  transformTeacherToV2,
  transformTenantToV2,
} from '../src/utils/schemaTransforms';

describe('Schema Migration Transformation v2 Suite', () => {
  describe('transformDocData', () => {
    it('harus merelasikan user role dan accountType siswa ke properti yang tepat', () => {
      const legacyUser = {
        uid: 'user_siswa_01',
        displayName: 'Budi Santoso',
        role: 'siswa',
        tenantId: '30315537',
        email: 'budi@sekolah.id',
        studentId: 'stud_abc',
      };

      const result = transformDocData(legacyUser, 'user_siswa_01', { students: {}, teachers: {} });

      expect(result.accountType).toBe('student');
      expect(result.roles).toContain('siswa');
      expect(result.studentsId).toBe('stud_abc');
      expect(result.referenceId).toBe('stud_abc');
      expect(result.tenantId).toBe('30315537');
      expect(result.rbacVersion).toBe(2);
    });

    it('harus merelasikan guru ke Guru role dan accountType teacher', () => {
      const legacyTeacher = {
        uid: 'user_guru_01',
        displayName: 'Siti Rahma',
        roles: ['TEACHER', 'GURU'],
        teachersId: 'teach_xyz',
      };

      const result = transformDocData(legacyTeacher, 'user_guru_01', {
        students: {},
        teachers: {},
      });

      expect(result.accountType).toBe('teacher');
      expect(result.roles).toContain('guru');
      expect(result.teachersId).toBe('teach_xyz');
    });
  });

  describe('transformStudentToV2', () => {
    it('harus mentransformasikan data siswa legacy ke skema V2 dengan benar', () => {
      const legacyStudent = {
        idUnik: '99922',
        namaSiswa: 'Ahmad Dahlan',
        nisn: '998273612',
        status: 'Aktif',
        tahunMasuk: '2024',
        namaWali: 'Umar Dahlan',
        nomorHpWali: '081234567890',
        alamat: 'Jl. Merdeka No. 45',
        poin: 15,
        tenantId: '30315537',
        linkedUserId: 'usr_ahmad',
      };

      const result = transformStudentToV2(legacyStudent, 'std_1001');

      expect(result.studentsId).toBe('99922');
      expect(result.namaLengkap).toBe('Ahmad Dahlan');
      expect(result.nisn).toBe('998273612');
      expect(result.statusAktif).toBe(true);

      // Nested metadataAkademik
      expect(result.metadataAkademik.tahunAngkatan).toBe('2024');

      // Nested kontakDanWali
      expect(result.kontakDanWali.namaWali).toBe('Umar Dahlan');
      expect(result.kontakDanWali.nomorHpWaliWhatsApp).toBe('081234567890');
      expect(result.kontakDanWali.alamatRumah).toBe('Jl. Merdeka No. 45');

      // Nested logPoinKedisiplinan
      expect(result.logPoinKedisiplinan.poinSanksiKumulatif).toBe(15);

      // Nested sistemJangkar
      expect(result.sistemJangkar.tenantId).toBe('30315537');
      expect(result.sistemJangkar.userId).toBe('usr_ahmad');
      expect(result.sistemJangkar.diperbaruiOleh).toBe('System Migration');
    });
  });

  describe('transformTeacherToV2', () => {
    it('harus mentransformasikan data guru legacy ke skema V2 dengan benar', () => {
      const legacyTeacher = {
        idUnik: 'tea_2002',
        namaGuru: 'Aisyah Az-Zahra',
        nip: '198510102010122002',
        email: 'aisyah@madrasah.id',
        jabatan: 'Guru Ahli Madya',
        isWaliKelas: true,
        waliKelasDi: 'Kelas XI-A',
        mapelUtama: 'Matematika',
        noHp: '085233445566',
        tenantId: '30315537',
        linkedUserId: 'usr_aisyah',
      };

      const result = transformTeacherToV2(legacyTeacher, 'tea_2002');

      expect(result.teachersId).toBe('tea_2002');
      expect(result.namaLengkap).toBe('Aisyah Az-Zahra');
      expect(result.nip).toBe('198510102010122002');
      expect(result.email).toBe('aisyah@madrasah.id');

      // Nested jabatanDanStatus
      expect(result.jabatanDanStatus.jabatanUtama).toBe('Guru Ahli Madya');

      // Nested penugasanAkademik
      expect(result.penugasanAkademik.isWaliKelas).toBe(true);
      expect(result.penugasanAkademik.waliKelasDi).toBe('Kelas XI-A');
      expect(result.penugasanAkademik.mapelUtama).toBe('Matematika');

      // Nested kontak
      expect(result.kontak.nomorHpWhatsApp).toBe('085233445566');

      // Nested sistemJangkar
      expect(result.sistemJangkar.tenantId).toBe('30315537');
      expect(result.sistemJangkar.userId).toBe('usr_aisyah');
    });
  });

  describe('transformTenantToV2', () => {
    it('harus mentransformasikan data tenant config legacy ke V2 dengan benar', () => {
      const legacyTenant = {
        namaMadrasah: 'MAN 1 Hulu Sungai Tengah',
        npsn: '30315537',
        alamat: 'Jl. Protokol No. 1 Barabai',
        tahunAjaranAktif: '2025/2026',
        semesterAktif: 'Ganjil',
        toleransiKeterlambatan: 10,
        jadwalMasuk: '07:15',
      };

      const result = transformTenantToV2(legacyTenant, '30315537');

      expect(result.identitas.namaMadrasah).toBe('MAN 1 Hulu Sungai Tengah');
      expect(result.identitas.npsn).toBe('30315537');
      expect(result.identitas.alamat).toBe('Jl. Protokol No. 1 Barabai');
      expect(result.konfigurasiSistem.tahunAjaranAktif).toBe('2025/2026');
      expect(result.konfigurasiSesi.toleransiKeterlambatan).toBe(10);
      expect(result.konfigurasiSesi.jadwal.masuk).toBe('07:15');
    });
  });
});
