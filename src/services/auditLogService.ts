import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { getDocsOptimized } from '@/services/sync/firestoreHelpers';
import { generateManualId } from '@/utils/dataHelpers';
import { auditRepository } from '@/repositories/auditRepository';
import { SecurityContextService } from '@/core/security/SecurityContextService';

export type LogCategory = 'SECURITY' | 'ATTENDANCE' | 'USER' | 'SYSTEM' | 'GRADE' | 'SURAT' | 'AUTH' | 'POINTS';

export interface AuditLog {
  id?: string; userId: string; userEmail?: string; userName?: string; userRole?: string; action: string;
  category: LogCategory; target?: string; details: string; metadata?: any; deviceInfo?: string;
  schoolId?: string; tenantId?: string; timestamp?: any;
}

let lastLoggedTimes: number[] = [];
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60000;
let lastLogSignature = '';
let lastLogTimestamp = 0;

const requireAuditContext = () => {
  const context = SecurityContextService.getNullableContext();
  if (!context || !SecurityContextService.isReady() || !context.uid || !context.tenantId) {
    throw new Error('AUDIT_SECURITY_CONTEXT_NOT_READY');
  }
  return context;
};

export const logAudit = async (log: Partial<AuditLog>) => {
  const action = log.action || 'UNDEFINED_ACTION';
  const details = log.details || '';
  const now = Date.now();
  const currentSignature = `${log.category}_${action}_${details.substring(0, 50)}`;
  if (currentSignature === lastLogSignature && now - lastLogTimestamp < 5000) return;
  lastLogSignature = currentSignature;
  lastLogTimestamp = now;
  lastLoggedTimes = lastLoggedTimes.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (lastLoggedTimes.length >= RATE_LIMIT_MAX) return;
  lastLoggedTimes.push(now);

  let context;
  try { context = requireAuditContext(); }
  catch (error) { console.warn('[AuditLog] skipped: canonical SecurityContext unavailable', error); return; }

  const logId = generateManualId(`${context.tenantId}_${action.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`);
  const logEntry = {
    id: logId,
    userId: log.userId || context.uid,
    userEmail: log.userEmail || '', userName: log.userName || '', userRole: log.userRole || '',
    action: action.substring(0, 500), category: log.category || 'SYSTEM', target: log.target || 'N/A',
    details: details.substring(0, 4800), metadata: log.metadata || {},
    deviceInfo: log.deviceInfo || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
    tenantId: context.tenantId, timestamp: now, serverTime: new Date().toISOString(),
  };
  try { await auditRepository.save(context, logEntry); }
  catch (error) { console.warn('[AuditLog] Repository save failed:', error); }
};

export const auditLog = (logData: { action: string; category: LogCategory; details?: string; metadata?: any; schoolId?: string }) =>
  logAudit({ action: logData.action, category: logData.category, details: logData.details, metadata: logData.metadata, schoolId: logData.schoolId });

