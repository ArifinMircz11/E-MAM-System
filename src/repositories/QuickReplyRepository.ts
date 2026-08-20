import { BaseRepository } from './BaseRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';

export interface QuickReplyEntity extends AppEntity, Record<string, any> {
  id: string;
  agentId?: string;
  title: string;
  message: string;
  categoryId?: string;
  isActive: boolean;
}

export class QuickReplyRepository extends BaseRepository<QuickReplyEntity> {
  constructor() {
    super('quick_reply');
  }

  async getActiveReplies(context: SecurityContext): Promise<QuickReplyEntity[]> {
    const items = await this.table.where('tenantId').equals(context.tenantId).toArray();
    return items.filter((r) => r.isActive !== false);
  }
}

export const quickReplyRepository = new QuickReplyRepository();
