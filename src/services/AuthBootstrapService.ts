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

export class AuthBootstrapService {
  static async initialize(firebaseUser: any): Promise<AuthBootstrapResult> {
    const authoritativeUser = await FirebaseUserSyncService.syncAuthUser(firebaseUser);
    if (!authoritativeUser) throw new Error('Canonical user resolution returned no identity');

    if (authoritativeUser.isGuest) {
      const guestProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || null,
        accountType: 'guest',
        role: UserRole.TAMU,
        roles: [UserRole.TAMU],
        tenantId: null,
        referenceId: null,
        studentsId: null,
        teachersId: null,
        status: 'pending',
        approvalStatus: 'pending',
        registrationRequired: true,
      };
      return {
        user: guestProfile,
        userData: {
          uid: firebaseUser.uid,
          roles: [UserRole.TAMU],
          accountType: 'guest',
          role: UserRole.TAMU,
          assignment: { studentId: null, teacherId: null, classId: null, positionId: 'guest' },
          tenantId: null,
          status: 'pending',
          approvalStatus: 'pending',
          version: 1,
          schemaVersion: 2,
        },
        profile: guestProfile,
        accountStatus: 'pending',
        linkedStudent: false,
      };
    }

    SecurityContextService.setLifecycleState('IDENTITY_RESOLVED');
    const normalized = normalizeUserDataRoles(authoritativeUser, firebaseUser.email || '');
    const roles = normalized.roles;
    const accountType = normalized.accountType;
    const role = roles[0];
    const isDev = DEVELOPER_EMAILS.includes(firebaseUser.email || '') || roles.includes(UserRole.DEVELOPER);

    const referenceId = typeof authoritativeUser.referenceId === 'string' && authoritativeUser.referenceId.trim()
      ? authoritativeUser.referenceId.trim()
      : null;
    if (!referenceId) throw new Error('Canonical user has no explicit referenceId');

    const tenantId = authoritativeUser.tenantId || (isDev ? 'system' : null);
    if (!tenantId) throw new Error('Canonical user has no explicit tenantId');
    if (['global', 'default', 'unknown'].includes(String(tenantId).toLowerCase())) {
      throw new Error(`Invalid canonical tenantId: ${tenantId}`);
    }

    const studentType = ['student', 'siswa'].includes(String(accountType).toLowerCase());
    const teacherType = ['teacher', 'guru', 'pendidik'].includes(String(accountType).toLowerCase());
    let linkedStudent = false;

    if (role === UserRole.SISWA && !authoritativeUser.studentsId) {
      try {
        linkedStudent = Boolean(await attemptAutoLinkStudent(firebaseUser.uid, firebaseUser.email || '', tenantId));
      } catch (error) {
        console.warn('[AuthBootstrapService] Auto-link student failed:', error);
      }
    }

    const studentId = studentType ? referenceId : authoritativeUser.studentsId || null;
    const teacherId = teacherType ? referenceId : authoritativeUser.teachersId || null;
    const status = authoritativeUser.status || 'active';
    const userData = {
      uid: firebaseUser.uid,
      roles,
      accountType,
      role,
      assignment: {
        studentId,
        teacherId,
        classId: authoritativeUser.classId || null,
        positionId: authoritativeUser.positionId || role,
      },
      tenantId,
      status,
      approvalStatus: authoritativeUser.approvalStatus || 'approved',
      version: authoritativeUser.version || 1,
      schemaVersion: authoritativeUser.schemaVersion || 1,
    };

    const profilePayload = {
      uid: firebaseUser.uid,
      email: authoritativeUser.email || firebaseUser.email || '',
      displayName: authoritativeUser.displayName || firebaseUser.displayName || '',
      photoURL: authoritativeUser.photoURL || firebaseUser.photoURL || null,
      role,
      roles,
      studentsId: studentId,
      teachersId: teacherId,
      tenantId,
      status,
      referenceId,
    };

    let profile = profilePayload;
    if (studentType || teacherType) {
      profile = (await getMasterProfile(firebaseUser.uid, accountType, referenceId)) || profilePayload;
    }

    return {
      user: profilePayload,
      userData,
      profile,
      accountStatus: status,
      linkedStudent,
    };
  }
}
