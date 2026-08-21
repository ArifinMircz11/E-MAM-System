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
    const rolesArray = Array.isArray(legacyUser.roles) ? legacyUser.roles.map((r: any) => String(r).toLowerCase().trim()) : [];
    const isDeveloper = rawRole === UserRole.DEVELOPER || legacyUser.isDeveloper === true || rolesArray.includes(UserRole.DEVELOPER);

    if (isDeveloper) {
      const uid = legacyUser.uid || legacyUser.id || '';
      if (!uid) throw new ArchitectureBoundaryError('identity', 'IDENTITY_UID_MISSING', 'Identitas Developer tidak memiliki UID / ID yang valid.');
      const namaTampilan = legacyUser.namaTampilan || legacyUser.displayName || legacyUser.name;
      if (typeof namaTampilan !== 'string' || namaTampilan.trim() === '') throw new ArchitectureBoundaryError('user_contract', 'DISPLAY_NAME_MISSING', 'Developer tidak memiliki displayName canonical yang valid.');
      if (typeof legacyUser.tenantId !== 'string' || legacyUser.tenantId.trim() === '') throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', 'Developer tidak memiliki tenantId canonical yang valid.');
      if (typeof legacyUser.referenceId !== 'string' || legacyUser.referenceId.trim() === '') throw new ArchitectureBoundaryError('user_contract', 'REFERENCE_ID_MISSING', 'Developer tidak memiliki referenceId canonical yang valid.');
      const canonicalDev: CanonicalUser = {
        uid, id: uid, email, displayName: namaTampilan.trim(),
        version: legacyUser.version || 1, rbacVersion: legacyUser.rbacVersion || 1, securityVersion: legacyUser.securityVersion || 1,
        schemaVersion: 2, accountType: AccountType.DEVELOPER, role: UserRole.DEVELOPER, roles: [UserRole.DEVELOPER],
        tenantId: legacyUser.tenantId.trim(), scopeType: 'global', scopeId: legacyUser.scopeId || 'global',
        status: (legacyUser.status === 'aktif' || legacyUser.status === 'active') ? 'active' : (legacyUser.status || 'active'),
        isActive: true, isSso: Boolean(legacyUser.isSso), isClaimed: Boolean(legacyUser.isClaimed), approvalStatus: legacyUser.approvalStatus || 'approved',
        profile: { email, displayName: namaTampilan.trim(), photoURL: legacyUser.photoURL || null },
        metadata: legacyUser.metadata || {}, referenceId: legacyUser.referenceId.trim(),
        permissions: Array.isArray(legacyUser.permissions) ? legacyUser.permissions : [], createdAt: typeof legacyUser.createdAt === 'number' ? legacyUser.createdAt : Date.now(),
        updatedAt: Date.now(), deleted: false, syncStatus: legacyUser.syncStatus || 'synced',
      };
      const normalizedDev = CanonicalUserMapper.toCanonical(canonicalDev);
      ArchitectureBoundaryEnforcer.enforceUserContract(normalizedDev);
      return normalizedDev;
    }

    if (!rawRole && rolesArray.length === 0) throw new ArchitectureBoundaryError('user_contract', 'USER_CONTRACT_INVALID', `Pengguna '${email || legacyUser.uid || legacyUser.id}' tidak memiliki peran (role) yang terdaftar. Fallback default dilarang.`, { email, uid: legacyUser.uid, id: legacyUser.id });

    const roleMapping: Record<string, { role: UserRole; accountType: AccountType; level: 'global' | 'tenant' }> = {
      developer: { role: UserRole.DEVELOPER, accountType: AccountType.DEVELOPER, level: 'global' }, admin: { role: UserRole.ADMIN, accountType: AccountType.MADRASAH, level: 'tenant' }, admin_madrasah: { role: UserRole.ADMIN_MADRASAH, accountType: AccountType.MADRASAH, level: 'tenant' }, administrator: { role: UserRole.ADMIN, accountType: AccountType.MADRASAH, level: 'tenant' }, kamad: { role: UserRole.KEPALA_MADRASAH, accountType: AccountType.MADRASAH, level: 'tenant' }, kepala_madrasah: { role: UserRole.KEPALA_MADRASAH, accountType: AccountType.MADRASAH, level: 'tenant' }, kepala_tu: { role: UserRole.KEPALA_TU, accountType: AccountType.MADRASAH, level: 'tenant' }, staf_tu: { role: UserRole.STAF_TU, accountType: AccountType.MADRASAH, level: 'tenant' }, guru: { role: UserRole.GURU, accountType: AccountType.MADRASAH, level: 'tenant' }, wali_kelas: { role: UserRole.WALI_KELAS, accountType: AccountType.MADRASAH, level: 'tenant' }, guru_bk: { role: UserRole.GURU_BK, accountType: AccountType.MADRASAH, level: 'tenant' }, staf: { role: UserRole.STAF, accountType: AccountType.MADRASAH, level: 'tenant' }, siswa: { role: UserRole.SISWA, accountType: AccountType.MADRASAH, level: 'tenant' }, orang_tua: { role: UserRole.ORANG_TUA, accountType: AccountType.MADRASAH, level: 'tenant' }, orangtua: { role: UserRole.ORANG_TUA, accountType: AccountType.MADRASAH, level: 'tenant' }, wali_murid: { role: UserRole.ORANG_TUA, accountType: AccountType.MADRASAH, level: 'tenant' }, tamu: { role: UserRole.TAMU, accountType: AccountType.MADRASAH, level: 'tenant' },
    };
    const mapped = roleMapping[rawRole];
    const roleCandidate = mapped?.role || Object.values(UserRole).find((r) => r === rawRole);
    if (!roleCandidate) throw new ArchitectureBoundaryError('user_contract', 'USER_ROLE_INVALID', `Role '${rawRole}' tidak merupakan UserRole canonical yang valid.`, { email, uid: legacyUser.uid, role: rawRole });
    const role: UserRole = roleCandidate;
    let roles: UserRole[] = Array.isArray(legacyUser.roles) && legacyUser.roles.length > 0 ? legacyUser.roles.map((r: any) => Object.values(UserRole).find((candidate) => candidate === String(r).toLowerCase().trim())).filter((r: UserRole | undefined): r is UserRole => Boolean(r)) : [role];
    roles = Array.from(new Set(roles));
    if (!roles.includes(role)) roles.unshift(role);

    if (legacyUser.idTenant) reportArchitectureViolation('user_contract', 'Deteksi pemakaian legacy field "idTenant". Telah dinormalisasi ke "tenantId".', { idTenant: legacyUser.idTenant });
    if (legacyUser.peran) reportArchitectureViolation('user_contract', 'Deteksi pemakaian legacy field "peran". Telah dinormalisasi ke "role".', { peran: legacyUser.peran });

    const tenantId = legacyUser.tenantId;
    const scopeLevel = mapped ? mapped.level : 'tenant';
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '' || ['unknown', 'default', 'system', 'developer'].includes(tenantId)) throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', `Fail-Closed: Missing or invalid explicit tenantId for user "${email || legacyUser.uid || legacyUser.id || 'unknown'}". Fallback tenant is strictly forbidden.`, { email, uid: legacyUser.uid });

    const scope = legacyUser.scope && typeof legacyUser.scope === 'object' ? { ...legacyUser.scope } : { level: scopeLevel };
    if (!scope.level) scope.level = scopeLevel;
    let status: any = 'active';
    const rawStatus = String(legacyUser.status || '').toLowerCase();
    if (rawStatus === 'aktif' || rawStatus === 'active') status = 'active'; else if (rawStatus === 'nonaktif' || rawStatus === 'inactive') status = 'inactive'; else if (rawStatus === 'suspended' || rawStatus === 'suspend') status = 'suspended'; else if (rawStatus === 'pending') status = 'pending'; else if (rawStatus === 'rejected') status = 'rejected';

    const namaTampilan = legacyUser.namaTampilan || legacyUser.displayName || legacyUser.name;
    const uid = legacyUser.uid || legacyUser.id || '';
    if (!uid) throw new ArchitectureBoundaryError('identity', 'IDENTITY_UID_MISSING', 'Identitas Pengguna tidak memiliki UID / ID yang valid.');
    if (typeof namaTampilan !== 'string' || namaTampilan.trim() === '') throw new ArchitectureBoundaryError('user_contract', 'DISPLAY_NAME_MISSING', 'displayName canonical tidak tersedia.');

    const studentsId = typeof legacyUser.studentsId === 'string' && legacyUser.studentsId.trim() !== '' ? legacyUser.studentsId.trim() : null;
    const teachersId = typeof legacyUser.teachersId === 'string' && legacyUser.teachersId.trim() !== '' ? legacyUser.teachersId.trim() : null;
    const isStudentRole = [UserRole.SISWA, UserRole.KETUA_KELAS].includes(role);
    const isTeacherRole = [UserRole.GURU, UserRole.WALI_KELAS, UserRole.GURU_BK, UserRole.GTK, UserRole.KEPALA_MADRASAH].includes(role);
    const referenceId = legacyUser.referenceId;
    if (legacyUser.idUnik && !legacyUser.referenceId) reportArchitectureViolation('user_contract', 'Legacy field "idUnik" cannot supply canonical referenceId.', { idUnik: legacyUser.idUnik });
    if (typeof referenceId !== 'string' || referenceId.trim() === '') throw new ArchitectureBoundaryError('user_contract', 'REFERENCE_ID_MISSING', `Pengguna '${email || uid}' tidak memiliki referenceId canonical. Identity claim harus diregistrasikan dan disetujui admin.`);

    const canonicalUser: CanonicalUser = {
      uid, id: uid, email, displayName: namaTampilan.trim(), version: legacyUser.version || 1, rbacVersion: legacyUser.rbacVersion || 1, securityVersion: legacyUser.securityVersion || 1,
      schemaVersion: legacyUser.schemaVersion || 2, tenantId: tenantId.trim(), scopeType: legacyUser.scopeType || 'tenant', scopeId: legacyUser.scopeId || tenantId.trim(), accountType: mapped?.accountType || legacyUser.accountType,
      role, roles, status, isActive: status === 'active', isSso: Boolean(legacyUser.isSso), isClaimed: Boolean(legacyUser.isClaimed), approvalStatus: legacyUser.approvalStatus || legacyUser.metadata?.approvalStatus || (status === 'pending' ? 'pending' : 'approved'),
      permissions: Array.isArray(legacyUser.permissions) ? legacyUser.permissions : [], profile: { email, displayName: namaTampilan.trim(), photoURL: legacyUser.photoURL || null }, metadata: legacyUser.metadata || {}, referenceId: referenceId.trim(), studentsId: isStudentRole ? studentsId : null, teachersId: isTeacherRole ? teachersId : null,
      createdAt: typeof legacyUser.createdAt === 'number' ? legacyUser.createdAt : Date.now(), updatedAt: Date.now(), deleted: false, scope: scope as any, syncStatus: legacyUser.syncStatus || 'synced',
    };
    const normalized = CanonicalUserMapper.toCanonical(canonicalUser);
    ArchitectureBoundaryEnforcer.enforceUserContract(normalized);
    return normalized;
  }

  static normalizeCanonicalUser(user: any): CanonicalUser | null {
    return this.convertLegacyUserToCanonicalUser(user);
  }
}
