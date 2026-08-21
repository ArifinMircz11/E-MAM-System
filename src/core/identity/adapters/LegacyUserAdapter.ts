import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { UserRole, AccountType } from '@/types/roles';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';
import { reportArchitectureViolation } from '@/core/monitoring/ArchitectureGuard';
import { CanonicalUserMapper } from '@/identity/infrastructure/CanonicalUserMapper';

export class LegacyUserAdapter {
  static convertLegacyUserToCanonicalUser(legacyUser: any): CanonicalUser | null {
    if (!legacyUser) return null;
    const email = (legacyUser.email || '').toLowerCase().trim();
    const rawRole = (legacyUser.role || legacyUser.userRole || legacyUser.peran || '').toLowerCase().trim();
    const isDevEmail = email === 'developer@example.com' || email === 'admin@example.com' || email === 'mirzanovilawati@gmail.com';
    const isDevRole = rawRole === UserRole.DEVELOPER || legacyUser.isDeveloper;
    const rolesArray = Array.isArray(legacyUser.roles) ? legacyUser.roles.map((r: any) => String(r).toLowerCase().trim()) : [];
    const isDeveloper = isDevEmail || isDevRole || rolesArray.includes(UserRole.DEVELOPER);

    if (isDeveloper) {
      const uid = legacyUser.uid || legacyUser.id || '';
      if (!uid) throw new ArchitectureBoundaryError('identity', 'IDENTITY_UID_MISSING', 'Identitas Developer tidak memiliki UID / ID yang valid.');
      const namaTampilan = legacyUser.namaTampilan || legacyUser.displayName || legacyUser.name || 'Developer';
      const canonicalDev: CanonicalUser = {
        uid, id: uid, email: email || 'developer@emam.internal', displayName: namaTampilan,
        version: legacyUser.version || 1, rbacVersion: legacyUser.rbacVersion || 1, securityVersion: legacyUser.securityVersion || 1,
        schemaVersion: 2, accountType: AccountType.DEVELOPER, role: UserRole.DEVELOPER, roles: [UserRole.DEVELOPER],
        tenantId: legacyUser.tenantId || 'system', scopeType: 'global', scopeId: 'global',
        status: (legacyUser.status === 'aktif' || legacyUser.status === 'active') ? 'active' : (legacyUser.status || 'active'),
        isActive: true, isSso: Boolean(legacyUser.isSso), isClaimed: Boolean(legacyUser.isClaimed), approvalStatus: legacyUser.approvalStatus || 'approved',
        profile: { email: email || 'developer@emam.internal', displayName: namaTampilan, photoURL: legacyUser.photoURL || null },
        metadata: legacyUser.metadata || {}, referenceId: uid,
        permissions: legacyUser.permissions || ['*'], createdAt: typeof legacyUser.createdAt === 'number' ? legacyUser.createdAt : Date.now(),
        updatedAt: Date.now(), deleted: false, syncStatus: legacyUser.syncStatus || 'synced',
      };
      const normalizedDev = CanonicalUserMapper.toCanonical(canonicalDev);
      ArchitectureBoundaryEnforcer.enforceUserContract(normalizedDev);
      return normalizedDev;
    }

    if (!rawRole && rolesArray.length === 0) {
      throw new ArchitectureBoundaryError('user_contract', 'USER_CONTRACT_INVALID', `Pengguna '${email || legacyUser.uid || legacyUser.id}' tidak memiliki peran (role) yang terdaftar. Fallback default dilarang.`, { email, uid: legacyUser.uid, id: legacyUser.id });
    }

    const roleMapping: Record<string, { role: UserRole; accountType: AccountType; level: 'global' | 'tenant' }> = {
      developer: { role: UserRole.DEVELOPER, accountType: AccountType.DEVELOPER, level: 'global' },
      admin: { role: UserRole.ADMIN, accountType: AccountType.MADRASAH, level: 'tenant' },
      admin_madrasah: { role: UserRole.ADMIN_MADRASAH, accountType: AccountType.MADRASAH, level: 'tenant' },
      administrator: { role: UserRole.ADMIN, accountType: AccountType.MADRASAH, level: 'tenant' },
      kamad: { role: UserRole.KEPALA_MADRASAH, accountType: AccountType.MADRASAH, level: 'tenant' },
      kepala_madrasah: { role: UserRole.KEPALA_MADRASAH, accountType: AccountType.MADRASAH, level: 'tenant' },
      kepala_tu: { role: UserRole.KEPALA_TU, accountType: AccountType.MADRASAH, level: 'tenant' },
      staf_tu: { role: UserRole.STAF_TU, accountType: AccountType.MADRASAH, level: 'tenant' },
      guru: { role: UserRole.GURU, accountType: AccountType.MADRASAH, level: 'tenant' },
      wali_kelas: { role: UserRole.WALI_KELAS, accountType: AccountType.MADRASAH, level: 'tenant' },
      guru_bk: { role: UserRole.GURU_BK, accountType: AccountType.MADRASAH, level: 'tenant' },
      staf: { role: UserRole.STAF, accountType: AccountType.MADRASAH, level: 'tenant' },
      siswa: { role: UserRole.SISWA, accountType: AccountType.MADRASAH, level: 'tenant' },
      orang_tua: { role: UserRole.ORANG_TUA, accountType: AccountType.MADRASAH, level: 'tenant' },
      orangtua: { role: UserRole.ORANG_TUA, accountType: AccountType.MADRASAH, level: 'tenant' },
      wali_murid: { role: UserRole.ORANG_TUA, accountType: AccountType.MADRASAH, level: 'tenant' },
    };

    const mapped = roleMapping[rawRole];
    const roleCandidate = mapped?.role || Object.values(UserRole).find((r) => r === rawRole);
    if (!roleCandidate) throw new ArchitectureBoundaryError('user_contract', 'USER_ROLE_INVALID', `Role '${rawRole}' tidak merupakan UserRole canonical yang valid.`, { email, uid: legacyUser.uid, role: rawRole });
    const role: UserRole = roleCandidate;
    let roles: UserRole[] = Array.isArray(legacyUser.roles) && legacyUser.roles.length > 0
      ? legacyUser.roles.map((r: any) => Object.values(UserRole).find((candidate) => candidate === String(r).toLowerCase().trim())).filter((r: UserRole | undefined): r is UserRole => Boolean(r))
      : [role];
    roles = Array.from(new Set(roles));
    if (!roles.includes(role)) roles.unshift(role);

    if (legacyUser.idTenant) reportArchitectureViolation('user_contract', 'Deteksi pemakaian legacy field "idTenant". Telah dinormalisasi ke "tenantId".', { idTenant: legacyUser.idTenant });
    if (legacyUser.peran) reportArchitectureViolation('user_contract', 'Deteksi pemakaian legacy field "peran". Telah dinormalisasi ke "role".', { peran: legacyUser.peran });

    let tenantId = legacyUser.tenantId || legacyUser.idTenant;
    const scopeLevel = mapped ? mapped.level : 'tenant';
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '' || ['unknown', 'default', 'system', 'developer'].includes(tenantId)) {
      const fallbackUid = legacyUser.uid || legacyUser.id || 'unknown';
      throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', `Fail-Closed: Missing or invalid explicit tenantId for user "${email || fallbackUid}". Fallback tenant is strictly forbidden.`, { email, uid: legacyUser.uid });
    }
    tenantId = tenantId.trim();

