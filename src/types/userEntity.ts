import type { AppEntity } from '@/domain/entities/base';
import type { UserRole } from './roles';

export interface UserEntity extends AppEntity {
  displayName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  roles?: UserRole[];
  
  // Identity Center Fields
  authProvider: 'password' | 'google';
  providerUid?: string;
  emailVerified: boolean;
  accountStatus: 'active' | 'pending' | 'suspended';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  lastLoginAt?: number;
  loginCount: number;
  currentDeviceId?: string;
  
  // Reference Fields
  referenceType?: 'teacher' | 'student' | 'parent' | 'staff' | 'alumni';
  referenceId?: string;
  
  photoURL?: string;
  permissions?: string[];
  presenceStatus?: 'online' | 'offline';
  adminNote?: string;
}
