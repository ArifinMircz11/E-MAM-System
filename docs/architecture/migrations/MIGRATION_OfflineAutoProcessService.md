# Migration: offlineAutoProcessService.ts

## Current Responsibilities
* Polling queue
* Retry mechanism (Exponential backoff / static retries)
* Uploading data to cloud
* Handling specific domains like attendance, qr batches, etc.
* Error logging & moving to dead letter queue
* Fallback mechanisms

## Dependencies
* Dexie (`localDb`)
* Firebase Firestore (direct imports)
* SecurityContext / Auth
* Network detector (online status checks)

## Boundary Violations
* Direct `firebase/firestore` imports inside a `src/services/` file.
* Hardcoded business logic for attendance and other entities mixed with queue processing logic.

## Target Responsibilities
```
SyncEngine
    ↓
SyncWorker
    ↓
SyncDispatcher
    ↓
AttendanceHandler / QrHandler / ...
    ↓
FirestoreAdapter
```

## Migration Checklist
- [ ] Create `FirestoreAdapter` (`src/sync/adapters/firestore.adapter.ts`) to isolate all Firebase SDK calls.
- [ ] Create `SyncDispatcher` (`src/sync/SyncDispatcher.ts`) to route queue items to specific handlers based on action/collection.
- [ ] Create Domain Handlers (`src/sync/handlers/attendance.handler.ts`, etc.).
- [ ] Create `SyncWorker` (`src/sync/SyncWorker.ts`) to process the queue, handle retries, and call the dispatcher.
- [ ] Remove `src/services/offlineAutoProcessService.ts` (or make it a thin wrapper if needed temporarily).
- [ ] Ensure all operations are idempotent.
