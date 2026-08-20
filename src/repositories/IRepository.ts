import type { SecurityContext } from '@/core/context/TenantContext';
import type { AppEntity } from '@/domain/entities/base';

/**
 * Standard Repository Contract for e-MAM System
 * All repositories must implement this to ensure consistent data access.
 */
export interface IRepository<T extends AppEntity> {
  /**
   * Retrieves an entity by its primary ID.
   * Must verify tenant ownership if the entity is tenant-scoped.
   */
  getById(context: SecurityContext, id: string): Promise<T | null>;

  /**
   * Retrieves all entities for the current tenant.
   */
  getAll(context: SecurityContext): Promise<T[]>;

  /**
   * Persists an entity (Create or Update).
   * Automatically sets timestamps and tenantId from context if missing.
   */
  save(context: SecurityContext, entity: Partial<T>): Promise<T>;

  /**
   * Creates a new entity.
   */
  create(context: SecurityContext, entity: Partial<T>): Promise<T>;

  /**
   * Soft-deletes an entity.
   */
  delete(context: SecurityContext, id: string): Promise<void>;

  /**
   * Batch save multiple entities.
   */
  saveBatch(context: SecurityContext, entities: Partial<T>[]): Promise<T[]>;
}

/**
 * Paged result structure for list queries
 */
export interface PagedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
