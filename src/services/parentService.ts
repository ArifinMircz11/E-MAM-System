import { useUserStore } from '@/stores/userStore';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { getAttendanceByStudentId } from '@/features/attendance/services/attendanceService';
import { assignmentRepository } from '@/repositories/AssignmentRepository';
import { studentParentRepository } from '@/repositories/StudentParentRepository';
import type { Student, AttendanceRecord, Assignment } from '@/types';

export const getStudentData = async (studentId: string): Promise<Student | null> => {
  if (!studentId) return null;
  const tenantId = useUserStore.getState().tenantId || 'global';
  return await studentRepository.findById(studentId, tenantId);
};

export const getStudentAttendance = async (studentId: string): Promise<AttendanceRecord[]> => {
  return await getAttendanceByStudentId(studentId);
};

export const getStudentAssignments = async (className: string): Promise<Assignment[]> => {
  const tenantId = useUserStore.getState().tenantId || 'global';
  return await assignmentRepository.findByClass(tenantId, className);
};

export const linkStudentAndParent = async (
  studentId: string,
  parentId: string,
  relationship: string,
  tenantId: string = '30315537',
): Promise<{ success: boolean; message?: string }> => {
  try {
    const id = `${parentId}_${studentId}`;
    const relationDoc = {
      id,
      studentId,
      parentId,
      relationship,
      tenantId,
      createdAt: Date.now(),
    };

    await studentParentRepository.create(relationDoc);

    return { success: true };
  } catch (error: any) {
    console.error('[PARENT_SERVICE] Link Student-Parent Fail:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Mengambil daftar anak yang terhubung dengan orang tua tertentu
 */
export const getLinkedStudentsForParent = async (
  parentId: string,
  tenantId: string = '30315537',
): Promise<any[]> => {
  try {
    const relations = await studentParentRepository.getByParentId(tenantId, parentId);

    const students: any[] = [];
    for (const rel of relations) {
      const student = await getStudentData(rel.studentId);
      if (student) {
        students.push({ ...student, relationship: rel.relationship });
      }
    }
    return students;
  } catch (error) {
    console.error('[PARENT_SERVICE] Get Linked Students Fail:', error);
    return [];
  }
};

/**
 * Mengambil daftar orang tua dari seorang siswa tertentu
 */
export const getLinkedParentsForStudent = async (
  studentId: string,
  tenantId: string = '30315537',
): Promise<any[]> => {
  try {
    const relations = await studentParentRepository.getByStudentId(tenantId, studentId);
    return relations;
  } catch (error) {
    console.error('[PARENT_SERVICE] Get Linked Parents Fail:', error);
    return [];
  }
};
