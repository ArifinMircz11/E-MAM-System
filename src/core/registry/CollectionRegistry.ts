import {
  BookOpenIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  StarIcon,
} from 'lucide-react';
import { PERMISSIONS } from '@/types/permissions';

export interface CollectionField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'avatar' | 'badge' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  options?: { label: string; value: any; color?: string }[];
  render?: (value: any, item: any) => React.ReactNode;
  width?: string;
  required?: boolean;
  hidden?: boolean;
}

export interface CollectionMetadata {
  name: string;
  label: string;
  description: string;
  icon: any;
  primaryKey: string;
  displayField: string;
  fields: CollectionField[];
  permissions: {
    read: string;
    create: string;
    update: string;
    delete: string;
    manage?: string;
  };
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  features?: {
    import?: boolean;
    export?: boolean;
    archive?: boolean;
    activation?: boolean;
  };
}

class CollectionRegistryClass {
  private registry: Map<string, CollectionMetadata> = new Map();

  register(metadata: CollectionMetadata) {
    this.registry.set(metadata.name, metadata);
  }

  get(name: string): CollectionMetadata | undefined {
    return this.registry.get(name);
  }

  getAll(): CollectionMetadata[] {
    return Array.from(this.registry.values());
  }
}

export const CollectionRegistry = new CollectionRegistryClass();

// --- INITIAL REGISTRATION ---

// 1. STUDENTS
CollectionRegistry.register({
  name: 'students',
  label: 'Data Siswa',
  description: 'Manajemen database siswa madrasah',
  icon: GraduationCapIcon,
  primaryKey: 'idUnik',
  displayField: 'namaLengkap',
  fields: [
    { key: 'photoURL', label: 'Foto', type: 'avatar', width: '60px' },
    {
      key: 'namaLengkap',
      label: 'Nama Lengkap',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '250px',
    },
    { key: 'nisn', label: 'NISN', type: 'text', sortable: true, filterable: true, width: '120px' },
    { key: 'tingkatRombel', label: 'Rombel', type: 'badge', filterable: true, width: '100px' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      filterable: true,
      width: '100px',
      options: [
        { label: 'Aktif', value: 'Aktif', color: 'bg-emerald-100 text-emerald-700' },
        { label: 'Lulus', value: 'Lulus', color: 'bg-blue-100 text-blue-700' },
        { label: 'Mutasi', value: 'Mutasi', color: 'bg-amber-100 text-amber-700' },
        { label: 'Drop Out', value: 'Drop Out', color: 'bg-rose-100 text-rose-700' },
      ],
    },
  ],
  permissions: {
    read: PERMISSIONS.STUDENT_READ,
    create: PERMISSIONS.STUDENT_CREATE,
    update: PERMISSIONS.STUDENT_UPDATE,
    delete: PERMISSIONS.STUDENT_DELETE,
  },
  defaultSort: { key: 'namaLengkap', direction: 'asc' },
  features: { import: true, export: true, archive: true },
});

// 2. TEACHERS
CollectionRegistry.register({
  name: 'teachers',
  label: 'Direktori GTK',
  description: 'Manajemen Guru dan Tenaga Kependidikan',
  icon: BriefcaseIcon,
  primaryKey: 'teachersId',
  displayField: 'namaLengkap',
  fields: [
    { key: 'photoURL', label: 'Foto', type: 'avatar', width: '60px' },
    {
      key: 'namaLengkap',
      label: 'Nama Lengkap',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '250px',
    },
    {
      key: 'nip',
      label: 'NIP / NIK',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '150px',
    },
    { key: 'status', label: 'Kepegawaian', type: 'badge', filterable: true, width: '120px' },
    { key: 'role', label: 'Role Sistem', type: 'badge', width: '120px' },
  ],
  permissions: {
    read: PERMISSIONS.TEACHER_READ,
    create: PERMISSIONS.TEACHER_CREATE,
    update: PERMISSIONS.TEACHER_UPDATE,
    delete: PERMISSIONS.TEACHER_DELETE,
  },
  defaultSort: { key: 'namaLengkap', direction: 'asc' },
  features: { import: true, export: true, activation: true },
});

