/**
 * @deprecated
 *
 * Canonical entity contracts live in `@/domain/entities/base`.
 * Import `BaseEntity`, `AppEntity`, and `SyncStatus` from the domain layer.
 *
 * This compatibility surface is intentionally retained until repository-wide
 * consumer tracing confirms that no runtime module imports this legacy path.
 */
export type {
  BaseEntity,
  AppEntity,
  SyncMetadata,
  TenantMetadata,
  AuditMetadata,
  CrudService,
} from '@/domain/entities/base';

export { SyncStatus } from '@/domain/entities/base';
export { isAppEntity } from '@/domain/entities/base';
