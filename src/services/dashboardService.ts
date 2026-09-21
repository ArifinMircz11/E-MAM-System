import { TenantContext } from '@/core/context/TenantContext';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { classRepository } from '@/repositories/classRepository';

export const getDashboardSummary = async (tenantId?: string) => {
  const activeTenant = tenantId || TenantContext.getTenantId();
  const [students, teachers] = await Promise.all([
    studentRepository.findAll(activeTenant),
    teacherRepository.getAll(activeTenant),
  ]);
  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    attendanceRate: null,
    violationsCount: null,
  };
};

export const getDashboardStats = async (tenantId?: string) => {
  const activeTenant = tenantId || TenantContext.getTenantId();
  const [students, teachers, classes] = await Promise.all([
    studentRepository.findAll(activeTenant),
    teacherRepository.getAll(activeTenant),
    classRepository.getAll(activeTenant),
  ]);
  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalGTK: teachers.length,
    totalClasses: classes.length,
    isStale: false,
  };
};

export const dashboardService = {
  getDashboardSummary,
  getDashboardStats,
};
