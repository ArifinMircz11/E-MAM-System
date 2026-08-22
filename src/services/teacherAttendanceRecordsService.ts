import type { TeacherAttendanceRecord } from '@/types';
import { getSecurityContext } from '@/core/security/contextHelper';
import { teacherAttendanceRepository } from '@/repositories/teacherAttendanceRepository';
import { getClasses } from '@/services/classService';
import { syncRepository } from '@/repositories/SyncRepository';

/**
 * Application service for teacher-attendance records.
 * Hooks must use this service; Dexie/Firestore remain below the service boundary.
 */
export async function getTeacherAttendanceRecords(
  selectedClass: string,
  isManagement: boolean,
): Promise<TeacherAttendanceRecord[]> {
  const context = getSecurityContext(true);
  if (!context) throw new Error('SECURITY_CONTEXT_NOT_READY');

  const records = await teacherAttendanceRepository.findAll(context.tenantId);
  const targetClass = selectedClass === 'All' ? (isManagement ? 'All' : '10 A') : selectedClass;

  return records
    .filter((record: any) => targetClass === 'All' || record.className === targetClass || record.kelas === targetClass)
    .sort((a: any, b: any) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 150);
}

export async function getTeacherAttendanceClasses(): Promise<string[]> {
  const classes = await getClasses();
  return classes
    .map((item: any) => item.name || item.id)
    .filter(Boolean)
    .sort();
}

export async function deleteTeacherAttendanceRecord(id: string): Promise<void> {
  const context = getSecurityContext(true);
  if (!context) throw new Error('SECURITY_CONTEXT_NOT_READY');

  await teacherAttendanceRepository.delete(id, context.tenantId);
  await syncRepository.enqueue({
    tenantId: context.tenantId,
    collection: 'teacher_attendance',
    recordId: id,
    operation: 'delete',
    action: 'DELETE',
    payload: { id, tenantId: context.tenantId },
  } as any, context);
}
