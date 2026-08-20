# ADR 005: Version-Based Delta Synchronization

**Status:** Accepted
**Date:** 2026-07-10
**Decision Owner:** Architecture Team
**Related ADR:** ADR-002
**Supersedes:** None
**Affected Components:** SyncEngine, SyncQueue, Data Models

**Context:** Downloading entire collections causes massive data usage and Firestore read costs.
**Decision:** Implement version-based and timestamp-based Delta Sync. Full sync is only allowed on first install or manual recovery.
**Consequences:** Minimized payload, efficient sync, requires tracking `metadataVersion` and `updatedAt`.
