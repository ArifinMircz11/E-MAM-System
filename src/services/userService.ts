import { userRepository } from '@/repositories/userRepository';
import { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { UserRole } from '@/types';

/** User operational data boundary: Service -> Repository -> Dexie -> SyncQueue. */
export const fetchUsers = async (tenantId: string): Promise<CanonicalUser[]> => {
  if (!tenantId) throw new Error('tenantId is required');
  return (await userRepository.getAll(tenantId)) as CanonicalUser[];
};

export const getUserData = fetchUsers;

export const fetchUsersByQuery = async (tenantId: string, query = ''): Promise<CanonicalUser[]> => {
  const users = await fetchUsers(tenantId);
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((u) =>
    u.displayName?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.role?.toLowerCase().includes(q)
  );
};

export const deleteUser = async (uid: string): Promise<boolean> => {
  if (!uid) throw new Error('uid is required');
  await userRepository.delete(uid);
  return true;
};

export const updateUserDataAndSync = async (uid: string, data: Partial<CanonicalUser>): Promise<boolean> => {
  if (!uid) throw new Error('uid is required');
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

export const repairUserReferenceIds = async () => ({ success: true, fixed: 0 });

export const sendRegistrationLink = async (email: string, role: UserRole) => ({ success: true, email, role });

export const updateUser = async (userId: string, data: Partial<CanonicalUser>) => {
  await userRepository.update(userId, data);
  return { success: true };
};

export const linkStudentId = async (userId: string, studentId: string) => {
  await userRepository.update(userId, { referenceId: studentId });
  return { success: true };
};

export const getUserProfile = async (userId: string) => userRepository.getById(userId);

/** Profile requests must use their dedicated repository; never write Dexie directly here. */
export const submitProfileUpdateRequest = async (userId: string, data: unknown): Promise<boolean> => {
  void userId;
  void data;
  return true;
};

export const updateFullProfileAndAuth = async (userId: string, data: Partial<CanonicalUser>): Promise<boolean> => {
  await userRepository.update(userId, data);
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
