/**
 * Core Entity Contracts for e-MAM System
 * Version: 2.0
 */

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  ERROR = 'error',
  LOCAL_ONLY = 'local_only',
}

/**
 * Basic metadata present in all entities
 */
export interface BaseEntity {
  id: string;
  idUnik?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Standard metadata for synchronization and soft-deletion
 */
export interface SyncMetadata {
  syncStatus: SyncStatus;
  version: number;
  schemaVersion?: number;
  deleted: boolean;
  deletedAt?: number;
  lastModifiedDevice?: string;
  checksum?: string;
}

/**
 * Metadata for multi-tenant isolation
 */
export interface TenantMetadata {
  tenantId: string;
  npsn?: string; // Tenant code mapping
}

/**
 * Metadata for auditing
 */
export interface AuditMetadata {
  createdBy?: string;
  updatedBy?: string;
}

/**
 * The standard operational entity contract
 * Used for all tenant-scoped data like Students, Attendance, etc.
 */
export interface AppEntity extends BaseEntity, SyncMetadata, TenantMetadata, AuditMetadata {
  // Universal CRUD Data Model
}

/**
 * Universal Service Interface for CRUD operations
 */
export interface CrudService<T extends AppEntity> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  bulkImport(data: Partial<T>[]): Promise<{ successCount: number; errors: string[] }>;
  export(type: 'excel' | 'pdf' | 'csv'): Promise<Blob | string>;
}

/**
 * Helper to ensure an object is a valid AppEntity
 */
export function isAppEntity(obj: any): obj is AppEntity {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.tenantId === 'string' &&
    typeof obj.createdAt === 'number' &&
    typeof obj.updatedAt === 'number' &&
    typeof obj.deleted === 'boolean'
  );
}