// 3. USERS
CollectionRegistry.register({
  name: 'users',
  label: 'Manajemen Akun',
  description: 'Data pengguna dan hak akses sistem',
  icon: ShieldCheckIcon,
  primaryKey: 'uid',
  displayField: 'displayName',
  fields: [
    {
      key: 'displayName',
      label: 'Nama Pengguna',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '200px',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '200px',
    },
    { key: 'role', label: 'Role', type: 'badge', filterable: true, width: '120px' },
    {
      key: 'accountStatus',
      label: 'Status Akun',
      type: 'badge',
      filterable: true,
      options: [
        { label: 'Active', value: 'Active', color: 'bg-emerald-100 text-emerald-700' },
        { label: 'Pending', value: 'pending_approval', color: 'bg-amber-100 text-amber-700' },
        { label: 'Suspended', value: 'suspended', color: 'bg-rose-100 text-rose-700' },
      ],
    },
  ],
  permissions: {
    read: PERMISSIONS.SYSTEM_CONFIG,
    create: PERMISSIONS.SYSTEM_CONFIG,
    update: PERMISSIONS.SYSTEM_CONFIG,
    delete: PERMISSIONS.SYSTEM_CONFIG,
  },
  features: { activation: true },
});

// 4. CLASSES
CollectionRegistry.register({
  name: 'classes',
  label: 'Rombongan Belajar',
  description: 'Pengaturan kelas dan wali kelas',
  icon: BookOpenIcon,
  primaryKey: 'id',
  displayField: 'name',
  fields: [
    { key: 'name', label: 'Nama Kelas', type: 'text', sortable: true, filterable: true },
    { key: 'tingkat', label: 'Tingkat', type: 'number', sortable: true, filterable: true },
    { key: 'waliKelas', label: 'Wali Kelas', type: 'text' },
  ],
  permissions: {
    read: PERMISSIONS.CLASS_READ,
    create: PERMISSIONS.CLASS_WRITE,
    update: PERMISSIONS.CLASS_WRITE,
    delete: PERMISSIONS.CLASS_WRITE,
  },
});

// 5. NEWS
CollectionRegistry.register({
  name: 'news',
  label: 'Berita & Pengumuman',
  description: 'Publikasi informasi madrasah',
  icon: MegaphoneIcon,
  primaryKey: 'id',
  displayField: 'title',
  fields: [
    { key: 'title', label: 'Judul', type: 'text', sortable: true, filterable: true },
    { key: 'author', label: 'Penulis', type: 'text', sortable: true },
    { key: 'category', label: 'Kategori', type: 'badge', filterable: true },
    { key: 'createdAt', label: 'Tanggal', type: 'date', sortable: true },
  ],
  permissions: {
    read: PERMISSIONS.STUDENT_READ, // News visible to those who can read students
    create: PERMISSIONS.SYSTEM_CONFIG,
    update: PERMISSIONS.SYSTEM_CONFIG,
    delete: PERMISSIONS.SYSTEM_CONFIG,
  },
});

// 6. POINT CATEGORIES
CollectionRegistry.register({
  name: 'point_categories',
  label: 'Kategori Poin',
  description: 'Daftar jenis pelanggaran dan poin',
  icon: StarIcon,
  primaryKey: 'id',
  displayField: 'name',
  fields: [
    { key: 'name', label: 'Jenis Pelanggaran', type: 'text', sortable: true, filterable: true },
    { key: 'points', label: 'Bobot Poin', type: 'number', sortable: true },
    { key: 'category', label: 'Kategori', type: 'badge', filterable: true },
  ],
  permissions: {
    read: PERMISSIONS.POINT_READ,
    create: PERMISSIONS.POINT_WRITE,
    update: PERMISSIONS.POINT_WRITE,
    delete: PERMISSIONS.POINT_WRITE,
  },
});
