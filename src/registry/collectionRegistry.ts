import type { DashboardMetadata } from '@/types/dashboard';
import { UserRole } from '@/types';
import { userRepository } from '@/repositories/userRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';

export interface CollectionConfig extends DashboardMetadata {
  repository: any;
  permissionRoles: UserRole[];
}

export const collectionRegistry: Record<string, CollectionConfig> = {
  users: {
    collection: 'users',
    title: 'Manajemen Pengguna',
    icon: 'Users',
    columns: [
      { field: 'displayName', header: 'Nama', type: 'text' },
      { field: 'email', header: 'Email', type: 'text' },
      { field: 'role', header: 'Peran', type: 'badge' },
    ],
    stats: [],
    repository: userRepository,
    permissionRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  students: {
    collection: 'students',
    title: 'Data Siswa',
    icon: 'Users',
    columns: [
      { field: 'fullName', header: 'Nama Lengkap', type: 'text' },
      { field: 'nisn', header: 'NISN', type: 'text' },
    ],
    stats: [],
    repository: studentRepository,
    permissionRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GURU],
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
};
