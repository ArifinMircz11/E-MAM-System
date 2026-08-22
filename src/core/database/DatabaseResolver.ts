import { db, type EMamDatabase } from './db';

/**
 * Canonical database resolver.
 *
 * Production code resolves the single operational Dexie database instance.
 * Tests may inject an isolated EMamDatabase instance without changing
 * repository/service contracts or creating a second global database.
 */
export class DatabaseResolver {
  private static overrideDatabase: EMamDatabase | null = null;

  static getDatabase(): EMamDatabase {
    return this.overrideDatabase ?? db;
  }

  static setDatabase(database: EMamDatabase): void {
    this.overrideDatabase = database;
  }

  static reset(): void {
    this.overrideDatabase = null;
  }
}
