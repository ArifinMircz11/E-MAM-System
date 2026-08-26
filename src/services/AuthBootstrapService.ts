import { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { UserRole } from '@/types/roles';

export interface AuthBootstrapResult {
  user: CanonicalUser;
  userData: any;
  accountStatus: string;
  profile: any;
}

export class AuthBootstrapService {
  static async initialize(firebaseUser: any): Promise<AuthBootstrapResult> {
    const user: CanonicalUser = {
      id: firebaseUser.id || `user-${firebaseUser.uid || 'anon'}`,
      uid: firebaseUser.uid || 'anon-uid',
      tenantId: firebaseUser.tenantId || 'tenant-demo',
      accountType: firebaseUser.accountType || 'madrasah',
      role: firebaseUser.role || UserRole.ADMIN,
      roles: firebaseUser.roles || [firebaseUser.role || UserRole.ADMIN],
      permissions: firebaseUser.permissions || ['*'],
      referenceId: firebaseUser.referenceId || 'REF001',
      isClaimed: true,
      isSso: false,
      approvalStatus: 'approved',
      email: firebaseUser.email || 'user@emam.sch.id',
      displayName: firebaseUser.displayName || 'Pengguna',
      status: 'active',
      syncStatus: 'synced',
      version: 1,
      schemaVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
    };

    const userData = {
      uid: user.uid,
      roles: user.roles,
      displayName: user.displayName,
      photoURL: user.photoURL || null,
      tenantId: user.tenantId,
      assignment: {
        studentId: null,
        teacherId: null,
        classId: null,
      },
    };

    return {
      user,
      userData,
      accountStatus: 'active',
      profile: {
        id: user.id,
        name: user.displayName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
