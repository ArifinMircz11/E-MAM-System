import { submitProfileUpdateRequest } from './userService';

export const requestProfileUpdate = async (
  userId: string,
  studentId: string,
  studentsId: string,
  displayName: string,
  nisn: string,
  requestedChanges: any,
  tenantId: string,
) => {
  return await submitProfileUpdateRequest(
    userId,
    studentsId || studentId,
    displayName,
    nisn,
    requestedChanges,
    tenantId,
    'student',
    'students',
  );
};
