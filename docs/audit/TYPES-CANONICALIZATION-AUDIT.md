# e-MAM System — `src/types` Canonicalization Audit

Date: 2026-08-21

## Scope

Audit of the `src/types` contracts with focus on CanonicalUser, BaseEntity, SyncQueueItem, UserSchema, and legacy/compatibility boundaries.

## Confirmed findings

- `CanonicalUser` is the intended single source of truth for user identity.
- `src/types/index.ts` already aliases `User` and `UserData` to `CanonicalUser`.
- `src/domain/entities/base.ts` provides the richer `AppEntity` base used by `src/types/index.ts`.
- `src/types/base.ts` is a duplicate base contract and must not become a second canonical source.
- `UserEntity` is a separate user model and should be treated as legacy/compatibility until all consumers are migrated.
- `UserSchema` is a parallel Zod user contract and must eventually validate the canonical user contract rather than define a competing identity model.
- `SyncQueueItem` contains both canonical and legacy naming (`operation`/`attempts`/`lastError` and `action`/`retryCount`/`error`). This is a sync-boundary risk.
- `OfflineStagedItem` overlaps the sync/outbox responsibility and should be isolated from the Firestore document contract.

## Safe remediation policy

No destructive deletion is performed during this phase. Legacy contracts remain available until consumers are proven migrated.

### Canonical direction

```text
CanonicalUser
    ↓
Canonical user validation

AppEntity (domain/entities/base)
    ↓
Domain entities

Canonical SyncQueue contract
    ↓
Dexie SyncQueue / Outbox
    ↓
SyncEngine
    ↓
Firestore
```

## P1 blockers

1. User schema must not diverge from CanonicalUser.
2. BaseEntity must have one canonical operational contract.
3. SyncQueue must have one canonical mutation/retry vocabulary.
4. UserEntity must not become an alternative identity source.

## Next validation

Run repository-wide consumer tracing and typecheck/build before removing or renaming legacy contracts. If a consumer still depends on a legacy field, migrate the consumer first and keep the legacy contract as a compatibility boundary.
