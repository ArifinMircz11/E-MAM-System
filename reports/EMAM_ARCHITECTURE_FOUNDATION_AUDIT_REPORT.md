# EMAM ARCHITECTURE FOUNDATION AUDIT REPORT
**Work Order:** EMAM-ARCHITECTURE-FOUNDATION-AUDIT-001  
**System:** e-MAM System (Enterprise Information System)  
**Audit Date:** July 2026  
**Status:** Read-Only Audit Completed (No Code Changes, No Refactoring)  

---

## 1. Executive Summary

The e-MAM System is designed as an Enterprise-Grade, Offline-First, Local-First multi-tenant educational management platform. Following the Enterprise Architecture Operating Model (EAOM), the system mandates strict separation of concerns across 5 core layers: **UI Layer -> Hooks Layer -> Service Layer -> Repository Layer -> Dexie (Operational DB) -> Sync Engine -> Firestore (Remote Persistence)**.

This read-only audit was conducted to evaluate architectural compliance, identify boundary leakage, audit Firestore read/write patterns, examine RBAC security contexts, and assess offline-first readiness. 

Key findings indicate that while the core structural layout (BaseRepository, Dexie operational tables, and Sync Engine patterns) is established, historical transition artifacts (such as fallback collection scans, dual tenant key structures `tenantId` vs `sistemJangkar.tenantId`, and legacy direct queries in utilities/services) present significant Firestore quota and architectural risks.

---

## 2. Architecture Diagram Aktual (Current State)

```
       UI Components / Pages / Features
                     │
         (Some direct queries / hooks)
                     │
                     ▼
                 Services
          (Business logic + RBAC)
                     │
                     ▼
            Repositories (Dexie)
    (BaseRepository + Dexie Local Access)
                     │
         ┌───────────┴───────────┐
         │                       │
     Dexie (Local)         Firestore (Remote)
  (Operational DB)     (Sync Engine / Fallbacks)
```

---

## 3. Architecture Diagram Target (EAOM Standard)

```
                 UI Components
                       │
                       ▼
                 Hooks Layer
                       │
                       ▼
                 Service Layer
                       │
                       ▼
               Repository Layer
                       │
          ┌────────────┴────────────┐
          │                         │
     Dexie (Dexie)             Sync Engine
  Operational Database    (Only Firestore Gateway)
                            │
                            ▼
                    Firestore Database
                     Source of Truth
```

---

## 4. Layer Compliance Matrix

| Layer | Compliance Score | Status | Key Observations |
| :--- | :---: | :---: | :--- |
| **Identity Kernel** | 8.5 / 10 | **Good** | SecurityContext is widely used across services and repositories. |
| **RBAC** | 8.0 / 10 | **Good** | Role resolvers handle developer and tenant scopes, though occasional fallback checks exist. |
| **Repository** | 7.5 / 10 | **Warning** | BaseRepository successfully centralizes Dexie CRUD, but some legacy services query Firestore directly. |
| **Offline First** | 7.0 / 10 | **Warning** | Dexie is operational, but cache misses and fallbacks historically triggered remote Firestore scans. |
| **Sync Engine** | 7.5 / 10 | **Good** | SyncEngine manages delta and bootstrap syncs, but full sync triggers need tighter governance. |
| **Tenant Isolation** | 6.5 / 10 | **Critical** | Dual tenant keys (`tenantId` and `sistemJangkar.tenantId`) cause query ambiguity. |
| **Firestore Cost Control** | 6.0 / 10 | **Critical** | Fallback collection scans and full sync loops previously caused `resource-exhausted` quotas. |

---

## 5. Dependency Leakage Report

| Component / File | Leaked Dependency | Nature of Leak | Severity |
| :--- | :--- | :--- | :--- |
| `src/services/CacheService.ts` | `firebase/firestore` (`getDocs`, `query`, `where`) | Direct fallback collection scans outside Sync Engine | **CRITICAL** |
| `src/services/schemaRepairService.ts` | `firebase/firestore` | Administrative collection repairs querying remote Firestore directly | **HIGH** |
| `src/pages/developer/UserManagement.tsx` | `firebase/firestore` | Direct UI/Page-level Firestore query execution | **CRITICAL** |
| `src/domain/identityEngine.ts` | `firebase/firestore` | Domain utility executing direct Firestore queries | **HIGH** |

---

## 6. Firestore Risk Report

1. **Collection Scan Fallbacks (`CacheService.ts`)**: When flat tenant queries returned empty, queries historically fell back to `limit(200)` collection scans with client-side filtering, consuming massive read quotas.
2. **Dual Tenant Key Space**: Coexistence of flat `tenantId` and nested `sistemJangkar.tenantId` forces multi-query fallbacks in `CacheService.ts` and domain repositories.
3. **Unbounded Full Syncs**: Navigation or cache invalidation events occasionally triggered unthrottled sync operations across collections.

---

## 7. RBAC Integrity Report

* **Context Source**: Managed via `SecurityContext` and `SecurityContextProvider`.
* **Developer Override**: Developers (`role === 'developer'`, `scope.level === 'global'`) have system-wide privileges, but must be strictly isolated from standard tenant data corruption.
* **Permission Enforcement**: Enforced at the Service layer via permission checkers. Repositories rely on `SecurityContext` passed from services.

---

## 8. Offline First Readiness

* **Dexie Database**: Configured as the local operational store across primary entities (students, teachers, classes, attendance, points, etc.).
* **Sync Queue**: Implemented to queue offline mutations for background synchronization.
* **Vulnerability**: Fallback mechanisms that reach out to remote Firestore on cache misses undermine pure offline operation.

---

## 9. Sync Engine Maturity

* **Current Implementation**: Manages delta syncs and master collections (`SyncEngine.ts`, `SyncWorker.ts`).
* **Area for Improvement**: Needs stricter circuit-breaking during `resource-exhausted` (quota exceeded) states to prevent infinite retry loops.

---

## 10. Critical Findings

1. **Direct Firestore Access Outside Sync Engine**: Several utility and cache services invoke `getDocs` and `query` directly.
2. **Tenant Key Fragmentation**: Dual tenant indexing (`tenantId` vs `sistemJangkar.tenantId`) leads to redundant fallback queries.
3. **Collection Scan Fallbacks**: Client-side filtering after collection scans violates Firestore cost efficiency principles.

---

## 11. Technical Debt List

* **TD-01**: Dual tenant structure (`tenantId` vs `sistemJangkar.tenantId`).
* **TD-02**: Legacy direct Firestore queries in administrative repair tools (`schemaRepairService.ts`).
* **TD-03**: Absence of centralized query builders adhering strictly to `BaseRepository`.

---

## 12. Recommended Next Work Orders

1. **WO-FIRESTORE-SCAN-REMOVAL-001**: Remove all collection scan fallbacks from `CacheService.ts` and repositories.
2. **WO-DEXIE-READ-PRIORITY-001**: Enforce Dexie-first read priority with strict offline fallback handling.
3. **WO-TENANT-STANDARDIZATION-001**: Establish single-tenant key governance across all entity schemas.
