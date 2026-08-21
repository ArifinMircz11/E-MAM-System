import type { Table } from 'dexie';
import type { Student, Teacher, ClassData, PointCategory, AttendanceRecord } from '@/types';

/**
 * @deprecated Compatibility-only Dexie contract.
 *
 * The operational database is owned by the canonical database layer under
 * `src/core/database`. New repositories must resolve tables from the
 * canonical database and must not instantiate or extend this contract.
 *
 * This file intentionally contains no Dexie subclass/instance so it cannot
 * become a second operational database.
 */
export interface LocalDbSchema {
  students: Table<Student, string>;
  teachers: Table<Teacher, string>;
  classes: Table<ClassData, string>;
  pointCategories: Table<PointCategory, string>;
  attendance: Table<AttendanceRecord, string>;
  journals: Table<any, string>;
  student_point_summaries: Table<any, string>;
  pointRankings: Table<any, string>;
  loginHistory: Table<any, string>;
  notificationLogs: Table<any, string>;
  letters: Table<any, string>;
  academicYears: Table<any, string>;
  schedules: Table<any, string>;
  documentation: Table<any, string>;
  teacher_attendance: Table<any, string>;
  poin: Table<any, string>;
  cache: Table<{ key: string; data: any; updatedAt: number; expiresAt?: number }, string>;
  systemSettings: Table<{ key: string; value: any; lastUpdated: number }, string>;
  sync_queue: Table<any, any>;
  dead_letter_queue: Table<any, any>;
  users: Table<any, string>;
  news: Table<any, string>;
  messages: Table<any, string>;
  conversations: Table<any, string>;
  messageParticipants: Table<any, string>;
  messageQueue: Table<any, string>;
  audit_logs: Table<any, string>;
  loginLog: Table<any, string>;
  activityLog: Table<any, string>;
  approval_requests: Table<any, string>;
  complaints: Table<any, string>;
  profile_update_requests: Table<any, string>;
  notifications: Table<any, string>;
  points: Table<any, string>;
  point_categories: Table<any, string>;
  academic_years: Table<any, string>;
  syncMetadata: Table<any, string>;
  dashboard_summaries: Table<any, string>;
  templates: Table<any, string>;
}

/**
 * @deprecated Do not subclass. Kept only so legacy type imports continue to
 * resolve while consumers are migrated to the canonical database layer.
 */
export declare abstract class EMamBaseDatabase implements LocalDbSchema {
  abstract students: Table<Student, string>;
  abstract teachers: Table<Teacher, string>;
  abstract classes: Table<ClassData, string>;
  abstract pointCategories: Table<PointCategory, string>;
  abstract attendance: Table<AttendanceRecord, string>;
  abstract journals: Table<any, string>;
  abstract student_point_summaries: Table<any, string>;
  abstract pointRankings: Table<any, string>;
  abstract loginHistory: Table<any, string>;
  abstract notificationLogs: Table<any, string>;
  abstract letters: Table<any, string>;
  abstract academicYears: Table<any, string>;
  abstract schedules: Table<any, string>;
  abstract documentation: Table<any, string>;
  abstract teacher_attendance: Table<any, string>;
  abstract poin: Table<any, string>;
  abstract cache: Table<{ key: string; data: any; updatedAt: number; expiresAt?: number }, string>;
  abstract systemSettings: Table<{ key: string; value: any; lastUpdated: number }, string>;
  abstract sync_queue: Table<any, any>;
  abstract dead_letter_queue: Table<any, any>;
  abstract users: Table<any, string>;
  abstract news: Table<any, string>;
  abstract messages: Table<any, string>;
  abstract conversations: Table<any, string>;
  abstract messageParticipants: Table<any, string>;
  abstract messageQueue: Table<any, string>;
  abstract audit_logs: Table<any, string>;
  abstract loginLog: Table<any, string>;
  abstract activityLog: Table<any, string>;
  abstract approval_requests: Table<any, string>;
  abstract complaints: Table<any, string>;
  abstract profile_update_requests: Table<any, string>;
  abstract notifications: Table<any, string>;
  abstract points: Table<any, string>;
  abstract point_categories: Table<any, string>;
  abstract academic_years: Table<any, string>;
  abstract syncMetadata: Table<any, string>;
  abstract dashboard_summaries: Table<any, string>;
  abstract templates: Table<any, string>;
}
