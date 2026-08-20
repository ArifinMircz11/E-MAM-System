# Sync Architecture Audit Report
## WO-001.3 — Sync Engine Hardening & Delta Synchronization
**Status**: AUDITED & DESIGNED  
**Lead Architect**: Enterprise Sync & Offline-First Architect  
**Project**: e-Mam System (Integrated Madrasah Academic Manager)

---

## 1. Executive Summary of Current Sync Mechanism

Our audit of the `/src/services/`, `/src/database/`, `/src/database/repositories/`, and `/src/core/sync/` directories revealed the following architecture details:

### 1.1 Existing Sync Components
1.  **Sync Engine (`/src/services/SyncEngine.ts`)**:
    *   **Workflow**: Periodically polls `localDb.sync_queue` for `pending` mutations.
    *   **Actions**: Maps Dexie objects using `mapperRegistry` -> validates with Zod DTO schemas -> performs `setDoc` (merge: true) or `deleteDoc` in Firestore.
    *   **Self-Healing**: Moves persistently failed mutations (>= 5 attempts) or validation errors to `dead_letter_queue`.
2.  **Cache Service (`/src/services/CacheService.ts`)**:
    *   **Delta Sync**: When retrieving collections, if fresh metadata is not found, attempts a Firestore query with `updatedAt > lastSyncDate - 10000` (safety buffer). Fallbacks to full sync if delta fails or cache is empty.
    *   **Key Normalization**: Dynamically handles primary key alignments between Dexie and Firestore (e.g., singular/plural mappings, system parameters, student/teacher attributes).
3.  **Master Sync Service (`/src/services/masterSyncService.ts`)**:
    *   **Versioning**: Compares a server-emitted master version against local `systemSettings`' `last_synced_master_version`.
    *   **Trigger**: On mismatch or force, triggers concurrent delta sync tasks for master data tables.

---

## 2. Identified Architectural Gaps & Debt

1.  **Missing Global Sync Cursor (`syncMetadata`)**:
    *   *Issue*: Delta sync offsets are currently checked per-collection via individual `collection_students_...` strings in the generic `cache` table. There is no unified, indexed `syncMetadata` table to tracks and query entity sync offsets across different tenants.
2.  **No Formal Conflict Resolver Module**:
    *   *Issue*: Simultaneous updates on offline and online clients fallback to last-writer-wins purely at the Firestore database layer. There is no local hook to compare vector clocks/versions or log conflict resolutions to the audit log.
3.  **Basic Sync Queue Status Tracing**:
    *   *Issue*: Queue items in `sync_queue` use basic states. We need to standardize and track the statuses: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, and `CONFLICT`.
4.  **Implicit Worker Orchestration**:
    *   *Issue*: Sync intervals are set within the generic `SyncEngine` class itself. Decoupling background workers, queue managers, and monitors into modular, dedicated files inside `src/sync/` will maximize stability and performance.

---

## 3. Design Blueprint for Hardened Sync Engine

We will build the hardened, enterprise-grade Sync Engine inside a new, modular directory `/src/sync/`:

```text
src/sync/
 ├── syncQueue.ts          # Advanced sync queue manager with standardized statuses
 ├── conflictResolver.ts   # Latest-UpdatedAt-Wins engine with audit log persistence
 ├── syncEngine.ts         # Unified controller managing pull (delta sync) and push (queue)
 ├── syncWorker.ts         # Reliable background scheduler with navigator.onLine hook
 └── syncMonitor.ts        # Reactive status monitor integrated with Dev Console UI
```

---
**Approved By**: Principal Enterprise Architect  
**Date**: July 1, 2026
