import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

const app = initializeApp(appletConfig);
const db = getFirestore(app, appletConfig.firestoreDatabaseId);

async function seedMockData() {
  console.log('Starting to seed mock data...');

  try {
    // 1. Mock Teacher
    const teacherId = 'T001';
    await setDoc(doc(db, 'teachers', teacherId), {
      name: 'Budi Santoso, M.Pd.',
      nip: '198001012005011001',
      subject: 'Matematika',
      status: 'PNS',
      jabatan: 'Guru Mata Pelajaran',
      isClaimed: false,
      email: 'budi.santoso@example.com',
      address: 'Jl. Pendidikan No. 1, Barabai',
    });
    console.log('Teacher seeded.');

    // 2. Mock Student
    const studentId = 'S12345';
    await setDoc(doc(db, 'students', studentId), {
      idUnik: studentId,
      namaLengkap: 'Ahmad Fauzi',
      nisn: '0012345678',
      tingkatRombel: '10 A',
      status: 'Aktif',
      jenisKelamin: 'Laki-laki',
      tanggalLahir: '2008-05-15',
      isClaimed: false,
      noTelepon: '081234567890',
      alamat: 'Jl. Kebangsaan No. 10, Barabai',
      lastModified: new Date().toISOString(),
    });
    console.log('Student seeded.');

    // 3. Mock News
    await addDoc(collection(db, 'news'), {
      title: 'Prestasi Siswa MAN 1 HST',
      summary: 'Siswa kelas 10 berhasil menjuarai lomba matematika tingkat provinsi.',
      content:
        'Selamat kepada Ahmad Fauzi atas pencapaian luar biasa dalam lomba Olimpiade Matematika tingkat provinsi yang diselenggarakan di Banjarmasin minggu lalu.',
      category: 'Prestasi',
      author: 'Admin Madrasah',
      date: new Date().toISOString(),
      isPublished: true,
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('News seeded.');

    // 4. Mock Class
    await setDoc(doc(db, 'classes', 'C10A'), {
      name: '10 A',
      level: '10',
      teacherId: teacherId,
      teacherName: 'Budi Santoso, M.Pd.',
      academicYear: '2025/2026',
    });
    console.log('Class seeded.');

    console.log('Mock data seed completed successfully.');
  } catch (err: any) {
    console.error('Error seeding mock data:', err.message);
  }
}

seedMockData();
