# P0-3 — SyncQueue / Application Transaction Outbox

## Contract

`sync_queue` is the durable application transaction outbox. It is not a UI cache and not a second database.

Every operational mutation must follow:

```text
Domain transaction
  -> Dexie entity write
  -> SyncQueue enqueue
```

The entity write and queue enqueue must be committed in the same Dexie transaction whenever the mutation is cloud-synchronizable.

## Ownership

- Repository: persists the local entity and atomically records the outbox item.
- SyncQueueRepository: reads and changes queue state.
- SyncEngine: processes queue items and performs cloud synchronization.
- FirestoreGateway: the only cloud adapter.
- UI/Store/Service: never access `sync_queue` directly.

## Queue lifecycle

```text
pending -> processing -> synced
                  \-> failed -> pending (retry)
```

A permanently rejected item is handled by the SyncEngine dead-letter policy.

## Required metadata

Each item carries:

- `tenantId`
- `collection`
- `operation`
- `recordId`
- `payload`
- `attempts`
- timestamps
- `version`
- `idempotencyKey`
- actor identity when available

The idempotency key is deterministic for a tenant/collection/record/version so retries cannot intentionally create a second logical mutation.

## Offline guarantee

If the network or SyncEngine is unavailable after the Dexie transaction commits, the operational transaction remains available locally and the queue item remains durable for later processing.

## Production gate

P0-3 is implemented at the repository contract level. Final PASS requires runtime tests proving:

1. entity + queue atomicity;
2. queue survives application restart;
3. failed processing can be requeued;
4. retry does not duplicate the logical mutation;
5. queue processing is tenant-isolated.
