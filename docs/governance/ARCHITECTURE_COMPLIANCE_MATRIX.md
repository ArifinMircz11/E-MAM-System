# Architecture Compliance Matrix
**System:** e-MAM System (Enterprise Information System)  
**Governance Standard:** EAOM (Enterprise Architecture Operating Model) & Architecture Freeze  

---

## 1. Compliance Rules & Validation Table

| Rule | Enforcement Mechanism | Status / Target |
| :--- | :--- | :--- |
| **UI Layer Isolation** | UI components & pages are strictly prohibited from importing or invoking Firebase/Firestore SDKs or direct database tables. | PASS |
| **Hooks Layer Boundary** | Hooks manage state, subscriptions, and orchestration; they must not execute direct database queries or business validation. | PASS |
| **Service Layer Business Logic** | All business rules, workflows, and RBAC evaluations must reside exclusively within the Service Layer. | PASS |
| **Repository Pattern Enforcement** | All data access must pass through typed Repositories extending `BaseRepository` backed by Dexie. | PASS |
| **Sync Engine Gateway** | Remote Firestore reads and writes are restricted exclusively to the `SyncEngine` and `SyncDataSource`. | PASS |
| **SecurityContext Governance** | Every repository and service operation must be bound to a valid, non-null `SecurityContext`. | PASS |
| **Zero Hardcoded Roles** | Roles and permissions must be dynamically evaluated via the Authorization/Permission engine rather than hardcoded UI strings. | PASS |

---

## 2. Dependency Graph & Directional Rules

```
UI Components / Pages
        │
        ▼
   Hooks Layer
        │
        ▼
  Service Layer
        │
        ▼
Repository Layer (BaseRepository)
        │
        ▼
 Dexie (Operational DB)
        │
        ▼
    Sync Engine
        │
        ▼
 Firestore (Source of Truth)
```

No upward or circular dependency is permitted. Repositories must never import UI, Hooks, or Firebase directly.
