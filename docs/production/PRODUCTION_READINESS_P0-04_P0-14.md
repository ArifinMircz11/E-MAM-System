# e-MAM Production Readiness — P0-04 to P0-14

## Canonical target

```text
Login / Identity
    -> Operational Services
    -> Repository
    -> Dexie (operational DB)
    -> SyncQueue / Outbox
    -> Canonical SyncEngine
    -> FirestoreGateway
    -> Firestore
```

The application must remain operational when internet connectivity or the SyncEngine is unavailable. Sync is asynchronous and must never become a prerequisite for local operational transactions.

## P0-04 — Canonical SyncEngine

- Exactly one canonical SyncEngine implementation/entry point.
- Reads durable SyncQueue/Outbox records from Dexie.
- Owns scheduling, online/offline transitions, retry/backoff, acknowledgement, recovery and sync state.
- Does not become the operational database.
- Does not allow UI/store/service code to call Firestore directly.
- Must be safe to restart without duplicating acknowledged transactions.

Acceptance: one canonical runtime path is proven by source audit and tests.

## P0-05 — FirestoreGateway Boundary

- Firestore SDK access is isolated behind the cloud gateway/data-source boundary.
- Operational repositories never import Firestore SDK primitives.
- UI, Zustand stores, hooks and business services never perform Firestore CRUD.
- SyncEngine is the only operational caller of the gateway.
- Firebase Auth remains an identity provider and is not treated as the operational database.

Acceptance: cloud-boundary audit reports zero unauthorized operational Firestore imports/calls, excluding explicitly documented infrastructure exceptions.

## P0-06 — Offline QR

- QR decoding and student lookup use local operational data.
- QR attendance does not require a network round trip.
- Successful scans create a local transaction before cloud synchronization.
- Duplicate scan protection works offline.
- Queue records are durable across application restart.

Acceptance: QR scan → local attendance succeeds with network disabled.

## P0-07 — Offline Attendance

- Attendance business rules execute locally.
- Attendance mutation is committed to Dexie first.
- Queue enqueue is part of the same transaction boundary.
- UI receives the local result without waiting for Firestore.
- Offline-created attendance synchronizes after reconnect.

Acceptance: create/update attendance offline, restart app, reconnect, and verify exactly-once logical result.

## P0-08 — Reconnect + Delta Sync

- Connectivity transition triggers sync without requiring a page reload.
- Pending outbox items are processed after reconnect.
- Pull synchronization uses version/cursor based delta sync rather than full collection replacement.
- Sync metadata/checkpoints are durable.
- Repeated reconnect cycles are idempotent.

Acceptance: offline mutations survive reconnect and delta pull without loss or duplication.

## P0-09 — Conflict + Idempotency

- Every cloud mutation has a stable idempotency key.
- Version/OCC metadata is validated before accepting updates.
- Duplicate delivery is safe.
- Conflicts are classified and resolved deterministically.
- Irrecoverable records enter dead-letter handling with diagnostic metadata.

Acceptance: replay the same queue item and force a stale-version conflict; no duplicate logical transaction is created.

## P0-10 — Security / RBAC / Tenant

- `uid` is bound to canonical identity.
- `tenantId` is mandatory for tenant-scoped operational data.
- Client routing is not the security boundary; authorization is enforced at trusted/cloud boundaries.
- Role and approval status are validated before privileged operations.
- Cross-tenant reads/writes are rejected.
- Secrets and credentials are never placed in the operational outbox.

Acceptance: automated and rule-level tests reject unauthorized role and cross-tenant access.

## P0-11 — Full Automated Audit

Required checks:

```bash
npm run typecheck
npm run test:unit
npm run audit:sync
npm run audit:dexie
npm run audit:repository
npm run audit:architecture
npm run audit
npm run verify
npm run build
```

Acceptance: all required checks pass on the production candidate.

## P0-12 — Production E2E

Minimum scenarios:

1. Login → identity bootstrap.
2. Load local operational data.
3. QR scan offline.
4. Attendance offline.
5. Multiple queued transactions.
6. Browser/application restart while queue is pending.
7. Reconnect and automatic synchronization.
8. Delta pull.
9. Duplicate/replay protection.
10. Conflict handling.
11. Logout/session cleanup.

Acceptance: E2E suite passes with both online and fully offline phases.

## P0-13 — Deployment

- Production Firebase configuration is explicit and fail-closed.
- Production environment variables are configured outside source control.
- Firestore rules and indexes are deployed and verified.
- Build artifact is reproducible.
- Production smoke test exists.
- Rollback procedure is documented.
- No development credentials or emulator endpoints are active in production.

Acceptance: clean production deployment passes smoke and offline-first verification.

## P0-14 — Backup / Recovery

- Firestore backup/recovery procedure is documented.
- Restore procedure is tested against a non-production target before release.
- Sync metadata and version contracts are preserved during recovery.
- Recovery does not silently overwrite newer local transactions.
- Operational data can be rehydrated into Dexie safely.

Acceptance: execute a recovery drill and verify data integrity, tenant isolation and sync continuity.

## Production gate

P0-04 through P0-14 are **NOT production PASS** merely because source files exist. Each item requires implementation plus evidence from automated tests, source audits, or a controlled operational drill.

Production status is `READY` only when all P0 gates are green.
