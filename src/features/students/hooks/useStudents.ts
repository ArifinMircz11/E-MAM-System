/**
 * @license
 * e-Mam System - Student Feature Hook
 * LAYER: HOOK (Vertical Slice Architecture Compliant)
 */

import { useState, useCallback, useEffect } from 'react';
import type { Student, ClassData } from '@/types';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import { useStudentStore } from '@/stores/studentStore';

export const useStudents = () => {
  const [invalidStudents, setInvalidStudents] = useState<Student[]>([]);
  
  const {
    classes,
    students,
    selectedClass,
    isLoading,
    isSubmitting,
    error,
    setSelectedClass,
    setMasterVersion,
    fetchClasses,
    fetchStudents,
    fetchStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent,
    migrateStudentId,
    moveStudentToCollection,
    bulkImportStudents,
    bulkDeleteStudents,
    deleteAllStudents,
    triggerPasswordReset,
  } = useStudentStore();

  const loadInvalidStudents = useCallback(async () => {
    try {
      const context = getSecurityContext();
      if (!context?.tenantId) return;
      const results = await studentRepository.getInvalidStudents(context.tenantId);
      setInvalidStudents(results);
    } catch (err: any) {
      console.error('[useStudents] Failed to load invalid students:', err);
    }
  }, []);

  // Initial load of invalid students
  useEffect(() => {
    loadInvalidStudents();
  }, [loadInvalidStudents]);

  return {
    classes,
    students,
    invalidStudents,
    selectedClass,
    isLoading,
    isSubmitting,
    error,
    setSelectedClass,
    setMasterVersion,
    fetchClasses,
    fetchStudents,
    fetchStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent,
    migrateStudentId,
    moveStudentToCollection,
    bulkImportStudents,
    bulkDeleteStudents,
    deleteAllStudents,
    triggerPasswordReset,
    loadInvalidStudents,
  };
};
