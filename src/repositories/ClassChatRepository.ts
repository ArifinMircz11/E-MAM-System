import { liveQuery } from 'dexie';
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

  observeByClass(
    context: SecurityContext,
    classId: string,
    onChange: (rows: ClassChatMessage[]) => void,
    onError?: (error: unknown) => void,
  ): () => void {
    this.validateContext(context, 'observeByClass');
    const observable = liveQuery(() => this.listByClass(context, classId));
    const subscription = observable.subscribe({ next: onChange, error: onError });
    return () => subscription.unsubscribe();
  }
}

export const classChatRepository = new ClassChatRepository();
