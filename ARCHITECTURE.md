# ARCHITECTURE.md — e-MAM System Enterprise Architecture

## 1. Overview & Mission
e-MAM (Enterprise Madrasah Management System) is built on an **Offline-First**, **Local-First (Dexie / IndexedDB)**, **Multi-Tenant**, and **Secure-by-Default** enterprise architecture. Firestore serves as the Delta Synchronization and Cloud Backup Source of Truth.

---

## 2. Directory Structure

```
src/
  app/              # Application bootstrap, providers, router, global config
  features/         # Domain-driven feature modules (auth, students, teachers, attendance, classes, reports, settings, admin)
  core/             # Technical capabilities (auth, authorization, tenant, firebase, offline, realtime, monitoring)
  shared/           # Shared UI components, hooks, utils, types, constants
  stores/           # Global Zustand / reactive stores (authStore, tenantStore, uiStore, etc.)
  server/           # Express server, middleware, routes, services, Firebase Admin
  tests/            # Unit and integration tests
```

---

## 3. Dependency Direction & Layer Responsibilities

```
UI Components (features/*/components)
        │
        ▼
Feature Hooks (features/*/hooks)
        │
        ▼
Feature Services (features/*/services)
        │
        ▼
Repositories (features/*/repositories or core/*)
        │
        ▼
IndexedDB / Dexie (Operational Database)
        │
        ▼
Sync Engine (Delta Synchronization)
        │
        ▼
Firestore (Cloud Source of Truth)
```

### Strict Rules:
1. **UI Components** are pure presentation; no direct database queries or Firebase SDK imports.
2. **Repositories** only interact with Dexie and never import React or Firebase client SDKs.
3. **Sync Engine** is the **ONLY** component allowed to read/write directly to Firestore.
4. **Firebase Admin SDK** is strictly restricted to `src/server/` and backend middleware.

---

## 4. Authorization & Tenant Isolation
- **Authentication:** Verified via Firebase ID Tokens (`verifyFirebaseIdToken`) and session management.
- **Authorization (RBAC):** Centralized in `core/authorization/` using Firebase Custom Claims or backend Security Context. No hardcoded UI role checks.
- **Tenant Isolation:** Every operational query and data mutation requires a validated `tenantId` from `TenantContext`. Cross-tenant queries are strictly prohibited.

---

## 5. Data Access & Offline-First Principles
- Operational reads and writes happen locally in Dexie.
- Sync Queue handles asynchronous delta synchronization to Firestore when online.
- Master data uses version checking and Delta Sync rather than full collection scans.
