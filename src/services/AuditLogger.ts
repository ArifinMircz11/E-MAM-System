import { generateManualId } from '@/utils/dataHelpers';
import { auditRepository } from '@/repositories/auditRepository';
import { TenantContext } from '@/core/context/TenantContext';

class AuditLoggerClass {
  async log(
    userId: string,
    action: string,
    module: string,
    status: 'success' | 'error' | 'warning',
    details?: any,
  ) {
    let context: any;
    try {
      context = TenantContext.getContext();
    } catch (e) {
      // Context might not be available yet, fallback to generic
      context = {
        tenantId: 'global',
        uid: userId || 'system',
        role: 'system',
        permissions: [],
        roles: [],
        scopes: [],
        featureFlags: {},
        sessionId: 'init',
        isDeveloper: false,
      };
    }

    const logId = generateManualId(`audit_${context.tenantId}`);
    const logEntry = {
      id: logId,
      userId: userId || context.uid,
      action,
      category: module,
      status,
      details: details || null,
      timestamp: Date.now(),
      serverTime: new Date().toISOString(),
      tenantId: context.tenantId,
    };

    try {
      // Repository save automatically handles local write + sync queue enrollment
      await auditRepository.save(context, logEntry);
    } catch (e) {
      console.warn('[AuditLogger] Failed to write to local audit log', e);
    }
  }
}

export const AuditLogger = new AuditLoggerClass();
