# FIRESTORE_BOUNDARY

## Canonical boundary — e-MAM Offline-First

```text
LOGIN
Firebase Auth
  -> AuthService / AuthGateway
  -> Canonical User / Identity Context
  -> local session state

OPERATIONAL
UI
  -> Zustand Store
  -> Service / Use Case
  -> Repository
  -> Dexie
  -> SyncQueue / Outbox

SYNC
SyncQueue
  -> SyncEngine
  -> FirestoreGateway
  -> Firestore
```

### Locked rules

| Rule | Status | Notes |
|---|---|---|
| Login != Firestore CRUD | LOCKED | Auth establishes identity/session; operational CRUD is a separate pipeline. |
| Firebase Auth != operational database | LOCKED | Authentication identity only. |
| Dexie = operational database | VERIFIED | Operational repositories persist locally first. |
| SyncQueue = durable application outbox | VERIFIED | `BaseRepository` writes entity + queue item in the same Dexie transaction. |
| SyncEngine = synchronization orchestrator | VERIFIED | Queue processing, retry, conflict/version handling and delta pull are centralized. |
| FirestoreGateway = cloud adapter | VERIFIED | SyncEngine uses `src/services/gateways/FirestoreGateway.ts`. |
| Firestore = cloud synchronization layer | LOCKED | Cloud is not the operational source for offline transactions. |

## Current verification

| Area | Current evidence | Status |
|---|---|---|
| Student operational service | `src/services/studentService.ts` uses `studentRepository` for reads/mutations; no direct Firestore CRUD in the operational flow | PASS |
| BaseRepository | Uses Dexie and persists the entity + `sync_queue` item atomically | PASS |
| SyncEngine canonical path | `src/sync/SyncEngine.ts` is a compatibility re-export of `src/services/SyncEngine.ts` | PASS |
| SyncEngine cloud boundary | `src/services/SyncEngine.ts` accesses cloud through `FirestoreGateway` | PASS |
| Auth canonical identity bootstrap | `FirebaseUserSyncService` resolves canonical user through SyncEngine and caches it locally | PASS WITH BOUNDARY NOTE |
| AuthRepository | Local-only Dexie repository for authentication bootstrap/credentials; intentionally bypasses SyncQueue for password hashes | EXCEPTION / REVIEWED |

## Important boundary note

`src/sync/SyncEngine.ts` is **not a second SyncEngine implementation**. It re-exports the canonical implementation from `src/services/SyncEngine.ts`. The canonical implementation is therefore currently `src/services/SyncEngine.ts`.

Canonical identity bootstrap is intentionally allowed to use the SyncEngine cloud corridor because canonical user resolution is a synchronization/bootstrap concern, not operational CRUD. After bootstrap, the canonical user is cached locally and operational reads use Dexie repositories.

`AuthRepository` is a documented architectural exception: local authentication credential material must never enter the operational SyncQueue or Firestore synchronization pipeline.

## Remaining audit work

1. Audit every `src/services/**` operational service for direct Firestore imports/calls.
2. Audit every repository for cloud access outside the SyncEngine/FirestoreGateway corridor.
3. Verify QR/attendance transaction atomicity: Dexie entity + SyncQueue in one transaction.
4. Verify reconnect/retry/dead-letter behavior with offline integration tests.
5. Run the full repository verification suite before declaring the boundary globally PASS.

**Audit baseline:** 2026-08-25, commit `2a971e932d297b39f24643919f140027c4f8c724`.
