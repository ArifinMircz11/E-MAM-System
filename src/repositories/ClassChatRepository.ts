import { BaseRepository } from './BaseRepository';
import type { SecurityContext } from '@/core/security/types';

export interface ClassChatMessage {
  id: string;
  tenantId: string;
  classId: string;
  senderId: string;
  senderName?: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  syncStatus?: string;
}

/** Local-first repository for class chat messages. Cloud transport belongs to SyncEngine. */
export class ClassChatRepository extends BaseRepository<ClassChatMessage> {
  constructor() {
    super('messages');
  }

  async listByClass(context: SecurityContext, classId: string): Promise<ClassChatMessage[]> {
    this.validateContext(context, 'listByClass');
    const rows = await this.getTable()
      .where('tenantId')
      .equals(context.tenantId)
      .filter((row: ClassChatMessage) => row.classId === classId)
      .toArray();
    return rows.sort((a, b) => a.createdAt - b.createdAt);
  }
}

export const classChatRepository = new ClassChatRepository();
