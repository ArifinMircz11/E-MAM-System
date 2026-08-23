import { getCurrentUser } from '@/services/authService';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import type { MadrasahData } from '@/types';
import { UserRole } from '@/types';
import { ensureStringIds } from '@/utils/schemaHelpers';

/**
 * Seed utility. All Firestore access is routed through FirestoreGateway.
 * Seed operations require an authoritative SecurityContext tenant.
 */
const defaultMadrasahInfo: MadrasahData = {
  nama: 'MAN 1 HULU SUNGAI TENGAH', nsm: '131163070001', npsn: '30315354',
  alamat: 'Jl. H. Damanhuri No. 12 Barabai', telepon: '0517-41234',
  email: 'info@example.com', website: 'www.example.com',
  kepalaNama: 'Drs. H. Syamsul Arifin', kepalaNip: '196808171995031002',
  akreditasi: 'A (Unggul)', visi: 'Mewujudkan Madrasah yang Islami, Mandiri, Amanah, dan Maju melalui keunggulan akademik dan akhlak mulia.',
  misi: ['Menanamkan nilai-nilai religius dalam setiap aspek pembelajaran.', 'Meningkatkan kompetensi guru dan tenaga kependidikan.', 'Menyediakan fasilitas pembelajaran berbasis teknologi modern.', 'Membangun karakter siswa yang tangguh dan berjiwa sosial.'],
  photo: '', logoApp: '', logoSurat: '', logoLayanan: '', logoFull: '', motto: 'Islami, Mandiri, Amanah, Maju',
};

const defaultRolePermissions: Record<string, string[]> = {
  [UserRole.ADMIN]: ['all'], [UserRole.DEVELOPER]: ['all'],
  [UserRole.KEPALA_MADRASAH]: ['students', 'teachers', 'classes', 'attendance', 'reports', 'news', 'letters'],
  [UserRole.GURU]: ['attendance', 'classes', 'schedules', 'news', 'letters', 'student_points'],
  [UserRole.WALI_KELAS]: ['attendance', 'classes', 'schedules', 'news', 'letters', 'students', 'student_points'],
  [UserRole.STAF]: ['students', 'teachers', 'letters', 'news', 'attendance'],
  [UserRole.SISWA]: ['schedules', 'points', 'news', 'letters', 'attendance_history'],
  [UserRole.ORANG_TUA]: ['schedules', 'points', 'news', 'attendance_history'],
};

function requireTenantId(): string {
  if (!SecurityContextService.isReady()) throw new Error('SEED_SECURITY_CONTEXT_NOT_READY');
  const tenantId = SecurityContextService.getContext().tenantId?.trim();
  if (!tenantId || ['default', 'global', 'unknown'].includes(tenantId.toLowerCase())) throw new Error('SEED_TENANT_INVALID');
  return tenantId;
}

export const seedInitialData = async () => {
  if (!getCurrentUser()) return;
  try {
    const db = dbGateway.db;
    const tenantId = requireTenantId();
    const settings = ['madrasah_info', 'role_permissions', 'features', 'maintenance_config', 'feature_locks'];
    for (const key of settings) {
      const ref = dbGateway.doc(db, 'system_settings', key);
      const snap = await dbGateway.getDoc(ref);
      if (snap.exists()) continue;
      const data = key === 'madrasah_info' ? { ...defaultMadrasahInfo, tenantId } : key === 'role_permissions' ? { tenantId, permissions: defaultRolePermissions } : key === 'features' ? { tenantId, scheduleReminder: true } : key === 'maintenance_config' ? { tenantId, isMaintenance: false, allowedRoles: ['Developer', 'Admin'], message: 'Update rutin, silakan kembali nanti.' } : { tenantId, locked: ['reports', 'teacher_attendance', 'advisor'] };
      await dbGateway.setDoc(ref, data);
    }
    const unified = dbGateway.doc(db, 'system', 'config');
    if (!(await dbGateway.getDoc(unified)).exists()) await dbGateway.setDoc(unified, { tenantId, master_version: 1, feature_locks: ['reports', 'teacher_attendance', 'advisor'], role_permissions: defaultRolePermissions, maintenance_mode: false, last_updated: new Date().toISOString() });
  } catch (e: any) {
    if (e.code === 'permission-denied') console.log('[CoreSystem] Access Restricted (Standard Privilege)');
    else if (e.message?.includes('offline')) console.warn('[CoreSystem] Offline Mode Active');
    else console.error('[CoreSystem] Integrity Check Error:', e.message);
  }
};

export const seedDummyStudents = async (targetClass = '10 A') => {
  const tenantId = requireTenantId();
  const db = dbGateway.db;
  const q = dbGateway.query(dbGateway.collection(db, 'students'), dbGateway.where('tenantId', '==', tenantId), dbGateway.where('classId', '==', targetClass), dbGateway.limit(1));
  const snap = await dbGateway.getDocs(q);
  if (!snap.empty) return;
  for (let i = 1; i <= 20; i++) {
    const idUnik = `${tenantId}_IDS_${1000 + i}`;
    await dbGateway.setDoc(dbGateway.doc(db, 'students', idUnik), ensureStringIds({ idUnik, namaLengkap: `Dummy Student ${i}`, tingkatRombel: targetClass, classId: targetClass, className: targetClass, rombelId: targetClass, status: 'Aktif', isClaimed: false, point: 0, tenantId, createdAt: new Date().toISOString() }));
  }
};
