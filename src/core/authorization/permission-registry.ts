import { MASTER_PERMISSIONS } from './permission/MasterPermissionCatalog';

/**
 * PERMISSION REGISTRY
 * 
 * Katalog seluruh hak akses (permissions) yang tersedia dalam sistem.
 * Digunakan untuk validasi kebijakan (Policy) dan rendering UI.
 */

export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  category: 'SYSTEM' | 'USER' | 'STUDENT' | 'TEACHER' | 'ATTENDANCE' | 'CLASS' | 'FINANCE' | 'REPORT' | 'SECURITY';
  scopes: ('GLOBAL' | 'KANWIL' | 'KEMENAG' | 'MADRASAH')[];
}

export const PERMISSION_REGISTRY: Record<string, PermissionDefinition> = {
  [MASTER_PERMISSIONS.SYSTEM_MANAGE]: {
    key: MASTER_PERMISSIONS.SYSTEM_MANAGE,
    label: 'Manajemen Sistem',
    description: 'Akses penuh ke konfigurasi sistem global.',
    category: 'SYSTEM',
    scopes: ['GLOBAL']
  },
  [MASTER_PERMISSIONS.TENANT_MANAGE]: {
    key: MASTER_PERMISSIONS.TENANT_MANAGE,
    label: 'Manajemen Tenant',
    description: 'Mengelola entitas madrasah/organisasi.',
    category: 'SYSTEM',
    scopes: ['GLOBAL', 'KANWIL', 'KEMENAG']
  },
  [MASTER_PERMISSIONS.STUDENT_VIEW]: {
    key: MASTER_PERMISSIONS.STUDENT_VIEW,
    label: 'Lihat Siswa',
    description: 'Melihat data profil siswa.',
    category: 'STUDENT',
    scopes: ['KANWIL', 'KEMENAG', 'MADRASAH']
  },
  [MASTER_PERMISSIONS.STUDENT_CREATE]: {
    key: MASTER_PERMISSIONS.STUDENT_CREATE,
    label: 'Tambah Siswa',
    description: 'Menambahkan data siswa baru.',
    category: 'STUDENT',
    scopes: ['MADRASAH']
  },
  // ... Tambahkan pemetaan lainnya sesuai kebutuhan sistem
};

/**
 * Mendapatkan definisi permission berdasarkan key.
 */
export function getPermission(key: string): PermissionDefinition | undefined {
  return PERMISSION_REGISTRY[key];
}

/**
 * Mendapatkan semua permission dalam kategori tertentu.
 */
export function getPermissionsByCategory(category: string): PermissionDefinition[] {
  return Object.values(PERMISSION_REGISTRY).filter(p => p.category === category);
}
