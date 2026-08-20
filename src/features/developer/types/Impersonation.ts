export interface ImpersonationTargetUser {
  uid: string;
  name: string;
  email?: string;
  role: string;
  accountType?: string;
  tenantId?: string;
  organizationName?: string;
  studentId?: string;
}

export interface ImpersonationSessionData {
  sessionId: string;
  type: 'IMPERSONATION';
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  expiresAt?: string;
  originalUserId: string;
  targetUserId: string;
  reason: string;
  createdBy: string;
  originalUserSnapshot?: any;
  targetUserSnapshot?: any;
}
