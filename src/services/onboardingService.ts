import { onboardingRepository, type OnboardingRequest } from '@/repositories/OnboardingRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import { logAudit } from './auditLogService';

export type { OnboardingRequest };

function tenantIdOrThrow(): string {
  const context = getSecurityContext(false);
  if (!context?.uid || !context.tenantId) throw new Error('ONBOARDING_SECURITY_CONTEXT_INVALID');
  return context.tenantId;
}

/**
 * Gate 1 is local-first. The request and user status are committed to Dexie
 * before their corresponding SyncQueue mutations are created.
 */
export async function submitProfileCompletionRequest(request: any): Promise<void> {
  const tenantId = tenantIdOrThrow();
  await onboardingRepository.submitGate1(request, tenantId);
  await logAudit({
    userId: request.userId,
    userEmail: request.email,
    userName: request.displayName,
    action: 'SUBMIT_PROFILE_COMPLETION',
    category: 'AUTH',
    details: `User submitted profile completion request for role: ${request.role}`,
  });
}

/** Gate 2 data linkage is local-first and queued for synchronization. */
export async function submitDataLinkageRequest(
  userId: string,
  targetId: string,
  role: 'siswa' | 'guru',
  details: any,
): Promise<void> {
  const tenantId = tenantIdOrThrow();
  await onboardingRepository.submitGate2(userId, targetId, role, details, tenantId);
  await logAudit({
    userId,
    userEmail: details.email,
    userName: details.displayName,
    action: 'SUBMIT_DATA_LINKAGE_REQUEST',
    category: 'AUTH',
    details: `User submitted Gate 2 data linkage request for ID: ${targetId} (${role})`,
  });
}

export async function getOnboardingRequestByUserId(userId: string): Promise<OnboardingRequest | null> {
  return onboardingRepository.getLatestByUserId(userId, tenantIdOrThrow());
}

export async function getPendingOnboardingRequests(): Promise<OnboardingRequest[]> {
  try { return await onboardingRepository.listPending(tenantIdOrThrow(), 'gate1'); }
  catch { return []; }
}

/**
 * Local reactive subscription. It intentionally does not use Firestore
 * onSnapshot; Dexie is the operational source of truth.
 */
export function subscribePendingOnboardingRequests(
  tenantId: string,
  onUpdate: (requests: OnboardingRequest[]) => void,
  onError?: (err: any) => void,
): () => void {
  try {
    return onboardingRepository.subscribePending(tenantId, onUpdate, onError);
  } catch (error) {
    onError?.(error);
    onUpdate([]);
    return () => {};
  }
}

export async function getPendingDataLinkageRequests(): Promise<OnboardingRequest[]> {
  try { return await onboardingRepository.listPending(tenantIdOrThrow(), 'gate2'); }
  catch { return []; }
}

export async function getOnboardingRequestsHistory(): Promise<OnboardingRequest[]> {
  try { return await onboardingRepository.listHistory(tenantIdOrThrow()); }
  catch { return []; }
}

/**
 * Resolve approval entirely against the local transaction first. The request,
 * user and master record are then represented by SyncQueue mutations.
 */
export async function resolveOnboardingRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  adminNote?: string,
  _approvedByEmail?: string,
  _approvedByUid?: string,
  fallbackRequest?: OnboardingRequest,
): Promise<void> {
  const tenantId = tenantIdOrThrow();
  await onboardingRepository.resolve(requestId, status, adminNote, fallbackRequest, tenantId);
  await logAudit({
    userId: fallbackRequest?.userId || requestId,
    userEmail: fallbackRequest?.email || '',
    userName: fallbackRequest?.displayName || '',
    action: status === 'approved' ? 'APPROVE_ONBOARDING' : 'REJECT_ONBOARDING',
    category: 'AUTH',
    details: `Onboarding request ${requestId} resolved as ${status}.`,
  });
}
