import { db } from '@/database/db';
import { PointCategory } from '@/types';

export class PointCategoryRepository {
  async getAll(tenantId: string = 'tenant-demo'): Promise<PointCategory[]> {
    try {
      if (db.table('point_categories')) {
        return await db.table('point_categories').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(category: PointCategory): Promise<void> {
    try {
      if (db.table('point_categories')) {
        await db.table('point_categories').put(category);
      }
    } catch {}
  }
}

export const pointCategoryRepository = new PointCategoryRepository();
