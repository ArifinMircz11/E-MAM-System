/**
 * PHASE: FIRESTORE LEGACY DATA EXTRACTION
 * PURPOSE: Export raw Firestore collections before Enterprise Data Dictionary V7.8 migration
 * 
 * Identity Mapper: users, identity_profiles, user_roles
 */


export interface LegacyUser {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
  roles?: string[];
  tenantId: string;
  teachersId?: string;
  studentsId?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Maps legacy users collection to V7.8 entity structures:
 * 1. user Account (users)
 * 2. Identity Profile (identity_profiles)
 * 3. Role Assignment (user_roles)
 */
export function mapLegacyUser(legacy: LegacyUser) {
  const userId = legacy.uid ? `usr_${legacy.uid}` : `usr_generated_${Math.random().toString(36).substr(2, 9)}`;
  const tenantId = legacy.tenantId || 'default_tenant';

  // 1. Map to modern User Account
  const userAccount = {
    id: userId,
    tenantId: tenantId,
    authUid: legacy.uid || '',
    uid: legacy.uid || '', // Keep for backward compatibility
    username: legacy.email ? legacy.email.split('@')[0] : `user_${legacy.uid}`,
    email: legacy.email || '',
    displayName: legacy.displayName || 'Unnamed User',
    accountType: legacy.role === 'admin' ? 'SYSTEM_ADMIN' : 'TENANT_USER',
    status: legacy.status ? legacy.status.toUpperCase() : 'ACTIVE',
    createdAt: formatTimestamp(legacy.createdAt),
    updatedAt: formatTimestamp(legacy.updatedAt || legacy.createdAt),
    createdBy: 'system_migration',
    updatedBy: 'system_migration',
    version: 1,
    schemaVersion: 1,
    syncStatus: 'synced' as const,
    deleted: false
  };

  // 2. Map to modern Identity Profile
  const identityProfile = {
    id: `prof_${userId}`,
    userId: userId,
    tenantId: tenantId,
    namaLengkap: legacy.displayName || 'Unnamed User',
    nik: '', // Will be completed by manual audit
    nomorIdentitas: legacy.teachersId || legacy.studentsId || '',
    tanggalLahir: '1970-01-01',
    jenisKelamin: 'L', // Default to avoid validation fail
    alamat: {
      jalan: '',
      rt: '',
      rw: '',
      kelurahan: '',
      kecamatan: '',
      kabupaten: '',
      provinsi: '',
      kodePos: ''
    },
    kontak: {
      noHp: '',
      noTelp: '',
      emailAlternatif: legacy.email || '',
      telegramId: ''
    },
    avatarUrl: null,
    createdAt: formatTimestamp(legacy.createdAt),
    updatedAt: formatTimestamp(legacy.updatedAt || legacy.createdAt),
    createdBy: 'system_migration',
    updatedBy: 'system_migration',
    version: 1,
    schemaVersion: 1,
    syncStatus: 'synced' as const,
    deleted: false
  };

  // 3. Map to modern User Roles
  const rolesList: string[] = [];
  if (legacy.roles && Array.isArray(legacy.roles)) {
    legacy.roles.forEach(r => rolesList.push(r.toUpperCase()));
  } else if (legacy.role) {
    rolesList.push(legacy.role.toUpperCase());
  } else {
    rolesList.push('GURU'); // default
  }

  const roleAssignments = rolesList.map((r, index) => ({
    id: `role_${userId}_${r}`,
    userId: userId,
    tenantId: tenantId,
    role: r,
    permissions: [],
    scope: {
      schoolId: tenantId,
      classIds: [],
      subjectIds: []
    },
    assignedAt: formatTimestamp(legacy.createdAt),
    assignedBy: 'system_migration',
    version: 1,
    schemaVersion: 1,
    syncStatus: 'synced' as const,
    deleted: false
  }));

  return {
    userAccount,
    identityProfile,
    roleAssignments
  };
}

function formatTimestamp(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts.toDate && typeof ts.toDate === 'function') {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'number') return new Date(ts).toISOString();
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  return new Date().toISOString();
}
