import type { AppEntity } from './base';

/**
 * AcademicYear Entity - Domain representation of an academic period.
 */
export interface AcademicYear extends AppEntity {
  name: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  config?: any;
}

/**
 * JournalEntry Entity - Domain representation of a teacher's classroom journal.
 */
export interface JournalEntry extends AppEntity {
  teacherId: string;
  teacherName: string;
  className: string;
  subject: string;
  date: string;
  jamKe: string;
  materi: string;
  catatan: string;
}
