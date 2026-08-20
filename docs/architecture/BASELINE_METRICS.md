# BASELINE_METRICS

This document holds the exact numeric baseline metrics gathered during Phase 1C of the Architecture Audit.
All refactoring efforts will be measured against these numbers to track progress.

| Metric | Baseline | Target | Status |
|---|---|---|---|
| Legacy imports (`src/repositories/`) | 0 | 0 | ✅ |
| Firestore CRUD outside Sync | 639 | 0 | 🔴 |
| db.table() outside repositories | 4 | 0 | 🔴 |
| Role checks in UI (`UserRole.*`) | 893 | 0 | 🔴 |
| SyncQueue enqueues | 73 | >73 | ⚪ |
| db.transaction() | 15 | >15 | ⚪ |

*Note: SyncQueue enqueues and `db.transaction()` are expected to INCREASE as we move away from direct Firestore calls towards robust local operations.*
