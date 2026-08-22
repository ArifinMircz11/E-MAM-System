import { ImpersonationSession, ImpersonationAuditEvent } from './ImpersonationSession';
import { impersonationRepository } from './ImpersonationRepository';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { auditLog } from '@/services/auditLogService';
import { LegacyUserAdapter } from '@/core/identity/adapters/LegacyUserAdapter';

const INVALID_TENANTS = new Set(['', 'global', 'default', 'unknown']);

/**
 * Impersonation is a privileged operation. This client service is only a
 * session projection; the backend must independently authorize the operation.
 * Never synthesize a developer identity or tenant here.
 */
export class ImpersonationService {
  async startImpersonation(targetUser: any, reason = 'Enterprise Testing & Support'): Promise<ImpersonationSession> {
    const authState = useAuthStore.getState();
    const userState = useUserStore.getState();
    const currentDevUser = authState.user || userState.user;

    if (!currentDevUser?.uid || currentDevUser.accountType !== 'developer' || currentDevUser.role !== 'developer') {
      throw new Error('IMPERSONATION_FORBIDDEN: canonical developer identity required');
    }

    if (String(currentDevUser.tenantId || '').trim() !== 'system') {
      throw new Error('IMPERSONATION_FORBIDDEN: developer must use system tenant');
    }

    if (!targetUser?.uid && !targetUser?.id) {
      throw new Error('IMPERSONATION_INVALID_TARGET');
    }

    const targetTenant = String(targetUser.tenantId || '').trim();
    if (INVALID_TENANTS.has(targetTenant.toLowerCase())) {
      throw new Error('IMPERSONATION_INVALID_TARGET_TENANT');
    }

    const targetUid = targetUser.uid || targetUser.id;
    const session: ImpersonationSession = {
      sessionId: `session_${crypto.randomUUID()}`,
      type: 'IMPERSONATION',
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      originalUserId: currentDevUser.uid,
      targetUserId: targetUid,
      reason: reason.trim() || 'Enterprise Testing & Support',
      createdBy: currentDevUser.uid,
      originalUserSnapshot: currentDevUser,
      targetUserSnapshot: targetUser,
    };

    // The repository is only a local/session projection. Authorization is not
    // delegated to client state and must be enforced server-side.
    await impersonationRepository.saveActiveSession(session);

    const normalizedTarget = LegacyUserAdapter.normalizeCanonicalUser({
      ...targetUser,
      uid: targetUid,
      id: targetUid,
      tenantId: targetTenant,
      isImpersonated: true,
      originalDeveloper: currentDevUser,
    });

    if (!normalizedTarget) throw new Error('IMPERSONATION_TARGET_NORMALIZATION_FAILED');

    useAuthStore.getState().setUser(normalizedTarget);
    useUserStore.getState().setUserData({
      uid: normalizedTarget.uid,
      tenantId: normalizedTarget.tenantId,
      accountType: normalizedTarget.accountType as any,
      role: normalizedTarget.role,
      roles: normalizedTarget.roles || [normalizedTarget.role],
      user: normalizedTarget,
      email: normalizedTarget.email,
      isLoaded: true,
    });

    const auditData: ImpersonationAuditEvent = {
      event: 'IMPERSONATION_STARTED',
      actor: session.originalUserId,
      target: session.targetUserId,
      timestamp: session.startedAt,
    };

    await auditLog({
      action: 'IMPERSONATION_STARTED',
      actorId: session.originalUserId,
      tenantId: targetTenant,
      details: JSON.stringify(auditData),
    } as any);

    return session;
  }

  async stopImpersonation(): Promise<void> {
    const session = await impersonationRepository.getActiveSession();
    await impersonationRepository.clearActiveSession();

    if (!session?.originalUserSnapshot) return;

    const devUser = session.originalUserSnapshot;
    if (devUser.accountType !== 'developer' || devUser.role !== 'developer' || devUser.tenantId !== 'system') {
      throw new Error('IMPERSONATION_RESTORE_INVALID_DEVELOPER');
    }

    const normalizedDev = LegacyUserAdapter.normalizeCanonicalUser({
      ...devUser,
      tenantId: 'system',
      isImpersonated: false,
    });

    if (!normalizedDev) throw new Error('IMPERSONATION_RESTORE_FAILED');

    useAuthStore.getState().setUser(normalizedDev);
    useUserStore.getState().setUserData({
      uid: normalizedDev.uid,
      tenantId: 'system',
      accountType: normalizedDev.accountType as any,
      role: 'developer',
      roles: ['developer'],
      user: normalizedDev,
      email: normalizedDev.email,
      isLoaded: true,
    });

    const auditData: ImpersonationAuditEvent = {
      event: 'IMPERSONATION_ENDED',
      actor: session.originalUserId,
      target: session.targetUserId,
      timestamp: new Date().toISOString(),
    };

    await auditLog({
      action: 'IMPERSONATION_ENDED',
      actorId: session.originalUserId,
      tenantId: 'system',
      details: JSON.stringify(auditData),
    } as any);
  }

  async getActiveSession(): Promise<ImpersonationSession | null> {
    return impersonationRepository.getActiveSession();
  }
}

export const impersonationService = new ImpersonationService();
