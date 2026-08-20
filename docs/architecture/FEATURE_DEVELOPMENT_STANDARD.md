# Feature Development Standard (e-MAM System Enterprise v7.8)

This document establishes the mandatory standard for developing any domain module or feature in e-MAM System Enterprise v7.8, adhering strictly to **Architecture Freeze**, **Offline-First**, **Permission-Driven**, and **Repository-Based** principles.

---

## 1. Architectural Layers & Data Flow

Every feature must follow the strict 10-layer operational flow:

```
UI Components (Presentation)
     ↓
Feature Hooks (Lifecycle & State Orchestration)
     ↓
Feature State (Zustand UI State)
     ↓
Feature Service (Business Logic & Workflow)
     ↓
AuthorizationService (Permission & Scope Enforcement)
     ↓
Repository Contract (ITemplateRepository)
     ↓
Repository Implementation (DexieTemplateRepository)
     ↓
IndexedDB (Dexie Operational Database)
     ↓
Sync Queue (Delta Offline Actions)
     ↓
Sync Engine (Firestore Gateway)
```

**Forbidden Cross-Layer Violations:**
- ❌ UI components calling Firestore directly.
- ❌ UI components evaluating raw roles (`user.role === 'admin'`).
- ❌ Repositories importing Firebase SDK or UI stores.
- ❌ Features containing inline database queries without repositories.

---

## 2. Directory Structure (`src/features/[domain]/`)

Each feature domain must be self-contained with the following standard layout:

```
src/features/template/
├── pages/
│   └── TemplatePage.tsx
├── components/
│   ├── TemplateTable.tsx
│   ├── TemplateForm.tsx
│   └── TemplateCard.tsx
├── hooks/
│   └── useTemplate.ts
├── services/
│   └── TemplateService.ts
├── state/
│   └── templateStore.ts
├── schemas/
│   └── template.schema.ts
├── validators/
│   └── template.validator.ts
├── types/
│   └── template.types.ts
├── constants/
│   └── template.constants.ts
├── permissions.ts
├── routes.ts
└── index.ts
```

---

## 3. Mandatory Contracts & Rules

### A. Permission Contract (`permissions.ts`)
Define all domain permissions explicitly referencing the Master Permission Catalog.

### B. Route Contract (`routes.ts`)
Each route registration must declare the required permission. NavigationResolver filters routes dynamically based on the active `SecurityContext`.

### C. Service Layer (`services/`)
- Sole location for domain rules, validation, audit triggers, and sync decisions.
- Must invoke `AuthorizationService.assertPermission(...)` before executing any mutation or read.

### D. Repository Layer (`repositories/`)
- Implements `IRepository<T>` extending `BaseRepository<T>`.
- Enforces tenant isolation automatically via `SecurityContext`.
- Registers mutations in `sync_queue` for seamless offline synchronization.
