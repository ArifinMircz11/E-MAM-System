# FIRESTORE_BOUNDARY_MIGRATION_PLAN

## Executive Summary
This document outlines the current violations of the Firestore boundary rules. A massive coupling exists between business services and Firestore SDK, violating the mandatory layered architecture (UI -> Hook -> Service -> Repository -> Dexie -> Sync Engine -> Firestore).

**Crucial Violation:** The majority of `src/services` have direct dependencies on `firebase/firestore`.

## Classification Matrix

| Category | Description | Target |
| -------- | ----------- | ------ |
| Data Synchronization | CRUD operations, persistence | Repository + Sync Engine |
| Realtime Event | Listeners, notifications | RealtimeHub / EventBus |

## Violation Breakdown (P0-P3)

| File | Severity | Category | Recommendation |
| ---- | -------- | -------- | -------------- |
| `src/services/realtime/*` | P0 | Realtime | Migrate to RealtimeHub |
| `src/services/authService.ts`| P0 | Sync | Move to AuthGateway / Sync Engine |
| `src/services/koperasiService.ts`| P1 | Sync | Move to KoperasiRepository |
| `src/services/dbGateway.ts` | P0 | Infrastructure| Refactor to be the ONLY allowed Firestore gateway |

## Migration Roadmap

1.  **Phase 1 (P0):** Fix `src/services/realtime/*` (Listeners).
2.  **Phase 2 (P0):** Consolidate `src/services/dbGateway.ts` to be the sole entry point for Firestore.
3.  **Phase 3 (P1):** Migrate domain services (e.g., `koperasiService.ts`) to use Repositories.
4.  **Phase 4 (P2):** Clean up `src/services/sync/*` and `src/sync/*` duplicity.
