/**
 * EVENT CONTRACT
 * Definisi tipe event yang ketat untuk menjamin komunikasi antar domain.
 * Semua event harus versioned dan immutable.
 */

export type EventVersion = '1.0.0';

export interface BaseEvent<TData> {
  id: string;
  version: EventVersion;
  timestamp: number;
  data: TData;
}

// Event Surat Izin
export interface LetterApprovedEvent {
  letterId: string;
  studentId: string;
  status: 'Izin' | 'Sakit';
  approvedBy: string;
}

export type EventMap = {
  LETTER_APPROVED: BaseEvent<LetterApprovedEvent>;
  ATTENDANCE_MARKED: BaseEvent<{ studentId: string; date: string; status: string }>;
  BK_POINT_ADDED: BaseEvent<{ studentId: string; points: number; reason: string }>;
  PROFILE_COMPLETED: BaseEvent<{ uid: string; userData: Record<string, any> }>;
  DATA_SYNCED: BaseEvent<{ collection: string; id: string }>;
  POINT_ADDED: BaseEvent<{ pointRecord: any }>;
  POINT_THRESHOLD_EXCEEDED: BaseEvent<{
    studentId: string;
    studentName: string;
    className?: string;
    previousTotal: number;
    newTotal: number;
    thresholdValue: number;
    ruleId: string;
    templateType: string;
    sanctionLabel: string;
    tenantId: string;
    idempotencyKey: string;
  }>;
  POINT_DELETED: BaseEvent<{ pointId: string; studentId: string; pointsToUndo: number }>;
  POINT_CATEGORY_CHANGED: BaseEvent<{ categoryId: string; action: string }>;
  USER_UPDATED: BaseEvent<{ uid: string; details: string; category?: string }>;
  USER_DELETED: BaseEvent<{ uid: string; details: string }>;
  ACCOUNT_SUSPENDED: BaseEvent<{ userId: string; displayName: string; details: string }>;
  ACCOUNT_REACTIVATED: BaseEvent<{ userId: string; displayName: string; details: string }>;
  ACCOUNT_REJECTED: BaseEvent<{ userId: string; details: string }>;
  BULK_USERS_ACTIVATED: BaseEvent<{ count: number; details: string }>;
  PROFILE_UPDATE_SUBMITTED: BaseEvent<{
    reqId: string;
    displayName: string;
    targetCollection: string;
    referenceId: string;
    details: string;
  }>;
  PROFILE_UPDATE_APPROVED: BaseEvent<{ reqId: string; details: string }>;
  PROFILE_UPDATE_REJECTED: BaseEvent<{ reqId: string; details: string }>;
  REFERENCE_IDS_REPAIRED: BaseEvent<{ count: number; details: string }>;
  ATTENDANCE_RECORDED: BaseEvent<{ record: any; context: any; details: string }>;
  TEACHER_ATTENDANCE_RECORDED: BaseEvent<{
    record: any;
    teacherName: string;
    className: string;
    status: string;
    distance: number;
    details: string;
  }>;
  LETTER_STATUS_CHANGED: BaseEvent<{
    letterId: string;
    status: string;
    updatedData: any;
    details: string;
  }>;
};

export type EventName = keyof EventMap;
