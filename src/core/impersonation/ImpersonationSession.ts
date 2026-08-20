export interface ImpersonationSession {
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

export interface ImpersonationAuditEvent {
  event: 'IMPERSONATION_STARTED' | 'IMPERSONATION_ENDED';
  actor: string;
  target: string;
  timestamp: string;
}
