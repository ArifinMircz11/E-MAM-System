Service:
src/services/attendanceSyncService.ts

Responsibilities
- Process offline-synced attendance records to server (Firestore).
- Perform atomic transactions (update attendance, deduct points, calculate daily stats).
- Send WhatsApp notifications using API.

Current Dependency
offlineAutoProcessService (SyncEngine precursor)
 ↓
Service (attendanceSyncService)
 ↓
Firestore (runTransaction, doc, setDoc, getDoc, updateDoc)

Target Dependency
SyncWorker (src/sync/)
 ↓
attendanceSyncService (moved to src/sync/)
 ↓
Firestore

Firestore Usage
☑ getDoc
☑ setDoc
☑ updateDoc
□ addDoc
□ deleteDoc
□ onSnapshot
☑ runTransaction
□ writeBatch

Dexie Equivalent
- N/A. This is the SyncEngine layer writing to Firestore (Source of Truth). It consumes from `localDb.sync_queue`.

Sync Strategy
- Queued execution. Takes data from `sync_queue` and commits to Firestore via transaction.

Risk
- High. Core mechanism that ensures offline scans are safely stored in the cloud. Should be properly integrated into `src/sync` and verified.
