# ADR 003: Strict Service and Repository Boundary

**Status:** Accepted
**Date:** 2026-07-10
**Decision Owner:** Architecture Team
**Related ADR:** None
**Supersedes:** None
**Affected Components:** Service Layer, Repository Layer

**Context:** Components previously directly accessed Dexie (`db.table()`) and Firestore (`getDocs`), leading to scattered logic.
**Decision:** Services contain all business logic. Repositories handle all Dexie operations. UI communicates only with Services or Stores.
**Consequences:** Clearer separation of concerns, easier testing, prevents database implementation leaks into UI.