    const scope = legacyUser.scope && typeof legacyUser.scope === 'object' ? { ...legacyUser.scope } : { level: scopeLevel };
    if (!scope.level) scope.level = scopeLevel;
    let status: any = 'active';
    const rawStatus = String(legacyUser.status || '').toLowerCase();
    if (rawStatus === 'aktif' || rawStatus === 'active') status = 'active';
    else if (rawStatus === 'nonaktif' || rawStatus === 'inactive') status = 'inactive';
    else if (rawStatus === 'suspended' || rawStatus === 'suspend') status = 'suspended';
    else if (rawStatus === 'pending') status = 'pending';
    else if (rawStatus === 'rejected') status = 'rejected';

    const namaTampilan = legacyUser.namaTampilan || legacyUser.displayName || legacyUser.name || 'User';
    const uid = legacyUser.uid || legacyUser.id || '';
    if (!uid) throw new ArchitectureBoundaryError('identity', 'IDENTITY_UID_MISSING', 'Identitas Pengguna tidak memiliki UID / ID yang valid.');
    const stableIdentityRef = legacyUser.uid || legacyUser.id || legacyUser.firebaseUid || email;
    const studentsId = typeof legacyUser.studentsId === 'string' && legacyUser.studentsId.trim() !== '' ? legacyUser.studentsId.trim() : null;
    const teachersId = typeof legacyUser.teachersId === 'string' && legacyUser.teachersId.trim() !== '' ? legacyUser.teachersId.trim() : null;
    const isStudentRole = [UserRole.SISWA, UserRole.KETUA_KELAS].includes(role);
    const isTeacherRole = [UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK, UserRole.GTK, UserRole.KEPALA_MADRASAH].includes(role);
    const referenceId = isStudentRole ? (studentsId || stableIdentityRef) : isTeacherRole ? (teachersId || stableIdentityRef) : (legacyUser.referenceId || stableIdentityRef);
    if (legacyUser.idUnik && !legacyUser.referenceId) reportArchitectureViolation('user_contract', 'Audit legacy field "idUnik" tetap dipertahankan sebagai legacy compatibility, bukan canonical referenceId.', { idUnik: legacyUser.idUnik });

    const canonicalUser: CanonicalUser = {
      uid, id: uid, email: email || 'user@emam.internal', displayName: namaTampilan,
      version: legacyUser.version || 1, rbacVersion: legacyUser.rbacVersion || 1, securityVersion: legacyUser.securityVersion || 1,
      schemaVersion: legacyUser.schemaVersion || 2, tenantId, scopeType: legacyUser.scopeType || 'tenant', scopeId: legacyUser.scopeId || tenantId,
      accountType: mapped?.accountType || AccountType.MADRASAH, role, roles, status, isActive: status === 'active',
      isSso: Boolean(legacyUser.isSso), isClaimed: Boolean(legacyUser.isClaimed),
      approvalStatus: legacyUser.approvalStatus || legacyUser.metadata?.approvalStatus || (status === 'pending' ? 'pending' : 'approved'),
      permissions: legacyUser.permissions || [], profile: { email: email || 'user@emam.internal', displayName: namaTampilan, photoURL: legacyUser.photoURL || null },
      metadata: legacyUser.metadata || {}, referenceId, studentsId: isStudentRole ? studentsId : null, teachersId: isTeacherRole ? teachersId : null,
      createdAt: typeof legacyUser.createdAt === 'number' ? legacyUser.createdAt : Date.now(), updatedAt: Date.now(), deleted: false,
      scope: scope as any, syncStatus: legacyUser.syncStatus || 'synced',
    };
    const normalized = CanonicalUserMapper.toCanonical(canonicalUser);
    ArchitectureBoundaryEnforcer.enforceUserContract(normalized);
    return normalized;
  }

  static normalizeCanonicalUser(user: any): CanonicalUser | null {
    return this.convertLegacyUserToCanonicalUser(user);
  }
}
