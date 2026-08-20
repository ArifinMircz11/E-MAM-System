import { localDb } from '@/database/dexie';
import type { Teacher } from '@/types';
import { EmploymentStatus, AsnStatus } from '@/types/roles';
import { SyncStatus } from '@/domain/entities/base';

export class DexieOperationalSeeder {
  static async seedOperationalData(): Promise<void> {
    try {
      console.log('[DexieOperationalSeeder] Checking local operational database state & e-MAM Enterprise Hierarchy...');

      const tenantId = '30315537'; // MAN 1 HST NPSN 30315354

      // 1. Seed Enterprise Hierarchy Nodes (Developer -> Kanwil -> Kemenag -> Madrasah)
      try {
        const tenantCount = await localDb.tenants.count();
        if (tenantCount === 0) {
          console.log('[DexieOperationalSeeder] Seeding e-MAM Enterprise Hierarchy nodes...');
          await localDb.tenants.bulkPut([
            {
              id: 'dev_root',
              tenantCode: 'DEV_SYSTEM',
              slug: 'developer',
              name: 'Developer Pusat e-MAM System',
              type: 'developer',
              tenantId: 'dev_root',
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'kanwil_kalsel',
              tenantCode: 'KANWIL_KALSEL',
              slug: 'kanwil-kalsel',
              name: 'Kanwil Kementerian Agama Provinsi Kalimantan Selatan',
              type: 'kanwil',
              parentId: 'dev_root',
              tenantId: 'kanwil_kalsel',
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'kemenag_hst',
              tenantCode: 'KEMENAG_HST',
              slug: 'kemenag-hst',
              name: 'Kemenag Kabupaten Hulu Sungai Tengah',
              type: 'kemenag',
              parentId: 'kanwil_kalsel',
              tenantId: 'kemenag_hst',
              updatedAt: new Date().toISOString(),
            },
            {
              id: tenantId,
              tenantCode: 'MAN1HST',
              slug: 'demo_school',
              name: 'MAN 1 Hulu Sungai Tengah',
              type: 'madrasah',
              parentId: 'kemenag_hst',
              npsn: '30315354',
              tenantId: tenantId,
              identitas: {
                namaMadrasah: 'MAN 1 HULU SUNGAI TENGAH',
                npsn: '30315354',
                alamat: 'Jl. H. Damanhuri No. 12 Barabai',
                statusOperasional: 'operasional',
                tahunAjaranAktif: '2025/2026',
                semesterAktif: 'Genap',
              },
              status: 'Active',
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding enterprise hierarchy:', e);
      }

      // 2. Seed Classes
      try {
        const classCount = await localDb.classes.count();
        if (classCount === 0) {
          console.log('[DexieOperationalSeeder] Seeding default classes...');
          const now = Date.now();
          const defaultClasses = [
            { id: 'cls_10a', tenantId, namaKelas: '10 A', kodeKelas: '10-A', tingkat: '10', jurusan: 'IPA', tahunAjaran: '2025/2026', semester: 'Genap', jumlahSiswa: 32, status: 'aktif', createdAt: now, updatedAt: now },
            { id: 'cls_10b', tenantId, namaKelas: '10 B', kodeKelas: '10-B', tingkat: '10', jurusan: 'IPS', tahunAjaran: '2025/2026', semester: 'Genap', jumlahSiswa: 30, status: 'aktif', createdAt: now, updatedAt: now },
            { id: 'cls_11a', tenantId, namaKelas: '11 A', kodeKelas: '11-A', tingkat: '11', jurusan: 'IPA', tahunAjaran: '2025/2026', semester: 'Genap', jumlahSiswa: 31, status: 'aktif', createdAt: now, updatedAt: now },
            { id: 'cls_11b', tenantId, namaKelas: '11 B', kodeKelas: '11-B', tingkat: '11', jurusan: 'IPS', tahunAjaran: '2025/2026', semester: 'Genap', jumlahSiswa: 29, status: 'aktif', createdAt: now, updatedAt: now },
            { id: 'cls_12a', tenantId, namaKelas: '12 A', kodeKelas: '12-A', tingkat: '12', jurusan: 'IPA', tahunAjaran: '2025/2026', semester: 'Genap', jumlahSiswa: 28, status: 'aktif', createdAt: now, updatedAt: now },
            { id: 'cls_12b', tenantId, namaKelas: '12 B', kodeKelas: '12-B', tingkat: '12', jurusan: 'IPS', tahunAjaran: '2025/2026', semester: 'Genap', jumlahSiswa: 27, status: 'aktif', createdAt: now, updatedAt: now },
          ];
          await localDb.classes.bulkPut(defaultClasses);
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding classes:', e);
      }

      // 3. Seed Teachers / GTK
      try {
        const teacherCount = await localDb.teachers.count();
        if (teacherCount === 0) {
          console.log('[DexieOperationalSeeder] Seeding default teachers (GTK)...');
          const now = Date.now();
          const defaultTeachers: Teacher[] = [
            { 
              id: 'TCH_001', idUnik: 'TCH_001', npsn: tenantId, tenantId, 
              namaLengkap: 'Ahmad S.Pd', nik: '198001012005011001', nip: '198001012005011001', 
              jenisKelamin: 'Laki-laki', employmentStatus: EmploymentStatus.PNS, 
              asnStatus: AsnStatus.ASN, jabatan: 'Guru Kelas', statusAktif: true,
              version: 1, schemaVersion: 1, createdAt: now, updatedAt: now, deleted: false, syncStatus: SyncStatus.LOCAL_ONLY
            },
            { 
              id: 'TCH_002', idUnik: 'TCH_002', npsn: tenantId, tenantId, 
              namaLengkap: 'Siti Rahmah S.Pd', nik: '198205122008012002', nip: '198205122008012002', 
              jenisKelamin: 'Perempuan', employmentStatus: EmploymentStatus.PPPK, 
              asnStatus: AsnStatus.ASN, jabatan: 'Guru Mapel', statusAktif: true,
              version: 1, schemaVersion: 1, createdAt: now, updatedAt: now, deleted: false, syncStatus: SyncStatus.LOCAL_ONLY
            },
            { 
              id: 'TCH_003', idUnik: 'TCH_003', npsn: tenantId, tenantId, 
              namaLengkap: 'Drs. H. Syamsul', nik: '197503102000121003', nip: '197503102000121003', 
              jenisKelamin: 'Laki-laki', employmentStatus: EmploymentStatus.PNS, 
              asnStatus: AsnStatus.ASN, jabatan: 'Guru Mapel', statusAktif: true,
              version: 1, schemaVersion: 1, createdAt: now, updatedAt: now, deleted: false, syncStatus: SyncStatus.LOCAL_ONLY
            },
          ];
          await localDb.teachers.bulkPut(defaultTeachers);
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding teachers:', e);
      }

      // 4. Seed Point Categories (BK)
      try {
        const pointCatCount = await localDb.point_categories.count();
        if (pointCatCount === 0) {
          console.log('[DexieOperationalSeeder] Seeding default point categories (BK)...');
          const defaultCategories = [
            { id: 'p1', name: 'Shalat Berjamaah Tepat Waktu', type: 'reward', points: 10, tenantId, isActive: true },
            { id: 'p2', name: 'Menghafal Juz Amma', type: 'reward', points: 25, tenantId, isActive: true },
            { id: 'p3', name: 'Terlambat Datang ke Sekolah', type: 'punishment', points: -5, tenantId, isActive: true },
            { id: 'p4', name: 'Tidak Memakai Atribut Lengkap', type: 'punishment', points: -10, tenantId, isActive: true },
          ];
          await localDb.point_categories.bulkPut(defaultCategories);
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding point categories:', e);
      }

      // 5. Seed Academic Years
      try {
        const academicCount = await localDb.academic_years.count();
        if (academicCount === 0) {
          console.log('[DexieOperationalSeeder] Seeding default academic year...');
          await localDb.academic_years.put({
            id: '2025_2026_genap',
            name: '2025/2026 Genap',
            isActive: true,
            startDate: '2026-01-02',
            endDate: '2026-06-30',
            tenantId,
          });
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding academic years:', e);
      }

      // 6. Seed Students (Siswa)
      try {
        const studentCount = await localDb.students.count();
        if (studentCount === 0) {
          console.log('[DexieOperationalSeeder] Seeding sample students with lifecycle states...');
          const sampleStudents = [
            {
              id: 'STD_001',
              idUnik: 'STD_001',
              studentsId: 'STD_001',
              tenantId,
              classId: 'cls_10a',
              tingkatRombel: '10 A',
              namaLengkap: 'Ahmad Fauzan',
              nisn: '0081234501',
              jenisKelamin: 'Laki-laki',
              status: 'Aktif',
              point: 100,
              riwayatKelas: [{ kelas: '10 A', tahunAjaran: '2025/2026', statusAkhir: 'naik' }],
            },
            {
              id: 'STD_002',
              idUnik: 'STD_002',
              studentsId: 'STD_002',
              tenantId,
              classId: 'cls_10a',
              tingkatRombel: '10 A',
              namaLengkap: 'Siti Aisyah',
              nisn: '0081234502',
              jenisKelamin: 'Perempuan',
              status: 'Aktif',
              point: 100,
              riwayatKelas: [{ kelas: '10 A', tahunAjaran: '2025/2026', statusAkhir: 'naik' }],
            },
            {
              id: 'STD_003',
              idUnik: 'STD_003',
              studentsId: 'STD_003',
              tenantId,
              classId: 'cls_10b',
              tingkatRombel: '10 B',
              namaLengkap: 'Muhammad Rizki',
              nisn: '0081234503',
              jenisKelamin: 'Laki-laki',
              status: 'Aktif',
              point: 95,
              riwayatKelas: [{ kelas: '10 B', tahunAjaran: '2025/2026', statusAkhir: 'naik' }],
            },
            {
              id: 'STD_004',
              idUnik: 'STD_004',
              studentsId: 'STD_004',
              tenantId,
              classId: 'cls_11a',
              tingkatRombel: '11 A',
              namaLengkap: 'Nurul Hidayati',
              nisn: '0081234504',
              jenisKelamin: 'Perempuan',
              status: 'Aktif',
              point: 100,
              riwayatKelas: [{ kelas: '11 A', tahunAjaran: '2025/2026', statusAkhir: 'naik' }],
            },
            {
              id: 'STD_005',
              idUnik: 'STD_005',
              studentsId: 'STD_005',
              tenantId,
              classId: 'cls_12a',
              tingkatRombel: '12 A',
              namaLengkap: 'Zainuddin',
              nisn: '0081234505',
              jenisKelamin: 'Laki-laki',
              status: 'Alumni',
              point: 90,
              tracerStudy: { status: 'kuliah', institutionName: 'UIN Antasari Banjarmasin', graduationYear: '2025' },
              riwayatKelas: [{ kelas: '12 A', tahunAjaran: '2024/2025', statusAkhir: 'lulus' }],
            },
          ];
          await localDb.students.bulkPut(sampleStudents);
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding students:', e);
      }

      // 7. Seed System Settings & Letters (PTSP) / Notifications / Absensi
      try {
        const settingsCount = await localDb.systemSettings.count();
        if (settingsCount === 0) {
          await localDb.systemSettings.put({
            key: 'app_config',
            value: { schoolName: 'MAN 1 Hulu Sungai Tengah', academicYear: '2025/2026', offlineMode: true },
            lastUpdated: Date.now(),
          });
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding system settings:', e);
      }

      // 8. Seed Default Users & Roles
      try {
        const userCount = await localDb.users.count();
        if (userCount === 0) {
          console.log('[DexieOperationalSeeder] Seeding default users (Pengguna)...');
          
          const computeHash = async (text: string) => {
            try {
              if (typeof crypto !== 'undefined' && crypto.subtle) {
                const msgUint8 = new TextEncoder().encode(text);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
                return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
              }
            } catch (e) {}
            return '';
          };

          const defaultHash = await computeHash('123456');

          const defaultUsers = [
            {
              id: 'usr_dev',
              uid: 'usr_dev',
              tenantId: 'global',
              email: 'dev@emam.id',
              displayName: 'Lead System Architect & Developer',
              role: 'developer',
              roles: ['developer'],
              status: 'active',
              passwordHash: defaultHash,
              createdAt: new Date().toISOString(),
              perangkatTerdaftar: [{ deviceId: 'dev_root_01', deviceName: 'Developer Workstation', platform: 'Laptop', ipAddress: '127.0.0.1', lastLoginAt: Date.now() }],
            },
            {
              id: 'usr_admin',
              uid: 'usr_admin',
              tenantId,
              email: 'admin@example.com',
              displayName: 'Administrator Madrasah',
              role: 'admin',
              roles: ['admin'],
              status: 'active',
              passwordHash: defaultHash,
              createdAt: new Date().toISOString(),
              perangkatTerdaftar: [{ deviceId: 'dev_01', deviceName: 'Chrome Laptop', platform: 'Laptop', ipAddress: '192.168.1.10', lastLoginAt: Date.now() }],
            },
            {
              id: 'usr_kepala',
              uid: 'usr_kepala',
              tenantId,
              email: 'kepala@example.com',
              displayName: 'Dr. H. Kamaruddin, M.Pd',
              role: 'kepala_madrasah',
              roles: ['kepala_madrasah'],
              status: 'active',
              passwordHash: defaultHash,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'usr_guru',
              uid: 'usr_guru',
              tenantId,
              email: 'guru@example.com',
              displayName: 'Ahmad S.Pd',
              role: 'guru',
              roles: ['guru'],
              status: 'active',
              passwordHash: defaultHash,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'usr_siswa',
              uid: 'usr_siswa',
              tenantId,
              email: 'siswa@example.com',
              displayName: 'Ahmad Fauzan',
              role: 'siswa',
              roles: ['siswa'],
              status: 'active',
              passwordHash: defaultHash,
              createdAt: new Date().toISOString(),
            },
          ];
          await localDb.users.bulkPut(defaultUsers);
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding users:', e);
      }

      // 9. Seed Sample Letters (PTSP)
      try {
        const letterCount = await localDb.letters.count();
        if (letterCount === 0) {
          await localDb.letters.put({
            id: 'let_001',
            tenantId,
            userId: 'usr_siswa',
            title: 'Surat Permohonan Dispensasi Lomba MTQ',
            type: 'Dispensasi',
            status: 'Approved',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding letters:', e);
      }

      // 10. Seed Sample Attendance records (Absensi)
      try {
        const attCount = await localDb.attendance.count();
        if (attCount === 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          await localDb.attendance.put({
            id: 'att_001',
            tenantId,
            studentsId: 'STD_001',
            classId: 'cls_10a',
            date: todayStr,
            status: 'Hadir',
            method: 'online_qr',
            syncedToCloud: true,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.error('[DexieOperationalSeeder] Error seeding attendance:', e);
      }

      console.log('[DexieOperationalSeeder] e-MAM Enterprise Hierarchy & Operational Data Seeding completed successfully.');
    } catch (err) {
      console.error('[DexieOperationalSeeder] Error seeding operational data:', err);
    }
  }
}


