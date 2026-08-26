import { TickerItem } from '@/types';

export const MOCK_TICKER: TickerItem[] = [
  {
    id: 't-1',
    text: 'Selamat datang di e-Mam System - Sistem Informasi Manajemen Madrasah Terpadu.',
    priority: 'normal',
    active: true,
  },
  {
    id: 't-2',
    text: 'Pastikan seluruh data presensi harian siswa dan guru telah disinkronkan ke cloud.',
    priority: 'high',
    active: true,
  },
];

export const MOCK_STUDENTS = [
  {
    id: 'std-1',
    idUnik: 'STD001',
    name: 'Ahmad Fauzi',
    nisn: '0051234567',
    nis: '1001',
    classId: 'cls-7a',
    className: 'VII-A',
    gender: 'L',
    phone: '081234567890',
    tenantId: 'tenant-demo',
  },
  {
    id: 'std-2',
    idUnik: 'STD002',
    name: 'Siti Nurhaliza',
    nisn: '0051234568',
    nis: '1002',
    classId: 'cls-7a',
    className: 'VII-A',
    gender: 'P',
    phone: '081234567891',
    tenantId: 'tenant-demo',
  },
];

export const MOCK_TEACHERS = [
  {
    id: 'tch-1',
    idUnik: 'TCH001',
    name: 'Drs. H. Muhammad Arifin, M.Pd.',
    nip: '197501012000031001',
    subject: 'Matematika',
    phone: '081122334455',
    tenantId: 'tenant-demo',
  },
];

export const MOCK_CLASSES = [
  {
    id: 'cls-7a',
    name: 'VII-A',
    grade: '7',
    academicYear: '2025/2026',
    waliKelasName: 'Drs. H. Muhammad Arifin, M.Pd.',
    totalStudents: 32,
    tenantId: 'tenant-demo',
  },
];
