# P2 Type-Layer Audit — 2026-08-22

## Scope
Post-P1 cleanup audit of `src/types` after canonical SyncQueue, BaseEntity, and CanonicalUser work.

## Results

### P2-1 OfflineStagedItem — mitigated
`OfflineStagedItem` remains available only as a deprecated compatibility contract in `src/types/firestore.ts`. New code must use `SyncQueueItem` from `src/types/syncQueue.ts`.

### P2-2 Firestore boundary — clarified
`firestore.ts` now contains Firestore document metadata plus a clearly deprecated legacy staging contract. The type is not treated as the Firestore source-of-truth model.

### P2-3 roles/permissions — deferred
Role and permission contracts are foundational RBAC policy and should not be split casually. No runtime refactor is performed without consumer tracing.

### P2-4 types/index.ts — deferred cleanup
The barrel still exports several domain-facing types. Removing definitions from it is a larger migration and is not required to preserve the offline-first architecture. Keep it stable until consumer tracing is complete.

## Architecture decision
The canonical offline write path remains:

UI → Zustand → Service/Use Case → Repository → Dexie → SyncQueue → SyncEngine → Firestore

No UI-to-Firestore/Dexie direct access is introduced by this cleanup.

## Status
P2 offline staging boundary: MITIGATED.
RBAC/type barrel cleanup: DEFERRED pending consumer migration and verification.

## Verification gate
Typecheck, build, lint, and Architecture Doctor must be executed in the project runtime before release closure.
