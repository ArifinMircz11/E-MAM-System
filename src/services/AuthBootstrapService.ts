import { attemptAutoLinkStudent, getMasterProfile } from '@/services/authService';
import { UserRole, DEVELOPER_EMAILS } from '@/types';
import { normalizeUserDataRoles } from '@/utils/roleNormalizer';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { FirebaseUserSyncService } from '@/services/sync/FirebaseUserSyncService';

export interface AuthBootstrapResult {
  user: any;
  userData: any;
  profile: any;
  accountStatus: string;
  linkedStudent: boolean;
}

const normalizeStatus = (value: unknown): string => String(value || 'active').trim().toLowerCase();
const isStudentType = (value: unknown): boolean => ['student', 'siswa'].includes(String(value || '').trim().toLowerCase());
const isTeacherType = (value: unknown): boolean => ['teacher', 'guru', 'pendidik'].includes(String(value || '').trim().toLowerCase());

export class AuthBootstrapService {
  static async initialize(firebaseUser: any): Promise<AuthBootstrapResult> {
    let authoritativeUser = await FirebaseUserSyncService.syncAuthUser(firebaseUser);
    if (!authoritativeUser) throw new Error('Canonical user resolution returned no identity');

    if (authoritativeUser.isGuest) {
      const guestProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || null,
        accountType: 'guest', role: UserRole.TAMU, roles: [UserRole.TAMU],
        tenantId: null, referenceId: null, studentsId: null, teachersId: null,
        status: 'pending', approvalStatus: 'pending', registrationRequired: true,
      };
      return {
        user: guestProfile,
        userData: {
          uid: firebaseUser.uid, roles: [UserRole.TAMU], accountType: 'guest', role: UserRole.TAMU,
          assignment: { studentId: null, teacherId: null, classId: null, positionId: 'guest' },
          tenantId: null, status: 'pending', approvalStatus: 'pending', version: 1, schemaVersion: 2,
        },
        profile: guestProfile, accountStatus: 'pending', linkedStudent: false,
      };
    }

    SecurityContextService.setLifecycleState('IDENTITY_RESOLVED');
    const normalized = normalizeUserDataRoles(authoritativeUser, firebaseUser.email || '');
    const roles = Array.isArray(normalized.roles)
      ? normalized.roles.filter(Boolean).map((value: any) => String(value).trim().toLowerCase())
      : [];
    if (roles.length === 0) throw new Error('Canonical user has no valid roles');

    const accountType = normalized.accountType;
    const role = roles[0];
    if (!roles.includes(role)) throw new Error(`Canonical role '${role}' is not present in roles[]`);

    const isDev = DEVELOPER_EMAILS.includes(firebaseUser.email || '') || roles.includes(UserRole.DEVELOPER);
    const studentType = isStudentType(accountType) || role === UserRole.SISWA;
    const teacherType = isTeacherType(accountType) || [UserRole.GURU, UserRole.GURU_BK, UserRole.GTK].includes(role as UserRole);

    let linkedStudent = false;
    if (role === UserRole.SISWA && !authoritativeUser.studentsId && firebaseUser.email) {
      try {
        const tenantForLink = typeof authoritativeUser.tenantId === 'string' ? authoritativeUser.tenantId : '';
        linkedStudent = Boolean(await attemptAutoLinkStudent(firebaseUser.uid, firebaseUser.email, tenantForLink));
        if (linkedStudent) {
          const refreshed = await FirebaseUserSyncService.syncAuthUser(firebaseUser);
          if (refreshed) authoritativeUser = refreshed;
        }
      } catch (error) {
        console.warn('[AuthBootstrapService] Auto-link student failed:', error);
      }
    }

    const tenantId = typeof authoritativeUser.tenantId === 'string' && authoritativeUser.tenantId.trim()
      ? authoritativeUser.tenantId.trim() : (isDev ? 'system' : null);
    if (!tenantId) throw new Error('Canonical user has no explicit tenantId');
    if (['global', 'default', 'unknown'].includes(tenantId.toLowerCase())) {
      throw new Error(`Invalid canonical tenantId: ${tenantId}`);
    }

    const explicitReferenceId = typeof authoritativeUser.referenceId === 'string' && authoritativeUser.referenceId.trim()
      ? authoritativeUser.referenceId.trim() : null;
    const referenceId = explicitReferenceId
      || (studentType && typeof authoritativeUser.studentsId === 'string' && authoritativeUser.studentsId.trim() ? authoritativeUser.studentsId.trim() : null)
      || (teacherType && typeof authoritativeUser.teachersId === 'string' && authoritativeUser.teachersId.trim() ? authoritativeUser.teachersId.trim() : null);
    if (!referenceId) throw new Error(`Canonical user '${firebaseUser.uid}' has no valid referenceId for role '${role}'`);

    const status = normalizeStatus(authoritativeUser.status);
    if (['suspended', 'inactive', 'disabled', 'blocked'].includes(status)) {
      throw new Error(`Account is not allowed to sign in: ${status}`);
    }
    const approvalStatus = normalizeStatus(authoritativeUser.approvalStatus || 'approved');
    const studentId = studentType ? referenceId : authoritativeUser.studentsId || null;
    const teacherId = teacherType ? referenceId : authoritativeUser.teachersId || null;

    const userData = {
      uid: firebaseUser.uid, roles, accountType, role,
      assignment: { studentId, teacherId, classId: authoritativeUser.classId || null, positionId: authoritativeUser.positionId || role },
      tenantId, status, approvalStatus,
      version: authoritativeUser.version || 1, schemaVersion: authoritativeUser.schemaVersion || 1,
    };

    const profilePayload = {
      uid: firebaseUser.uid,
      email: authoritativeUser.email || firebaseUser.email || '',
      displayName: authoritativeUser.displayName || firebaseUser.displayName || '',
      photoURL: authoritativeUser.photoURL || firebaseUser.photoURL || null,
      role, roles, studentsId: studentId, teachersId: teacherId, tenantId, status, approvalStatus, referenceId,
    };

    let profile = profilePayload;
    if (studentType || teacherType) profile = (await getMasterProfile(firebaseUser.uid, accountType, referenceId)) || profilePayload;

    return {
      user: profilePayload, userData, profile,
      accountStatus: approvalStatus === 'pending' ? 'pending' : status,
      linkedStudent,
    };
  }
}
