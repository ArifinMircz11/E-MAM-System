import { BaseRepository } from './BaseRepository';
import type { SecurityContext } from '@/core/security/types';

/**
 * AuditRepository
 *
 * Manages audit logs in IndexedDB (Dexie).
 * Audit logs are synchronized to Firestore unlike activity logs.
 */
export class AuditRepository extends BaseRepository<any> {
  constructor() {
    super('audit_logs');
  }

  /**
   * Retrieves audit logs for a specific user within the tenant.
   */
  async getByUser(context: SecurityContext, userId: string): Promise<any[]> {
    this.validateContext(context, 'getByUser');
    return await this.getTable()
      .where('[tenantId+userId]')
      .equals([context.tenantId, userId])
      .toArray();
  }

  /**
   * Retrieves audit logs by category.
   */
  async getByCategory(category: string): Promise<any[]> {
    return await this.getTable().where('category').equals(category).toArray();
  }

  async getByTenantId(tenantId: string): Promise<any[]> {
    return await this.findAll(tenantId);
  }
}

export const auditRepository = new AuditRepository();
