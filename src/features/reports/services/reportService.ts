import { getClasses } from '@/services/classService';
import { getStudents, getStudentData } from '@/services/studentService';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { teacherAttendanceRepository } from '@/repositories/teacherAttendanceRepository';
import { pointRepository } from '@/repositories/PointRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import { TenantContext } from '@/core/context/TenantContext';

/**
 * Service for handling complex reporting queries
 * COMPLIANCE: 100% Offline-First. All queries go through Repositories/Dexie.
 */
export const ReportService = {
  async getStudentsForReport(tenantId: string) {
    return await studentRepository.fetchByTenant(tenantId);
  },

  async getAttendanceForReport(tenantId: string, filter: { date?: string; month?: string }) {
    if (filter.date) {
      return await attendanceRepository.getByDate(tenantId, filter.date);
    } else if (filter.month) {
      // This is a bit broad, but reports often need a full month
      return await attendanceRepository.getByClassAndMonth(tenantId, 'All', filter.month);
    }
    return [];
  },
};

/**
 * NAMED EXPORTS FOR Reports.tsx COMPLIANCE
 */

export const getReportClasses = async (tenantId: string, forceRefresh = false) => {
  return await getClasses(forceRefresh);
};

export const getReportStudents = async (
  tenantId: string,
  studentId?: string,
  className?: string,
  useCache = true,
) => {
  const secCtx = getSecurityContext();
  let finalStudentId = studentId;

  if (secCtx.role === 'SISWA') {
    finalStudentId = secCtx.referenceId || finalStudentId;
    if (studentId && finalStudentId !== studentId) {
      throw new Error('Akses Ditolak: Tidak dapat memuat siswa lain.');
    }
  }

  if (finalStudentId) {
    const student = await getStudentData(finalStudentId);
    return student ? [student] : [];
  }
  return await getStudents(className, true, useCache);
};

export const fetchSingleStudentMonthlyAttendance = async (
  tenantId: string,
  studentId: string,
  className: string,
  month: string,
) => {
  const secCtx = getSecurityContext();
  if (secCtx.role === 'SISWA' && secCtx.referenceId && secCtx.referenceId !== studentId) {
    throw new Error('Akses Ditolak: Tidak dapat memuat laporan bulanan siswa lain.');
  }

  return await attendanceRepository.getByStudentId(tenantId, studentId);
};

export const getTeacherAttendanceReports = async (tenantId: string, date: string) => {
  const context = TenantContext.getContext();
  return await teacherAttendanceRepository.getLocalByTenantAndDate(context, date);
};

export const getStudentPointsReport = async (
  tenantId: string,
  className: string,
  month: string,
  studentId?: string,
) => {
  const secCtx = getSecurityContext();
  let finalStudentId = studentId;

  if (secCtx.role === 'SISWA') {
    finalStudentId = secCtx.referenceId || finalStudentId;
    if (studentId && finalStudentId !== studentId) {
      throw new Error('Akses Ditolak: Tidak dapat memuat laporan poin siswa lain.');
    }
  }

  if (finalStudentId) {
    return await pointRepository.getByStudent(finalStudentId);
  }
  return await pointRepository.getByClassAndMonth(tenantId, className, month);
};

export const getStudentAttendanceReports = async (
  tenantId: string,
  type: 'daily' | 'monthly' | string,
  className: string,
  date: string,
  month: string,
  studentId?: string,
) => {
  const secCtx = getSecurityContext();
  let finalStudentId = studentId;

  if (secCtx.role === 'SISWA') {
    finalStudentId = secCtx.referenceId || finalStudentId;
    if (studentId && finalStudentId !== studentId) {
      throw new Error('Akses Ditolak: Tidak dapat memuat laporan kehadiran siswa lain.');
    }
  }

  if (type === 'daily') {
    if (finalStudentId) {
      const att = await attendanceRepository.getByStudentId(tenantId, finalStudentId);
      return att.filter((r) => r.tanggal === date);
    }
    return await attendanceRepository.getByClassAndDate(tenantId, className, date);
  } else {
    // Monthly
    if (finalStudentId) {
      const att = await attendanceRepository.getByStudentId(tenantId, finalStudentId);
      return att.filter((r) => r.tanggal?.startsWith(month));
    }
    return await attendanceRepository.getByClassAndMonth(tenantId, className, month);
  }
};
