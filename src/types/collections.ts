// src/types/collections.ts

/**
 * Central registry for all Firestore collection names.
 *
 * Rules:
 * - Never hardcode collection names.
 * - Repository must import from this file.
 * - SyncEngine must import from this file.
 * - Services must never reference collection names directly.
 */
export const COLLECTIONS = {
  // Identity
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',

  // Academic
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  ACADEMIC_YEARS: 'academic_years',
  SUBJECTS: 'subjects',
  SCHEDULES: 'schedules',

  // Attendance
  ATTENDANCE_DAILY: 'attendance_daily',
  TEACHER_ATTENDANCE: 'teacher_attendance',

  // Discipline & Points
  POINT_CATEGORIES: 'point_categories',
  POINT_TRANSACTIONS: 'point_transactions',
  POINT_SUMMARIES: 'point_summaries',

  // Letters & Administration
  STUDENT_LETTERS: 'student_letters',
  PTSP_REQUESTS: 'ptsp_requests',
  PROFILE_REQUESTS: 'profile_requests',
  APPROVAL_REQUESTS: 'approval_requests',

  // Communication
  CHATS: 'chats',
  MESSAGES: 'messages',
  COMPLAINTS: 'complaints',
  NOTIFICATIONS: 'notifications',
  NEWS: 'news',

  // Academic Records
  JOURNALS: 'journals',

  // Audit & Sync
  AUDIT_LOGS: 'audit_logs',
  SYNC_QUEUE: 'sync_queue',

  // System
  SETTINGS: 'settings',
  TENANTS: 'tenants',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
