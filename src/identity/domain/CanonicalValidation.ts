/**
 * @license
 * e-Mam System - Canonical User Validation & Permission Derivation
 */

import type { CanonicalUser } from './CanonicalUser';

export interface ValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateCanonicalUser(user: Partial<CanonicalUser> | null): ValidationResult {
  if (!user) {
    return {
      valid: false,
      missing: ['uid', 'id', 'tenantId', 'accountType', 'role', 'roles', 'status'],
    };
  }

  const missing: string[] = [];

  if (!user.uid || user.uid.trim() === '') {
    missing.push('uid');
  }
  if (!user.id || user.id.trim() === '') {
    missing.push('id');
  } else if (user.uid && user.id !== user.uid) {
    missing.push('id-uid-mismatch');
  }
  if (!user.tenantId || user.tenantId.trim() === '') {
    missing.push('tenantId');
  } else if (user.role === 'developer' && user.tenantId !== 'system') {
    missing.push('developer-tenant-system-violation');
  }
  if (!user.accountType || user.accountType.trim() === '') {
    missing.push('accountType');
  }
  if (!user.role || String(user.role).trim() === '') {
    missing.push('role');
  }
  if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    missing.push('roles');
  } else if (user.role && !user.roles.includes(user.role)) {
    missing.push('role-consistency-violation');
  }
  if (!user.status || user.status.trim() === '') {
    missing.push('status');
  }

  // ReferenceId binding checks for teacher and student roles
  if (user.role === 'guru' || user.role === 'kepala_madrasah') {
    if (!user.referenceId && !user.teachersId) {
      missing.push('referenceId-required-for-teacher');
    }
  }
  if (user.role === 'siswa') {
    if (!user.referenceId && !user.studentsId) {
      missing.push('referenceId-required-for-student');
    }
  }

  return {
    valid: missing.length === 0 && user.status !== 'pending' && user.status !== 'rejected',
    missing,
  };
}

export function derivePermissionsForRole(role: string, roles: (string | any)[] = []): string[] {
  const perms = new Set<string>();
  const allRoles = [role, ...roles].map((r) => String(r || '').toLowerCase());

  if (allRoles.includes('admin') || allRoles.includes('administrator')) {
    return ['*'];
  }

  if (allRoles.includes('teacher') || allRoles.includes('guru') || allRoles.includes('walas')) {
    perms.add('student.read');
    perms.add('attendance.read');
    perms.add('attendance.create');
    perms.add('journal.create');
    perms.add('grades.read');
    perms.add('grades.create');
    perms.add('schedule.read');
  }

  if (allRoles.includes('bk') || allRoles.includes('guru_bk')) {
    perms.add('student.read');
    perms.add('point.read');
    perms.add('point.create');
    perms.add('attendance.read');
  }

  if (allRoles.includes('tu') || allRoles.includes('operator')) {
    perms.add('student.read');
    perms.add('student.create');
    perms.add('student.update');
    perms.add('teacher.read');
    perms.add('letter.read');
    perms.add('letter.create');
    perms.add('attendance.read');
  }

  if (allRoles.includes('student') || allRoles.includes('siswa')) {
    perms.add('attendance.read');
    perms.add('schedule.read');
    perms.add('grades.read');
    perms.add('letter.create');
  }

  if (allRoles.includes('parent') || allRoles.includes('orang_tua')) {
    perms.add('student.read');
    perms.add('attendance.read');
    perms.add('grades.read');
  }

  if (perms.size === 0) {
    perms.add('dashboard.read');
  }

  return Array.from(perms);
}
