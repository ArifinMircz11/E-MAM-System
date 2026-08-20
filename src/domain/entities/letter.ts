import type { AppEntity } from './base';

/**
 * Letter Entity - Domain representation of a student letter request (PTSP).
 */
export interface LetterRequest extends AppEntity {
  studentsId?: string;
  studentId?: string;
  userId?: string;
  classId?: string | null;
  userName?: string;
  type: string;
  reason?: string;
  description?: string;
  status: 'Pending' | 'Verified' | 'Validated' | 'Signed' | 'Ditolak' | 'Proses';
  archives?: any[];
  notes?: string;
  processedBy?: string;
  processedAt?: string;
}
