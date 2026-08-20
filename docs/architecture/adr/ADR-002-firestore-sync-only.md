# ADR 002: Firestore for Synchronization Only

**Status:** Accepted
**Date:** 2026-07-10
**Decision Owner:** Architecture Team
**Related ADR:** ADR-001
**Supersedes:** None
**Affected Components:** SyncEngine, Services, Repositories

**Context:** Directly calling Firestore causes UI blocking when offline and increases cloud costs due to redundant reads.
**Decision:** Firestore is strictly accessed through SyncEngine and SyncRepository for background synchronization.
**Consequences:** Lower Firestore costs, eliminates direct cloud dependency from UI/Service layer, introduces eventual consistency.
