import { auditLog } from './auditLogService';
import { SettingsRepository } from '@/repositories/SettingsRepository';
import { auditRepository } from '@/repositories/auditRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { classRepository } from '@/repositories/classRepository';
import { userRepository } from '@/repositories/userRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

/**
 * Mengambil informasi madrasah dari pengaturan
 */
export async function fetchMadrasahInfo() {
  try {
    const context = getSecurityContext(false);
    if (!context) return null;
    const setting = await SettingsRepository.get(context, 'madrasah_info');
    return setting ? setting.value : null;
  } catch (err) {
    console.error('Failed to fetch madrasah info:', err);
    return null;
  }
}

export async function saveMadrasahInfoSettings(data: any): Promise<boolean> {
  try {
    const context = getSecurityContext(true);
    if (!context) return false;
    await SettingsRepository.save(context, 'madrasah_info', data);

    await auditLog({
      action: 'UPDATE_MADRASAH_INFO',
      category: 'SYSTEM',
      details: `Madrasah info updated`,
    });

    return true;
  } catch (err) {
    console.error('Failed to save madrasah info:', err);
    return false;
  }
}

export async function getMasterVersion() {
  try {
    const context = getSecurityContext(false);
    if (!context) return 1;
    const setting = await SettingsRepository.get(context, 'master_version');
    return setting?.value?.version || 1;
  } catch (error) {
    console.error('[SystemService] Failed to get master version:', error);
    return 1;
  }
}

export async function incrementMasterVersion() {
  try {
    const context = getSecurityContext(true);
    if (!context) return false;
    const verNum = Math.floor(Date.now() / 1000);
    
    await SettingsRepository.save(context, 'master_version', {
      version: verNum,
      lastAction: 'MASTER_DATA_CHANGED',
    });

    return true;
  } catch (error: any) {
    console.error('[SystemService] Failed to increment master version:', error);
    return false;
  }
}

export async function updateMaintenanceConfig(isMaintenance: boolean) {
  try {
    const context = getSecurityContext(true);
    if (!context) return false;
    await SettingsRepository.save(context, 'maintenance_config', {
      isMaintenance,
    });

    await incrementMasterVersion();
    return true;
  } catch (err) {
    console.error('Failed to update maintenance config:', err);
    return false;
  }
}

export async function getSystemConfigWithCache(docId: string) {
  try {
    const context = getSecurityContext(false);
    if (!context) return null;
    const setting = await SettingsRepository.get(context, docId);
    return setting ? setting.value : null;
  } catch (err: any) {
    console.error(`Failed to fetch system_settings/${docId}:`, err);
  }
  return null;
}

/**
 * Mengatur Feature Locks (Penguncian Fitur Sistem)
 */
export async function updateFeatureLocks(lockedFeatures: Record<string, boolean>) {
  try {
    const context = getSecurityContext(true);
    if (!context) return false;
    await SettingsRepository.save(context, 'feature_locks', {
      locked: lockedFeatures,
    });

    await auditLog({
      action: 'UPDATE_FEATURE_LOCKS',
      category: 'SYSTEM',
      details: `Feature locks updated: ${Object.keys(lockedFeatures || {})
        .filter((k) => lockedFeatures?.[k])
        .join(', ')}`,
    });

    return true;
  } catch (e) {
    console.error('Failed to update feature locks:', e);
    return false;
  }
}

/**
 * Mengatur Role Permissions (Hak Akses Peran)
 */
export async function updateRolePermissions(rolePermissions: any) {
  try {
    const context = getSecurityContext(true);
    if (!context) return false;
    await SettingsRepository.save(context, 'role_permissions', rolePermissions);

    await auditLog({
      action: 'UPDATE_ROLE_PERMISSIONS',
      category: 'SECURITY',
      details: `Role permissions updated`,
    });

    return true;
  } catch (e) {
    console.error('Failed to update role permissions:', e);
    return false;
  }
}

/**
 * Mengatur Fitur Sistem (Enable/Disable modules)
 */
export async function updateSystemFeatures(features: any) {
  try {
    const context = getSecurityContext(true);
    if (!context) return false;
    await SettingsRepository.save(context, 'features', features);

    await auditLog({
      action: 'UPDATE_SYSTEM_FEATURES',
      category: 'SYSTEM',
      details: `System features updated`,
    });

    return true;
  } catch (e) {
    console.error('Failed to update system features:', e);
    return false;
  }
}

/**
 * Mengirim Pengumuman/Alert Sistem (System Broadcast)
 */
export async function broadcastSystemAlert(alert: {
  title: string;
  message: string;
  type: string;
  isActive: boolean;
}) {
  try {
    const context = getSecurityContext(true);
    if (!context) return false;
    await SettingsRepository.save(context, 'active_alert', alert);

    await auditLog({
      action: 'SYSTEM_BROADCAST',
      category: 'SYSTEM',
      details: `Broadcast alert: ${alert.title}`,
    });

    return true;
  } catch (e) {
    console.error('Failed to broadcast system alert:', e);
    return false;
  }
}

/**
 * Mengambil statistik koleksi secara global (Developer/SuperAdmin only)
 */
export async function getCollectionStats(tenantId?: string) {
  try {
    const stats: Record<string, number> = {};

    const targetTenantId = tenantId || 'global';
    
    const [students, teachers, classes, users] = await Promise.all([
      studentRepository.findAll(targetTenantId),
      teacherRepository.findAll(targetTenantId),
      classRepository.findAll(targetTenantId),
      userRepository.findAll(targetTenantId)
    ]);

    stats['students'] = students.length;
    stats['teachers'] = teachers.length;
    stats['classes'] = classes.length;
    stats['users'] = users.length;

    return stats;
  } catch (e) {
    console.error('Failed to fetch collection stats:', e);
    return {};
  }
}

// Module-level cache variables for app version
let cachedVersion: string | null = null;
let lastVersionFetch = 0;
const VERSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Get active application version from cloud configuration (with in-memory cache)
 */
export async function getAppVersion(): Promise<string | null> {
  try {
    const now = Date.now();
    if (cachedVersion && (now - lastVersionFetch < VERSION_CACHE_TTL)) {
      return cachedVersion;
    }

    const context = getSecurityContext(false);
    if (!context) return null;
    const setting = await SettingsRepository.get(context, 'app_version');
    const version = setting?.value?.version || null;

    if (version) {
      cachedVersion = version;
      lastVersionFetch = now;
    }
    return version;
  } catch (error) {
    console.warn('[SystemService] Failed to get app version:', error);
    return null;
  }
}

/**
 * Mengambil Log Sistem Umum
 */
export async function fetchSystemLogs(tenantId: string) {
  try {
    return await auditRepository.getByTenantId(tenantId);
  } catch (e) {
    console.error('Failed to fetch system logs:', e);
    return [];
  }
}

/**
 * RESET LOCAL DATABASE (SELF-HEALING)
 * Digunakan untuk membersihkan cache lokal dan queue yang korup.
 */
export async function resetLocalDatabase() {
  try {
    const { localDbOperations } = await import('../database/offlineService');
    await localDbOperations.clearAllData();
    console.log('[SystemService] Local database has been reset successfully.');

    // Reload page to re-initialize everything cleanly
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return true;
  } catch (error) {
    console.error('[SystemService] Failed to reset local database:', error);
    return false;
  }
}
