# DEPENDENCY_MATRIX

| Source | Target | Allowed | Status |
|---|---|---|---|
| UI | Service | ✅ | PASS |
| UI | Repository | ❌ | FAIL |
| UI | Firestore | ❌ | FAIL |
| UI | Dexie | ❌ | FAIL |
| Store | Service | ✅ | PASS |
| Store | Firestore | ❌ | FAIL |
| Store | Dexie | ❌ | FAIL |
| Service | Repository | ✅ | PASS |
| Service | Firestore | ❌ | FAIL |
| Service | Dexie | ❌ | FAIL |
| Repository | Dexie | ✅ | PASS |
| Repository | Firestore | ❌ | FAIL (Except SyncRepository) |
| SyncEngine | Firestore | ✅ | PASS |
