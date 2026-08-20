# ADR 001: Dexie as Primary Operational Database

**Status:** Accepted
**Date:** 2026-07-10
**Decision Owner:** Architecture Team
**Related ADR:** ADR-002
**Supersedes:** None
**Affected Components:** UI Layer, Service Layer, Repository Layer

**Context:** The application needs to support Offline-First mode fully. Cloud databases like Firestore are inaccessible during offline mode.
**Decision:** All UI and services will read and write strictly to Dexie (IndexedDB) via Repository layer.
**Consequences:** Improved offline capability, reduced Firestore reads, requires robust Sync Engine to sync Dexie data back to Firestore.
