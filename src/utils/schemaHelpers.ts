/**
 * e-Mam System - Schema & ID Validation Helpers
 * Ensures all ID fields follow the Enterprise String Protocol.
 */

export const ID_FIELDS = [
  'id',
  'tenantId',
  'academicYearId',
  'studentsId',
  'teachersId',
  'classId',
  'rolesId',
  'attendanceId',
  'referensiId',
  'idUnik',
  'studentId',
  'teacherId',
  'userId',
  'parentId',
  'authUid',
  'linkedUserId',
  'uid',
];

/**
 * Recursively ensures all standard ID fields in an object are strings.
 * Prevents "Invalid input: expected string, received number" Zod errors.
 */
export function ensureStringIds<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => ensureStringIds(item)) as unknown as T;
  }

  const result = { ...data } as any;

  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      // Check if this key is a known ID field
      if (ID_FIELDS.includes(key)) {
        if (result[key] !== undefined && result[key] !== null) {
          result[key] = String(result[key]);
        }
      }
      // Recursively check nested objects (but skip known large non-entity objects)
      else if (
        result[key] &&
        typeof result[key] === 'object' &&
        key !== 'sistemJangkar' &&
        key !== 'metadataAkademik'
      ) {
        result[key] = ensureStringIds(result[key]);
      }
    }
  }

  return result as T;
}
