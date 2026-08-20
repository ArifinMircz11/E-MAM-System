Service:
src/services/qrService.ts

Responsibilities
- Sync batch queue payloads directly to Firestore using writeBatch.

Current Dependency
offlineAutoProcessService
 ↓
Service (qrService)
 ↓
Firestore (writeBatch, doc)

Target Dependency
SyncEngine (src/sync/)
 ↓
Firestore

Firestore Usage
□ getDoc
□ setDoc
□ updateDoc
□ addDoc
□ deleteDoc
□ onSnapshot
□ runTransaction
☑ writeBatch

Dexie Equivalent
- N/A. This is part of the syncing layer writing to Firestore. It reads from `localDb.sync_queue`.

Sync Strategy
- Generic batched background sync execution (for everything outside of atomic attendance transactions).

Risk
- Low. This logic just needs to be relocated to `src/sync/` to comply with the architectural boundary rule (where `src/services/` does not directly use Firestore).
