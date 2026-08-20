import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { UserRole, AccountType } from '@/types/roles';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';
import { reportArchitectureViolation } from '@/core/monitoring/ArchitectureGuard';

export class LegacyUserAdapter {
  static convertLegacyUserToCanonicalUser(legacyUser: any): CanonicalUser | null {
    if (!legacyUser) return null;

    const email = (legacyUser.email || '').toLowerCase().trim();
    
    // Periksa role tanpa fallback diam-diam
    const rawRole = (legacyUser.role || legacyUser.userRole || legacyUser.peran || '').toLowerCase().trim();
    
    const isDevEmail = email === 'developer@example.com' || email === 'admin@example.com' || email === 'mirzanovilawati@gmail.com';
    const isDevRole = rawRole === 'developer' || legacyUser.isDeveloper;
    const rolesArray = Array.isArray(legacyUser.roles) 
      ? legacyUser.roles.map((r: any) => String(r).toLowerCase().trim()) 
      : [];
    const isDeveloper = isDevEmail || isDevRole || rolesArray.includes('developer');

    // Jika akun terindikasi developer berdasarkan email atau role, pastikan tidak tertukar
    if (isDeveloper) {
      const uid = legacyUser.uid || legacyUser.id || '';
      if (!uid) {
        throw new ArchitectureBoundaryError(
          'identity',
          'IDENTITY_UID_MISSING',
          'Identitas Developer tidak memiliki UID / ID yang valid.'
        );
      }

      const namaTampilan = legacyUser.namaTampilan || legacyUser.displayName || legacyUser.name || 'Developer';

      const canonicalDev: CanonicalUser = {
        uid,
        id: uid,
        email: email || 'developer@emam.internal',
        displayName: namaTampilan,
        version: legacyUser.version || 1,
        rbacVersion: legacyUser.rbacVersion || 1,
        securityVersion: legacyUser.securityVersion || 1,
        schemaVersion: 2,
        accountType: 'developer',
        role: 'developer',
        roles: ['developer'],
        tenantId: legacyUser.tenantId || 'system',
        scopeType: 'global',
        scopeId: 'global',
        status: (legacyUser.status === 'aktif' || legacyUser.status === 'active') ? 'active' : (legacyUser.status || 'active'),
        isActive: true,
        isSso: Boolean(legacyUser.isSso),
        isClaimed: Boolean(legacyUser.isClaimed),
        profile: {
          email: email || 'developer@emam.internal',
          displayName: namaTampilan,
          photoURL: legacyUser.photoURL || null,
        },
        metadata: legacyUser.metadata || {},
        referenceId: legacyUser.referenceId || legacyUser.idUnik || null,
        permissions: legacyUser.permissions || ['*'],
        createdAt: typeof legacyUser.createdAt === 'number' ? legacyUser.createdAt : Date.now(),
        updatedAt: Date.now(),
        deleted: false,
        syncStatus: legacyUser.syncStatus || 'synced',
      };

      // Validasi kontrak developer
      ArchitectureBoundaryEnforcer.enforceUserContract(canonicalDev);
      return canonicalDev;
    }

    // Jika bukan developer, role WAJIB tersedia secara eksplisit (DILARANG fallback diam-diam ke 'siswa')
    if (!rawRole && rolesArray.length === 0) {
      throw new ArchitectureBoundaryError(
        'user_contract',
        'USER_CONTRACT_INVALID',
        `Pengguna '${email || legacyUser.uid || legacyUser.id}' tidak memiliki peran (role) yang terdaftar. Fallback default dilarang.`,
        { email, uid: legacyUser.uid, id: legacyUser.id }
      );
    }

    const roleMapping: Record<string, { role: string; accountType: 'developer' | 'madrasah' | 'student' | 'teacher'; level: 'global' | 'tenant' }> = {
      developer: { role: 'developer', accountType: 'developer', level: 'global' },
      admin: { role: 'admin', accountType: 'madrasah', level: 'tenant' },
      admin_madrasah: { role: 'admin_madrasah', accountType: 'madrasah', level: 'tenant' },
      administrator: { role: 'admin', accountType: 'madrasah', level: 'tenant' },
      kamad: { role: 'kepala_madrasah', accountType: 'madrasah', level: 'tenant' },
      kepala_madrasah: { role: 'kepala_madrasah', accountType: 'madrasah', level: 'tenant' },
      kepala_tu: { role: 'kepala_tu', accountType: 'madrasah', level: 'tenant' },
      staf_tu: { role: 'staf_tu', accountType: 'madrasah', level: 'tenant' },
      guru: { role: 'guru', accountType: 'madrasah', level: 'tenant' },
      wali_kelas: { role: 'guru', accountType: 'madrasah', level: 'tenant' },
      guru_bk: { role: 'guru_bk', accountType: 'madrasah', level: 'tenant' },
      staf: { role: 'staf', accountType: 'madrasah', level: 'tenant' },
      siswa: { role: 'siswa', accountType: 'madrasah', level: 'tenant' },
      orang_tua: { role: 'orang_tua', accountType: 'madrasah', level: 'tenant' },
      orangtua: { role: 'orang_tua', accountType: 'madrasah', level: 'tenant' },
      wali_murid: { role: 'orang_tua', accountType: 'madrasah', level: 'tenant' },
    };

    const mapped = roleMapping[rawRole];
    const role = String(mapped ? mapped.role : rawRole);
    let roles: string[] = Array.isArray(legacyUser.roles) && legacyUser.roles.length > 0 ? legacyUser.roles : [role];
    roles = Array.from(new Set(roles.map((r: string) => String(r).toLowerCase().trim())));

    // Deteksi pemakaian legacy field untuk audit guardian
    if (legacyUser.idTenant) {
      reportArchitectureViolation('user_contract', 'Deteksi pemakaian legacy field "idTenant". Telah dinormalisasi ke "tenantId".', { idTenant: legacyUser.idTenant });
    }
    if (legacyUser.peran) {
      reportArchitectureViolation('user_contract', 'Deteksi pemakaian legacy field "peran". Telah dinormalisasi ke "role".', { peran: legacyUser.peran });
    }

    let tenantId = legacyUser.tenantId || legacyUser.idTenant;
    const scopeLevel = mapped ? (mapped.level as any) : 'tenant';

    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '' || tenantId === 'unknown' || tenantId === 'default' || tenantId === 'system' || tenantId === 'developer') {
      const fallbackUid = legacyUser.uid || legacyUser.id || 'unknown';
      throw new ArchitectureBoundaryError(
        'tenant',
        'TENANT_ACCESS_DENIED',
        `Fail-Closed: Missing or invalid explicit tenantId for user "${email || fallbackUid}". Fallback tenant is strictly forbidden.`,
        { email, uid: legacyUser.uid }
      );
    }
    tenantId = tenantId.trim();

