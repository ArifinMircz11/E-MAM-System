# P0-2 — Dexie Operational Boundary

## Status

IMPLEMENTED — validation pending.

## Contract

Dexie is the e-MAM operational database. Application transactions must be completed locally before cloud synchronization is attempted.

```text
UI
 ↓
Zustand Store
 ↓
Service / Use Case
 ↓
Repository
 ↓
Dexie
 ↓
SyncQueue / Outbox
 ↓
SyncEngine
 ↓
FirestoreGateway
 ↓
Firestore
```

## Rules

1. UI/components must not import Dexie or `database/dexie` directly.
2. Hooks must not import Dexie directly.
3. Zustand stores must not import Dexie directly.
4. Services/Use Cases must not import Dexie directly.
5. Operational repositories are the persistence boundary for Dexie.
6. Repository mutations persist the operational entity and its SyncQueue outbox item in the same Dexie transaction.
7. Firestore is not required to complete an operational transaction.
8. `SyncEngine` may process the outbox asynchronously; it must never become the operational persistence layer.
9. Authentication credentials are excluded from the operational outbox.

## Enforcement

`.dependency-cruiser.js` contains production-severity rules for UI, hooks, stores, and services that attempt to bypass the Repository → Dexie boundary.

## Acceptance criteria

- [x] BaseRepository persists entity + SyncQueue atomically.
- [x] Tenant context is validated before repository mutation.
- [x] Mutation versions and idempotency keys are generated locally.
- [x] UI/components are forbidden from importing Dexie.
- [x] Hooks are forbidden from importing Dexie.
- [x] Stores are forbidden from importing Dexie.
- [x] Services are forbidden from importing Dexie.
- [ ] Full dependency-cruiser/typecheck/test suite passes on CI.
- [ ] Remaining direct Dexie imports outside repository/infrastructure are reviewed and migrated where necessary.

## Production gate

P0-2 is **PASS** only after the automated architecture audit, typecheck, unit tests, and the remaining direct-import review pass on the branch.
