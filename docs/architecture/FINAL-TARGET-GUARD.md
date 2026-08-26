# e-MAM Final Target Guard

This document defines the mechanical architecture contract for the whole application.

## Final architecture

```text
UI
 ↓
Zustand Store
 ↓
Service / Use Case
 ↓
Repository
 ↓
Dexie (Operational SSOT)
 ↓
SyncQueue / Outbox
 ↓
SyncEngine
 ↓
Firestore
```

## Non-negotiable boundaries

### UI
- No Firestore SDK.
- No Firebase Auth SDK.
- No direct Dexie/database access.
- No SyncEngine orchestration.
- UI consumes state/actions exposed by stores/services.

### Zustand
- State orchestration only.
- Calls services/use cases.
- Never performs cloud CRUD.

### Service / Use Case
- Business rules and workflows.
- Calls repositories.
- No Firestore SDK.
- No direct Dexie access.

### Repository
- CRUD/data access abstraction.
- Operational reads/writes use Dexie.
- Writes create durable outbox/sync work where required.
- Does not own authentication.

### Dexie
- Local operational source of truth.
- Must remain usable with zero network.
- Transactions protect related writes.

### SyncQueue
- Durable outbox.
- FIFO ordering where causality requires it.
- Idempotency metadata.
- Retry/dead-letter handling.

### SyncEngine
- Sole orchestrator of cloud synchronization.
- Pull/push, reconnect, retry, conflict handling and delta/version sync.
- UI does not call Firestore directly.

### Firestore
- Cloud synchronization, backup/recovery, reporting/analytics.
- Never becomes a runtime dependency for core offline operations.

## Required verification

Run:

```text
npm run audit:firestore
npm run audit:architecture
npm run typecheck
npm run lint
npm run build
npm run test:unit
```

A release candidate is not considered architecture-compliant until the boundary guards pass and the offline critical paths are tested.
