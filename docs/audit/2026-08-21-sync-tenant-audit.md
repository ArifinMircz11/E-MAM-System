# e-MAM Sync Tenant Boundary Audit — 2026-08-21

## Findings

1. `SyncRepository.enqueue()` accepted `item.tenantId` before SecurityContext authority was applied.
2. `SyncEngine.processQueue()` selected pending/waiting/failed items without tenant scoping.
3. A tenant mismatch was thrown before the queue item was quarantined, allowing repeated retries of invalid legacy items.
4. The architecture guard correctly fails closed; it must not be weakened to accept `global` for a normal tenant.

## Target

- SecurityContext is authoritative for tenant-scoped queue writes.
- Queue processing is scoped to the active tenant.
- Tenant mismatch is quarantined to the dead-letter queue and is never retried.
- Existing global/developer semantics remain explicit and fail-closed.
