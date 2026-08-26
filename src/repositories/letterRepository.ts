import { db } from '@/database/db';
import { LetterRequest } from '@/types';

export class LetterRepository {
  async getAll(tenantId: string = 'tenant-demo'): Promise<LetterRequest[]> {
    try {
      if (db.table('letters')) {
        return await db.table('letters').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(letter: LetterRequest): Promise<void> {
    try {
      if (db.table('letters')) {
        await db.table('letters').put(letter);
      }
    } catch {}
  }

  async update(id: string, updates: Partial<LetterRequest>): Promise<void> {
    try {
      if (db.table('letters')) {
        await db.table('letters').update(id, updates);
      }
    } catch {}
  }
}

export const letterRepository = new LetterRepository();
