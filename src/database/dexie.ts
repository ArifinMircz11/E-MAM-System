import { db as canonicalDb, EMamDatabase } from '@/core/database/db';

export { canonicalDb as db, EMamDatabase };
export { DatabaseResolver } from '@/core/database/DatabaseResolver';

/** Canonical operational Dexie instance. */
export const localDb = canonicalDb;

/** Resolve a typed Dexie table from the canonical operational database. */
export const getTableByName = (name: string) => canonicalDb.table(name);