    const scope = legacyUser.scope && typeof legacyUser.scope === 'object' ? { ...legacyUser.scope } : { level: scopeLevel };
    if (!scope.level) {
      scope.level = scopeLevel;
    }

    let status: any = 'active';
    const rawStatus = String(legacyUser.status || '').toLowerCase();
    if (rawStatus === 'aktif' || rawStatus === 'active') status = 'active';
    else if (rawStatus === 'nonaktif' || rawStatus === 'inactive') status = 'inactive';
    else if (rawStatus === 'suspended' || rawStatus === 'suspend') status = 'suspended';
    else if (rawStatus === 'pending') status = 'pending';
    else if (rawStatus === 'rejected') status = 'rejected';

    const namaTampilan = legacyUser.namaTampilan || legacyUser.displayName || legacyUser.name || 'User';
    const uid = legacyUser.uid || legacyUser.id || '';

    if (!uid) {
      throw new ArchitectureBoundaryError(
        'identity',
        'IDENTITY_UID_MISSING',
        'Identitas Pengguna tidak memiliki UID / ID yang valid.'
      );
    }

    // Mapping referenceId dengan audit compatibility
    const referenceId = legacyUser.referenceId || legacyUser.idUnik || legacyUser.studentsId || legacyUser.teachersId || null;
    if (legacyUser.idUnik && !legacyUser.referenceId) {
      reportArchitectureViolation('user_contract', 'Audit legacy field "idUnik" dipetakan ke canonical "referenceId".', { idUnik: legacyUser.idUnik });
    }

    const canonicalUser: CanonicalUser = {
      uid,
      id: uid,
      email: email || 'user@emam.internal',
      displayName: namaTampilan,
      version: legacyUser.version || 1,
      rbacVersion: legacyUser.rbacVersion || 1,
      securityVersion: legacyUser.securityVersion || 1,
      schemaVersion: legacyUser.schemaVersion || 2,
      tenantId,
      scopeType: legacyUser.scopeType || 'tenant',
      scopeId: legacyUser.scopeId || tenantId,
      accountType: (mapped?.accountType as any) || 'madrasah',
      role: role,
      roles: roles,
      status,
      isActive: status === 'active',
      isSso: Boolean(legacyUser.isSso),
      isClaimed: Boolean(legacyUser.isClaimed),
      approvalStatus: legacyUser.approvalStatus || legacyUser.metadata?.approvalStatus || (status === 'pending' ? 'pending' : 'approved'),
      permissions: legacyUser.permissions || [],
      profile: {
        email: email || 'user@emam.internal',
        displayName: namaTampilan,
        photoURL: legacyUser.photoURL || null,
      },
      metadata: legacyUser.metadata || {},
      referenceId: referenceId,
      studentsId: legacyUser.studentsId || null,
      teachersId: legacyUser.teachersId || null,
      createdAt: typeof legacyUser.createdAt === 'number' ? legacyUser.createdAt : Date.now(),
      updatedAt: Date.now(),
      deleted: false,
      scope: scope as any,
      syncStatus: legacyUser.syncStatus || 'synced',
    };

    ArchitectureBoundaryEnforcer.enforceUserContract(canonicalUser);
    return canonicalUser;
  }

  static normalizeCanonicalUser(user: any): CanonicalUser | null {
    return this.convertLegacyUserToCanonicalUser(user);
  }
}

