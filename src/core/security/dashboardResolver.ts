import { UserRole, ViewState } from '@/types';
import { ArchitectureBoundaryEnforcer } from '../boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '../boundary/ArchitectureBoundaryError';

/**
 * Dashboard Resolver
 * Resolves the default initial dashboard view based on user role and permissions.
 * Menegakkan Boundary bahwa dashboard WAJIB sesuai dengan effective role.
 */
export const resolveDashboardForRole = (role?: UserRole | string): ViewState => {
  if (!role) {
    throw new ArchitectureBoundaryError(
      'dashboard',
      'DASHBOARD_ROLE_MISMATCH',
      'Tidak dapat menentukan dashboard: role tidak disediakan. Fallback dilarang.'
    );
  }

  const normalized = String(role).toLowerCase().trim();

  switch (normalized) {
    case UserRole.DEVELOPER:
    case 'developer':
      return ViewState.DASHBOARD;
    case UserRole.SUPER_ADMIN:
    case 'super_admin':
    case UserRole.ADMIN:
    case 'admin':
    case UserRole.ADMIN_MADRASAH:
    case 'admin_madrasah':
    case UserRole.KEPALA_MADRASAH:
    case 'kepala_madrasah':
    case UserRole.WAKAMAD:
    case 'wakamad':
    case UserRole.KEPALA_TU:
    case 'kepala_tu':
    case UserRole.STAF:
    case 'staf':
    case UserRole.STAF_TU:
    case 'staf_tu':
      return ViewState.DASHBOARD;
    case UserRole.GURU:
    case 'guru':
    case UserRole.WALI_KELAS:
    case 'wali_kelas':
      return ViewState.DASHBOARD;
    case UserRole.GURU_BK:
    case 'guru_bk':
    case UserRole.BK:
    case 'bk':
      return ViewState.DASHBOARD_BK;
    case UserRole.ORANG_TUA:
    case 'orang_tua':
    case 'orangtua':
    case 'wali_murid':
      return ViewState.PARENT_PORTAL;
    case UserRole.SISWA:
    case 'siswa':
      return ViewState.DASHBOARD;
    case UserRole.TAMU:
    case 'tamu':
    case 'guest':
      return ViewState.GUEST_DASHBOARD;
    default:
      // Tolak role tidak dikenal dan jangan fallback diam-diam
      throw new ArchitectureBoundaryError(
        'dashboard',
        'DASHBOARD_ROLE_MISMATCH',
        `Role '${role}' tidak memiliki konfigurasi dashboard terdaftar.`
      );
  }
};

