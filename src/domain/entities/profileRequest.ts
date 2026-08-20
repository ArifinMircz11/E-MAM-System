import type { AppEntity } from './base';

/**
 * ProfileUpdateRequest Entity - Domain representation of a profile change request.
 */
export interface ProfileUpdateRequest extends AppEntity {
  userId: string;
  entityType: 'student' | 'teacher' | 'user';
  targetCollection: 'users' | 'students' | 'teachers';
  referenceId: string;
  status: 'pending' | 'approved' | 'rejected';
  newData: any;
  submittedAt: string;
  displayName: string;
  nisn?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewNotes?: string;
}
