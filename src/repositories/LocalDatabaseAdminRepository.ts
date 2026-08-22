import { localDb } from '@/database/dexie';

/** Administrative repository for destructive local-database maintenance. */
export class LocalDatabaseAdminRepository {
  async reset(): Promise<void> {
    await localDb.delete();
    await localDb.open();
  }
}

export const localDatabaseAdminRepository = new LocalDatabaseAdminRepository();
