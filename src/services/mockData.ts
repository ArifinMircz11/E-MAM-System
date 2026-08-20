export const MOCK_NEWS = [
  {
    id: '1',
    title: 'Selamat Datang di Madrasah e-Mam',
    summary: 'Selamat datang di semester baru.',
    content: 'Kami mengucapkan selamat datang kepada seluruh siswa dan guru.',
    category: 'Umum',
    author: 'Admin',
    authorUid: '1',
    date: '2026-05-14T08:00:00Z',
    isPublished: true,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Pengumuman Jadwal Ujian Semester Genap',
    summary: 'Informasi mengenai ujian.',
    content: 'Ujian semester akan dimulai minggu depan.',
    category: 'Akademik',
    author: 'Kurikulum',
    authorUid: '2',
    date: '2026-05-13T08:00:00Z',
    isPublished: true,
    featured: false,
    image:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Ekstrakurikuler Robotik Meraih Juara Nasional',
    summary: 'Prestasi membanggakan dari tim robotik.',
    content: 'Tim robotik madrasah berhasil meraih juara 1 di tingkat nasional.',
    category: 'Prestasi',
    author: 'Kesiswaan',
    authorUid: '3',
    date: '2026-05-12T08:00:00Z',
    isPublished: true,
    featured: false,
    image:
      'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=1000&auto=format&fit=crop',
  },
];

export const MOCK_TICKER = [];

export const MOCK_STUDENTS = [
  {
    idUnik: 'S001',
    namaLengkap: 'Budi Santoso',
    nisn: '1234567890',
    tingkatRombel: 'X-A',
    status: 'Aktif' as const,
    jenisKelamin: 'Laki-laki' as const,
    isClaimed: false,
  },
  {
    idUnik: 'S002',
    namaLengkap: 'Siti Aminah',
    nisn: '1234567891',
    tingkatRombel: 'X-B',
    status: 'Aktif' as const,
    jenisKelamin: 'Perempuan' as const,
    isClaimed: false,
  },
];

export const MOCK_TEACHERS = [
  {
    id: 'T001',
    name: 'Pak Ahmad',
    nip: '111',
    subject: 'Matematika',
    status: 'PNS' as const,
    isClaimed: false,
  },
  {
    id: 'T002',
    name: 'Bu Ani',
    nip: '222',
    subject: 'Bahasa Indonesia',
    status: 'GTY' as const,
    isClaimed: false,
  },
];

export const MOCK_MADRASAH_INFO = {
  nama: 'Madrasah e-Mam System',
  nsm: '111222333',
  npsn: '12345678',
  alamat: 'Jl. Contoh No. 123',
  telepon: '081234567890',
  email: 'info@emam-system.web.id',
  website: 'https://emam-system.web.id',
  kepalaNama: 'Kepala Madrasah',
  kepalaNip: '000000',
  akreditasi: 'A',
  visi: 'Menjadi madrasah unggul.',
  misi: ['Misi 1', 'Misi 2'],
  photo: '',
};
