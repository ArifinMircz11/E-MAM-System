/**
 * e-MAM System Enterprise Database Schema (Dexie / IndexedDB)
 * Offline-First & Local-First Architecture Standard
 * Canonical database re-export to prevent duplicate Dexie instances.
 */
export { localDb, db, EMamDatabase, DatabaseResolver, getTableByName } from '@/database/dexie';
export { localDb as default };

