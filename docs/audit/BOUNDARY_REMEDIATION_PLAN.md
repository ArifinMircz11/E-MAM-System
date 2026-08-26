# Firestore Boundary Remediation Plan

- P0 target: direct Firestore access from UI/presentation code = 0.
- Operational reads: Service → Repository → Dexie.
- Operational writes: Service → Repository → Dexie transaction → SyncQueue → SyncEngine → Firestore.
- Migration/admin tooling may use dedicated infrastructure APIs, but must not be exposed as ordinary UI data access.
- Completion requires a fresh boundary audit and offline E2E verification.