export const logLogin = async (data: { userId: string; email: string; name: string; role: string; tenantId: string }) => {
  try {
    const context = requireAuditContext();
    if (context.uid !== data.userId || context.tenantId !== data.tenantId) throw new Error('LOGIN_AUDIT_CONTEXT_MISMATCH');
    const manualId = generateManualId(`${context.tenantId}_${data.userId}_${Date.now()}`);
    await auditRepository.save(context, { id: manualId, ...data, category: 'AUTH', action: 'LOGIN', timestamp: Date.now(), deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown' });
  } catch (e) { console.error('[AuditLog] Failed to log login:', e); }
};

export const getAuditLogs = async (maxCount: number = 50) => {
  try {
    const context = requireAuditContext();
    const q = dbGateway.query(dbGateway.collection(dbGateway.db, 'audit_logs'), dbGateway.where('tenantId', '==', context.tenantId), dbGateway.orderBy('timestamp', 'desc'), dbGateway.limit(maxCount));
    return await getDocsOptimized<AuditLog>(q);
  } catch (error) { console.error('Failed to get audit logs:', error); return []; }
};

export const getAuditLogsPaginated = async (tenantId: string, lastDoc: any | null = null, pageSize: number = 25) => {
  try {
    const context = requireAuditContext();
    if (context.tenantId !== tenantId) throw new Error('AUDIT_TENANT_MISMATCH');
    let q = dbGateway.query(dbGateway.collection(dbGateway.db, 'audit_logs'), dbGateway.where('tenantId', '==', tenantId), dbGateway.orderBy('timestamp', 'desc'), dbGateway.limit(pageSize));
    if (lastDoc) q = dbGateway.query(q, (dbGateway as any).startAfter(lastDoc));
    const snap = await dbGateway.getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AuditLog);
    return { data, lastDoc: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null };
  } catch (error) { console.error('[AuditLog] Failed to get paginated audit logs:', error); return { data: [], lastDoc: null }; }
};

let isListenersInitialized = false;
export const initPointAuditListeners = () => {
  if (isListenersInitialized) return;
  isListenersInitialized = true;
  import('@/events/eventBus').then(({ eventBus }) => {
    eventBus.subscribe('POINT_ADDED', async (event) => { const { pointRecord } = event.data; await logAudit({ action: 'ADD_POINT', category: 'POINTS', target: `poin/${pointRecord.id}`, details: `Poin diberikan kepada ${pointRecord.studentName} sebesar ${pointRecord.points}.` }); });
    eventBus.subscribe('POINT_DELETED', async (event) => { const { pointId, studentId, pointsToUndo } = event.data; await logAudit({ action: 'DELETE_POINT', category: 'POINTS', target: `poin/${pointId}`, details: `Poin dihapus untuk siswa ${studentId}, poin yang dikurangi: ${pointsToUndo}.` }); });
    eventBus.subscribe('POINT_CATEGORY_CHANGED', async (event) => { const { categoryId, action } = event.data; await logAudit({ action: 'CATEGORY_CHANGED', category: 'POINTS', target: `point_categories/${categoryId}`, details: `Kategori poin ${categoryId} diubah dengan aksi: ${action}.` }); });
  });
};

export const initUserAuditListeners = () => {
  if (isListenersInitialized) return;
  import('@/events/eventBus').then(({ eventBus }) => {
    eventBus.subscribe('USER_UPDATED', async (event) => { const { uid, details, category } = event.data; await logAudit({ action: 'UPDATE_USER', category: (category as LogCategory) || 'USER', target: `users/${uid}`, details }); });
    eventBus.subscribe('USER_DELETED', async (event) => { const { uid, details } = event.data; await logAudit({ action: 'DELETE_USER', category: 'SECURITY', target: `users/${uid}`, details }); });
    eventBus.subscribe('ACCOUNT_SUSPENDED', async (event) => { const { userId, details } = event.data; await logAudit({ action: 'SUSPEND_USER', category: 'AUTH', target: `users/${userId}`, details }); });
    eventBus.subscribe('ACCOUNT_REACTIVATED', async (event) => { const { userId, details } = event.data; await logAudit({ action: 'REACTIVATE_USER', category: 'AUTH', target: `users/${userId}`, details }); });
    eventBus.subscribe('ACCOUNT_REJECTED', async (event) => { const { userId, details } = event.data; await logAudit({ action: 'REJECT_ACCOUNT', category: 'AUTH', target: `users/${userId}`, details }); });
    eventBus.subscribe('BULK_USERS_ACTIVATED', async (event) => { const { details } = event.data; await logAudit({ action: 'BULK_ACTIVATE_USERS', category: 'AUTH', details }); });
    eventBus.subscribe('PROFILE_UPDATE_SUBMITTED', async (event) => { const { reqId, details } = event.data; await logAudit({ action: 'PROFILE_UPDATE_SUBMITTED', category: 'USER', target: `profile_update_requests/${reqId}`, details }); });
    eventBus.subscribe('PROFILE_UPDATE_APPROVED', async (event) => { const { reqId, details } = event.data; await logAudit({ action: 'PROFILE_UPDATE_APPROVED', category: 'USER', target: `profile_update_requests/${reqId}`, details }); });
    eventBus.subscribe('PROFILE_UPDATE_REJECTED', async (event) => { const { reqId, details } = event.data; await logAudit({ action: 'PROFILE_UPDATE_REJECTED', category: 'USER', target: `profile_update_requests/${reqId}`, details }); });
    eventBus.subscribe('REFERENCE_IDS_REPAIRED', async (event) => { const { details } = event.data; await logAudit({ action: 'REPAIR_REFERENCE_IDS', category: 'SYSTEM', details }); });
    eventBus.subscribe('ATTENDANCE_RECORDED', async (event) => { const { record, details } = event.data; await logAudit({ action: 'TAKE_ATTENDANCE', category: 'ATTENDANCE', target: `attendance/${record.id}`, details }); });
    eventBus.subscribe('TEACHER_ATTENDANCE_RECORDED', async (event) => { const { record, details } = event.data; await logAudit({ action: 'TEACHER_ATTENDANCE_SCAN', category: 'ATTENDANCE', target: `teacher_attendance/${record.id}`, details }); });
    eventBus.subscribe('LETTER_STATUS_CHANGED', async (event) => { const { letterId, details } = event.data; await logAudit({ action: 'UPDATE_LETTER_STATUS', category: 'SURAT', target: `letters/${letterId}`, details }); });
  });
};
