import { userRepository } from '@/repositories/userRepository';
import { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { UserRole } from '@/types';
import { db } from '@/database/db';

export const fetchUsers = async (): Promise<CanonicalUser[]> => {
  try {
    if (db.table('users')) {
      return (await db.table('users').toArray()) as CanonicalUser[];
    }
  } catch {}
  return (await userRepository.getAll('30315537')) as CanonicalUser[];
};

export const getUserData = fetchUsers;

export const fetchUsersByQuery = async (tenantId: string = 'tenant-demo', query: string = ''): Promise<CanonicalUser[]> => {
  const users = await fetchUsers();
  const tenantUsers = users.filter((u) => u.tenantId === tenantId);
  if (!query) return tenantUsers;
  const q = query.toLowerCase();
  return tenantUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
  );
};

export const deleteUser = async (uid: string): Promise<boolean> => {
  try {
    if (db.table('users')) {
      await db.table('users').delete(uid);
      return true;
    }
  } catch {}
  return false;
};

export const updateUserDataAndSync = async (uid: string, data: Partial<CanonicalUser>): Promise<boolean> => {
  try {
    if (db.table('users')) {
      const existing = await db.table('users').get(uid);
      await db.table('users').put({
        ...existing,
        ...data,
        uid,
        id: uid,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  await userRepository.update(uid, data);
  return true;
};

export const activateAccountByAdmin = async (userId: string) => {
  await userRepository.update(userId, { approvalStatus: 'approved', status: 'active' });
  return { success: true };
};

export const approvePendingAccount = activateAccountByAdmin;

export const reactivateUser = async (userId: string) => {
  await userRepository.update(userId, { status: 'active' });
  return { success: true };
};

export const repairUserReferenceIds = async () => {
  return { success: true, fixed: 0 };
};

export const sendRegistrationLink = async (email: string, role: UserRole) => {
  return { success: true };
};

export const updateUser = async (userId: string, data: Partial<CanonicalUser>) => {
  await userRepository.update(userId, data);
  return { success: true };
};

export const linkStudentId = async (userId: string, studentId: string) => {
  await userRepository.update(userId, { referenceId: studentId });
  return { success: true };
};

export const getUserProfile = async (userId: string) => {
  return await userRepository.getById(userId);
};

export const submitProfileUpdateRequest = async (userId: string, data: any): Promise<boolean> => {
  try {
    const { db } = await import('@/database/db');
    if (db.table('profile_update_requests')) {
      await db.table('profile_update_requests').put({
        id: `req_${Date.now()}`,
        userId,
        data,
        status: 'pending',
        createdAt: Date.now(),
      });
    }
  } catch {}
  return true;
};

export const updateFullProfileAndAuth = async (userId: string, data: any): Promise<boolean> => {
  try {
    const { db } = await import('@/database/db');
    if (db.table('users')) {
      const existing = await db.table('users').get(userId);
      await db.table('users').put({
        ...existing,
        ...data,
        id: userId,
        updatedAt: Date.now(),
      });
    }
  } catch {}
  return true;
};

export const userService = {
  fetchUsers,
  getUserData,
  fetchUsersByQuery,
  deleteUser,
  updateUserDataAndSync,
  activateAccountByAdmin,
  approvePendingAccount,
  reactivateUser,
  repairUserReferenceIds,
  sendRegistrationLink,
  updateUser,
  linkStudentId,
  getUserProfile,
  submitProfileUpdateRequest,
  updateFullProfileAndAuth,
};
