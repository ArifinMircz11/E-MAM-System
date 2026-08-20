import { ImpersonationSession, ImpersonationAuditEvent } from './ImpersonationSession';
import { impersonationRepository } from './ImpersonationRepository';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { auditLog } from '@/services/auditLogService';
import { LegacyUserAdapter } from '@/core/identity/adapters/LegacyUserAdapter';

export class ImpersonationService {
  async startImpersonation(targetUser: any, reason: string = 'Enterprise Testing & Support'): Promise<ImpersonationSession> {
    const authState = useAuthStore.getState();
    const userState = useUserStore.getState();

    const currentDevUser = authState.user || {
      uid: userState.uid || 'developer_uid',
      name: 'Developer Administrator',
      email: 'developer@emam.app',
      role: 'developer',
      accountType: 'developer',
      tenantId: 'global',
    };

    const session: ImpersonationSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'IMPERSONATION',
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      originalUserId: currentDevUser.uid || 'developer_uid',
      targetUserId: targetUser.uid || targetUser.id || 'target_uid',
      reason,
      createdBy: currentDevUser.uid || 'developer_uid',
      originalUserSnapshot: currentDevUser,
      targetUserSnapshot: targetUser,
    };

    // Save session in repository
    await impersonationRepository.saveActiveSession(session);

    // Normalize target user
    const rawTargetTenant = targetUser.tenantId || targetUser.organizationId;
    if (!rawTargetTenant || rawTargetTenant === 'system' || rawTargetTenant === 'global' || rawTargetTenant === 'default' || rawTargetTenant === 'unknown') {
      // If target user doesn't have an explicit valid tenant, do NOT fabricate one; enforce fail-closed unless developer account
      if (targetUser.role !== 'developer' && targetUser.accountType !== 'developer') {
        throw new Error(`[ImpersonationService] Fail-Closed: Target user has missing or invalid explicit tenantId: "${rawTargetTenant}".`);
      }
    }

    const normalizedTarget = LegacyUserAdapter.normalizeCanonicalUser({
      ...targetUser,
      uid: targetUser.uid || targetUser.id || 'target_uid',
      name: targetUser.name || targetUser.displayName || 'Target User',
      role: targetUser.role || 'guru',
      accountType: targetUser.accountType || (targetUser.role === 'developer' ? 'developer' : 'madrasah'),
      tenantId: rawTargetTenant || 'global',
      isImpersonated: true,
      originalDeveloper: currentDevUser,
    });

    if (!normalizedTarget) throw new Error('Target user normalization failed');

    // Update Auth Store with Target User
    useAuthStore.getState().setUser(normalizedTarget);

    // Update User Store
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

    // Record Audit Log
    const auditData: ImpersonationAuditEvent = {
      event: 'IMPERSONATION_STARTED',
      actor: session.originalUserId,
      target: session.targetUserId,
      timestamp: session.startedAt,
    };

    try {
      await auditLog({
        action: 'IMPERSONATION_STARTED',
        actorId: session.originalUserId,
        tenantId: normalizedTarget.tenantId,
        details: JSON.stringify(auditData),
      } as any);
    } catch (e) {
      console.warn('[ImpersonationService] Failed to record start audit log:', e);
    }

    return session;
  }

  async stopImpersonation(): Promise<void> {
    const session = await impersonationRepository.getActiveSession();
    
    // Clear session in repo
    await impersonationRepository.clearActiveSession();

    if (session && session.originalUserSnapshot) {
      const devUser = session.originalUserSnapshot;
      const normalizedDev = LegacyUserAdapter.normalizeCanonicalUser({
        ...devUser,
        isImpersonated: false,
      });

      if (!normalizedDev) throw new Error('Dev user normalization failed');

      // Restore Dev User in Auth Store
      useAuthStore.getState().setUser(normalizedDev);

      // Restore Dev User in User Store
      useUserStore.getState().setUserData({
        uid: normalizedDev.uid,
        tenantId: normalizedDev.tenantId,
        accountType: normalizedDev.accountType as any,
        role: normalizedDev.role || 'developer',
        roles: normalizedDev.roles || ['developer'],
        user: normalizedDev,
        email: normalizedDev.email,
        isLoaded: true,
      });

      // Record Audit Log
      const auditData: ImpersonationAuditEvent = {
        event: 'IMPERSONATION_ENDED',
        actor: session.originalUserId,
        target: session.targetUserId,
        timestamp: new Date().toISOString(),
      };

      try {
        await auditLog({
          action: 'IMPERSONATION_ENDED',
          actorId: session.originalUserId,
          tenantId: session.originalUserSnapshot?.tenantId || 'global',
          details: JSON.stringify(auditData),
        } as any);
      } catch (e) {
        console.warn('[ImpersonationService] Failed to record end audit log:', e);
      }
    }
  }

  async getActiveSession(): Promise<ImpersonationSession | null> {
    return impersonationRepository.getActiveSession();
  }
}

export const impersonationService = new ImpersonationService();
